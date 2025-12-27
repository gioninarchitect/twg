# Tea With God - Payment & Onboarding Flow

## Current Implementation Status

### What's Built

| Component | Status | Description |
|-----------|--------|-------------|
| Website Checkout | Done | 3-step form (details, EFT payment, confirmation) |
| Order Creation API | Done | Creates order in Supabase with pending status |
| Proof Upload | Done | Uploads to Supabase Storage |
| Admin Dashboard | Done | View orders, verify payments, generate codes |
| Mobile App Guest Mode | Done | Time-locked 3-day preview |
| Code Redemption (App) | Partial | Works but codes are hardcoded, not validated via API |

---

## Current User Journey

```
┌──────────────────────────────────────────────────────────────────┐
│                      WEBSITE CHECKOUT                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User visits teawithgod.com and clicks "Get Started"         │
│                    ↓                                             │
│  2. Selects plan: Book (R99) | Journey (R149) | Premium (R249)   │
│                    ↓                                             │
│  3. Enters details: Name, Email, WhatsApp                        │
│                    ↓                                             │
│  4. Sees bank details + unique order reference (TWG-XXXXXX)      │
│                    ↓                                             │
│  5. Makes EFT payment to FNB account                             │
│                    ↓                                             │
│  6. Uploads proof of payment (screenshot/PDF)                    │
│                    ↓                                             │
│  7. Receives confirmation: "We'll verify within 1-2 hours"       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                      ADMIN VERIFICATION                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Admin sees new order in dashboard (status: proof_submitted)  │
│                    ↓                                             │
│  2. Admin reviews proof of payment                               │
│                    ↓                                             │
│  3. Admin clicks "Verify" → Generates access code                │
│                    ↓                                             │
│  4. MANUAL: Admin sends code via email/WhatsApp to customer      │
│     (This step is NOT automated yet)                             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                      MOBILE APP FLOW                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  OPTION A: Guest Preview (No Code)                               │
│  ─────────────────────────────────                               │
│  1. Download app from Play Store / PWA                           │
│  2. Start using immediately as GUEST                             │
│  3. Day 1: Available immediately                                 │
│  4. Day 2: Unlocks after 24 hours                                │
│  5. Day 3: Unlocks after 48 hours                                │
│  6. After Day 3 → Prompted to enter access code                  │
│                                                                  │
│  OPTION B: With Access Code                                      │
│  ──────────────────────────────                                  │
│  1. Download app                                                 │
│  2. Enter access code (received via email/WhatsApp)              │
│  3. All 40 days unlocked immediately                             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## What's Missing (Gaps)

### 1. Automated Email on Verification
Currently when admin verifies payment, the code is generated but:
- Admin has to manually copy the code
- Admin has to manually send email/WhatsApp
- No email template is used

**Fix needed:** After verification, automatically send email with:
- Access code
- Download links (Play Store, PWA)
- Getting started instructions

### 2. Server-Side Code Validation
Currently the mobile app has hardcoded valid codes:
```typescript
const VALID_CODES = {
  'TEAWITHGOD2025': { level: 'FULL' },
  'REVIEW': { level: 'FULL' },
  // etc
};
```

**Fix needed:** App should call API to validate code:
```
POST /api/v1/auth/redeem-code
Body: { code: "TWG-XXXX-XXXX-XXXX" }
Response: { success: true, accessLevel: "PILGRIM" }
```

### 3. Order Status Email Notifications
No automatic emails for:
- Order confirmation (when user places order)
- Payment received (when proof is uploaded)
- Access code delivery (when admin verifies)

---

## Proposed Complete Flow

```
User Journey                    Backend                         Admin
───────────                    ─────────                       ──────

1. Select plan
      ↓
2. Enter details
      ↓
3. Submit ─────────────────→ Create Order ──────────────→ New order appears
                              (status: pending)
      ↓
4. See bank details
      ↓
5. Make EFT payment
      ↓
6. Upload proof ───────────→ Update Order ──────────────→ Status changes
                              (status: proof_submitted)
      ↓
