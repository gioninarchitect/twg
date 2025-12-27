# Admin Dashboard & B2B Strategy
## Tea With God - Author & Institutional Access

---

## Part 1: Author Admin Dashboard

### Current Backend APIs (Already Implemented)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/orders` | POST | Create new order |
| `/api/v1/orders/:orderRef/proof` | POST | Upload payment proof |
| `/api/v1/orders/:orderRef` | GET | Get order status |
| `/api/v1/admin/orders` | GET | Get all orders by status |
| `/api/v1/admin/orders/:orderRef/verify` | POST | Verify & generate access code |
| `/api/v1/admin/generate-codes` | POST | Bulk generate access codes |

### Admin Dashboard Features Needed

#### 1. Order Management
```
┌─────────────────────────────────────────────────────────────┐
│ Tea With God - Admin Dashboard                              │
├─────────────────────────────────────────────────────────────┤
│ Orders: [Pending: 5] [Proof Submitted: 12] [Verified: 89]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Order #TWG-2024-ABC                     PROOF SUBMITTED │ │
│ │ Name: Sarah Smith                                       │ │
│ │ Email: sarah@email.com                                  │ │
│ │ Phone: +27 82 555 1234                                  │ │
│ │ Plan: Premium Journey (R249)                            │ │
│ │ Date: Dec 26, 2024                                      │ │
│ │                                                         │ │
│ │ [View Proof] [Approve] [Reject] [Email Customer]        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 2. Dashboard Metrics
- Total orders (daily/weekly/monthly)
- Revenue tracking
- Plan breakdown (Book vs Journey vs Premium)
- Conversion rate (visitors → purchases)
- Access code redemption rate

#### 3. Access Code Management
- Generate bulk codes for events/promotions
- Track which codes are used
- Expire unused codes
- Create campaign-specific batches

#### 4. Customer Communication
- Email templates for order confirmation
- Access code delivery
- Follow-up for unused codes
- Support ticket view

### Implementation Plan

```
/admin/
├── dashboard.html       # Main metrics overview
├── orders.html          # Order list with filters
├── order-detail.html    # Single order view
├── codes.html           # Access code management
├── customers.html       # Customer list
├── settings.html        # Admin settings
├── css/
│   └── admin.css        # Admin-specific styling
└── js/
    └── admin.js         # API interactions
```

### Security Considerations

1. **Admin Authentication**
   - Separate admin login (not same as user auth)
   - JWT with short expiry (1 hour)
   - IP whitelisting option
   - 2FA for production

2. **API Protection**
   - Admin routes require admin token
   - Rate limiting on sensitive endpoints
   - Audit logging for all admin actions

---

## Part 2: B2B Strategy for Churches & Institutions

### Target Market

| Segment | Description | Potential Volume |
|---------|-------------|------------------|
| Churches | Local congregations with women's groups | 20-100 users each |
| Ministries | Women's retreat centers, healing ministries | 50-500 users |
| Counseling Centers | Christian counseling practices | 10-50 users |
| Schools | Christian schools, Bible colleges | 100-1000 users |
| Corporates | Faith-based companies for employee wellness | 50-500 users |

### B2B Product Tiers

#### Tier 1: Church Starter (R5,000/year)
- Up to 50 access codes
- Group dashboard
- Monthly usage reports
- Email support

#### Tier 2: Ministry Plus (R15,000/year)
- Up to 200 access codes
- Custom welcome message
- White-label option (remove TWG branding)
- Priority support
- Quarterly strategy call

#### Tier 3: Institution Enterprise (Custom pricing)
- Unlimited access codes
- Full white-label
- API integration for existing systems
- Dedicated account manager
- Custom content modules
- SAML/SSO integration
- On-premise option

### B2B Technical Requirements

#### 1. Organization Management
```typescript
interface Organization {
  orgId: string;
  name: string;
  type: 'church' | 'ministry' | 'school' | 'corporate';
  tier: 'starter' | 'plus' | 'enterprise';
  adminUsers: AdminUser[];
  codeAllocation: number;
  codesUsed: number;
  customBranding?: {
    logo?: string;
    primaryColor?: string;
    welcomeMessage?: string;
  };
  createdAt: Date;
  renewalDate: Date;
}
```

#### 2. Group Analytics Dashboard
```
┌─────────────────────────────────────────────────────────────┐
│ Grace Community Church - Group Dashboard                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Members: 45/50 codes used                                   │
│ Active This Week: 32 (71%)                                  │
│ Average Progress: Day 18                                    │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Phase Breakdown          │ Completion Rate            │   │
│ │ Valley (D1-14):   100%   │ ████████████████████ 100%  │   │
│ │ Waiting (D15-21): 78%    │ ███████████████      78%   │   │
│ │ Rising (D22-33):  45%    │ █████████            45%   │   │
│ │ Becoming (D34-40): 12%   │ ██                   12%   │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ [Download Report] [Generate Codes] [Invite Members]         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 3. Bulk Features Needed