7. Get confirmation ←──────── Send confirmation email
                                                              ↓
                                                         8. Review proof
                                                              ↓
                                                         9. Click "Verify"
                              ↓                               ↓
                         Generate Code ←────────────── Verification action
                              ↓
                         Send email with:
                         - Access code
                         - Download links
                         - Instructions
                              ↓
10. Receive email ←────────────
      ↓
11. Download app
      ↓
12. Enter code ────────────→ Validate code ────────────→ Code marked used
      ↓                      (via API)
13. Full access!
```

---

## Technical Implementation Needed

### 1. Email Service Setup (Already configured in .env)
```
SMTP_HOST=mail.cleva-ai.co.za
SMTP_PORT=465
SMTP_USER=twg@cleva-ai.co.za
EMAIL_FROM=twg@cleva-ai.co.za
```

### 2. Backend Endpoints Needed

| Endpoint | Purpose | Status |
|----------|---------|--------|
| `POST /api/v1/orders` | Create order | Done |
| `POST /api/v1/orders/:ref/proof` | Upload proof | Done |
| `POST /api/v1/admin/orders/:ref/verify` | Verify & generate code | Done |
| `POST /api/v1/admin/orders/:ref/send-code` | Send code email | NOT BUILT |
| `POST /api/v1/auth/redeem-code` | Validate code (needs server validation) | Partial |

### 3. Email Templates Needed

**Order Confirmation**
- Subject: "Your Tea With God Order Received"
- Content: Order ref, bank details, payment instructions

**Code Delivery**
- Subject: "Your Tea With God Access Code"
- Content: Access code, download links, getting started

**Verification Complete**
- Subject: "Payment Verified - Download Your App"
- Content: Access code, download links, what to expect

---

## Payment Options Analysis

| Option | Pros | Cons | Complexity |
|--------|------|------|------------|
| EFT (Current) | No fees, familiar in SA | Manual verification, delays | Low |
| PayFast | Auto-verify, instant | Fees (2-3%), setup needed | Medium |
| Stripe | Global, auto-verify | Fees (2.9%), not SA-friendly | Medium |
| Yoco | SA-focused, auto-verify | Fees (2.6%), setup needed | Medium |

**Recommendation:** Keep EFT as primary for SA market, add PayFast as optional for instant access.

---

## Immediate Action Items

1. **Add email sending to verify endpoint** - When admin verifies, auto-send access code email
2. **Update mobile app** - Change from hardcoded codes to API validation
3. **Add email templates** - Professional branded emails
4. **Test full flow** - End-to-end checkout to app access

---

## Testing the Current Flow

### Website Checkout
```bash
# Open checkout page
http://localhost:8080/checkout.html?plan=journey

# After completing checkout, order appears in:
# - Supabase orders table
# - Admin dashboard at http://localhost:8080/admin/
```

### Admin Verification
```bash
# Login: twg@cleva-ai.co.za / password123
# Navigate to Orders section
# Click on pending order
# Click "Verify" to generate code
# Code is shown but NOT automatically sent (this is the gap)
```

### Mobile App
```bash
# Download from Play Store or use PWA
# Start as guest → Get 3 days free (time-locked)
# Enter code "REVIEW" → Full access (for testing)
# Or enter generated code (TWG-XXXX-XXXX-XXXX)
```

---

## Questions to Decide

1. **Should users pay BEFORE or AFTER download?**
   - Current: Before (pay on website, get code, then download)
   - Alternative: Download free, pay in-app to unlock full access

2. **EFT only or add instant payment?**
   - Current: EFT only (manual verification)
   - Alternative: Add PayFast for instant verification

3. **How long should guest preview last?**
   - Current: 3 days (one day unlocks at a time)
   - Could extend to 7 days to give better experience

4. **What happens if payment verification takes too long?**
   - Need SLA (e.g., "within 2 business hours")
   - Need escalation process

---

*Last updated: 2025-12-27*