**Bulk Code Generation**
```javascript
POST /api/v1/b2b/organizations/:orgId/codes
{
  count: 50,
  expiresIn: "365d",
  prefix: "GRACE-"  // Optional custom prefix
}
```

**Bulk User Import**
```javascript
POST /api/v1/b2b/organizations/:orgId/import
{
  users: [
    { email: "member1@church.org", name: "Jane Doe" },
    { email: "member2@church.org", name: "Mary Smith" }
  ],
  sendWelcomeEmail: true
}
```

**Group Analytics**
```javascript
GET /api/v1/b2b/organizations/:orgId/analytics
Response: {
  activeUsers: 32,
  averageProgress: 18.5,
  phaseBreakdown: { valley: 45, waiting: 32, rising: 18, becoming: 5 },
  weeklyEngagement: [{ week: "W1", active: 40 }, ...]
}
```

### Privacy Considerations for B2B

**Critical**: Organizations should NOT see:
- Individual journal entries
- Personal notes
- Detailed emotional data

Organizations CAN see:
- Aggregate completion rates
- Overall engagement metrics
- Anonymous struggle areas (e.g., "3 users in crisis resources this week")

### B2B Sales Process

1. **Lead Generation**
   - Partner with Christian conferences
   - Women's ministry network outreach
   - Church leadership publications
   - Dr. Amen partnership (if successful)

2. **Demo & Trial**
   - Free 14-day trial with 10 codes
   - Personalized demo for decision makers
   - Case study from pilot churches

3. **Onboarding**
   - Admin training session
   - Code distribution guidance
   - Launch support for first 30 days

4. **Retention**
   - Quarterly check-ins
   - New feature announcements
   - Annual renewal incentives

---

## Implementation Priorities

### Phase 1: Author Admin Dashboard (Q1 2025)
1. Basic order management UI
2. Payment verification workflow
3. Access code generation
4. Email notification templates

### Phase 2: B2B Foundation (Q2 2025)
1. Organization entity in database
2. Bulk code generation API
3. Basic group dashboard
4. Starter tier launch

### Phase 3: B2B Expansion (Q3 2025)
1. White-label options
2. Advanced analytics
3. Plus tier launch
4. API documentation

### Phase 4: Enterprise (Q4 2025)
1. SSO integration
2. Custom content modules
3. Enterprise pricing model
4. Account management portal

---

## Database Schema Additions

```sql
-- Organizations table
CREATE TABLE organizations (
  org_id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('church', 'ministry', 'school', 'corporate')),
  tier TEXT CHECK (tier IN ('starter', 'plus', 'enterprise')),
  code_allocation INTEGER DEFAULT 50,
  codes_used INTEGER DEFAULT 0,
  custom_branding JSONB,
  admin_contact_email TEXT,
  admin_contact_phone TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  renewal_date TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- Organization admins
CREATE TABLE org_admins (
  admin_id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(org_id),
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK (role IN ('owner', 'admin', 'viewer')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Organization codes (links access codes to orgs)
CREATE TABLE org_codes (
  code_id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(org_id),
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  redeemed_by UUID REFERENCES users(user_id),
  redeemed_at TIMESTAMP
);
```

---

## Revenue Projections

| Model | Year 1 | Year 2 | Year 3 |
|-------|--------|--------|--------|
| Individual Sales (R99-R249) | R500k | R1.2M | R2M |
| B2B Starter (R5k x 20 orgs) | R100k | R250k | R400k |
| B2B Plus (R15k x 5 orgs) | R75k | R225k | R450k |
| B2B Enterprise (R50k x 2 orgs) | R100k | R300k | R600k |
| **Total** | **R775k** | **R1.975M** | **R3.45M** |

---

## Next Steps

1. [ ] Build Author Admin Dashboard (HTML/JS, connect to existing APIs)
2. [ ] Add organization tables to database
3. [ ] Create B2B sales materials (deck, pricing page)
4. [ ] Pilot with 2-3 churches
5. [ ] Gather feedback, iterate
6. [ ] Launch B2B publicly

---

*Document created: December 26, 2024*
*For: Tea With God Business Development*
