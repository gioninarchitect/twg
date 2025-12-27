# PRD Additions - Hybrid Cloud Architecture

**Purpose:** Add these sections to your existing PRD to document the hybrid local + cloud storage architecture.

---

## NEW SECTION: Data Architecture

### Hybrid Storage Model

The app uses a **local-first with optional cloud sync** architecture:

```
User Action
    |
    v
+----------------+
| Local Storage  |  <-- Instant (works offline)
| (AsyncStorage) |
+----------------+
    |
    v (background, when online)
+----------------+
| Cloud Storage  |  <-- Backup & sync
| (Supabase)     |
+----------------+
```

### Core Principles

1. **Local-First**: All data writes go to device storage first
   - App works 100% offline
   - Zero latency for saves
   - No network dependency for core features

2. **Cloud Backup**: Data syncs to Supabase when online
   - Automatic background sync
   - Recovery if app is reinstalled
   - Cross-device sync for signed-in users

3. **Conflict Resolution**: Most recent timestamp wins
   - `updated_at` field on all records
   - Cloud and local both tracked
   - Merge on app launch

### Supabase Configuration

```
URL: https://hqzyzioyospxwfzrdwkj.supabase.co
Project: Tea With God
```

**Database Tables:**
- `user_progress` - Journey progress, milestones, days completed
- `journal_entries` - Encrypted journal entries with voice notes
- `access_codes` - User access level (GUEST/FULL) and redeemed codes
- `notification_settings` - Reminder preferences
- `valid_codes` - Master list of valid book codes (admin-managed)

**Security:**
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Auth tokens stored in SecureStore

---

## UPDATED SECTION: Authentication

### Auth Modes

1. **Guest Mode** (No Account)
   - Access Days 1-3 only
   - All data local only
   - Cannot recover if app deleted
   - Prompted to create account for full access

2. **Authenticated Mode** (Supabase Auth)
   - Email/password sign up
   - Access to all unlocked content
   - Data synced to cloud
   - Cross-device recovery
   - Can still work offline

### Auth Flow

```
App Launch
    |
    v
Check Local Auth Token
    |
    +-- Valid Token --> Load User, Pull Cloud Data
    |
    +-- No Token --> Show Auth Screen
                        |
                        +-- Sign Up --> Create Account --> Sync Local to Cloud
                        |
                        +-- Sign In --> Pull Cloud Data --> Merge with Local
                        |
                        +-- Continue as Guest --> Local Only
```

---

## UPDATED SECTION: Offline Capabilities

### What Works Offline

| Feature | Offline Support |
|---------|-----------------|
| Read devotional content | Full (bundled JSON) |
| Complete days | Full (saves locally) |
| Journal entries | Full (saves locally) |
| Voice notes | Full (saves locally) |
| Unlock with code | Partial (needs online to validate new codes, cached codes work) |
| Crisis prayers | Full (bundled) |
| Audio playback | Partial (only cached/bundled audio) |

### Sync Behavior

| Scenario | Behavior |
|----------|----------|
| App opens (online) | Pull cloud data, merge with local |
| Save action (online) | Save local first, then sync to cloud |
| Save action (offline) | Save local only, sync when back online |
| Come back online | Auto-sync queued changes |

---

## UPDATED SECTION: Access Code System

### Code Validation

**Local Validation** (works offline for known codes):
```typescript
const VALID_CODES = {
  'TEAWITHGOD2025': { level: 'FULL', description: 'Book Purchase Code' },
  'HEALING40DAYS': { level: 'FULL', description: 'Book Purchase Code' },
  'KINTSUGI2025': { level: 'FULL', description: 'Special Edition Code' },
  'BETAREVIEW': { level: 'FULL', description: 'Beta Reviewer Access' },
};
```

**Cloud Validation** (when online):
- Check `valid_codes` table for dynamic codes
- Supports expiring codes, max uses, campaign tracking
- Falls back to local validation if offline

### Code Redemption Flow

```
User enters code
    |
    v
Check local cache first
    |
    +-- Found --> Grant access locally --> Sync to cloud
    |
    +-- Not found --> Check cloud (if online)
                        |
                        +-- Valid --> Grant access --> Cache locally
                        |
                        +-- Invalid --> Show error
```

---

## NEW SECTION: Sync Context API

### Available Methods

```typescript
interface SyncContextType {
  // Auth
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  signUp: (email, password) => Promise<{ error }>;
  signIn: (email, password) => Promise<{ error }>;
  signOut: () => Promise<void>;
  signInAsGuest: () => Promise<void>;

  // Sync
  isSyncing: boolean;
  lastSyncTime: string | null;
  pendingChanges: number;
  isOnline: boolean;
  queueSync: (table, action, data) => Promise<void>;
  syncNow: () => Promise<void>;
  pullFromCloud: () => Promise<void>;
}
```

### Provider Hierarchy

```typescript
<SafeAreaProvider>
  <SyncProvider>           // Auth + cloud sync
    <NotificationProvider> // Local notifications
      <JournalProvider>    // Encrypted journal
        <AccessProvider>   // Content gating
          <ProgressProvider> // Anti-shame progress
            <AppContent />
          </ProgressProvider>
        </AccessProvider>
      </JournalProvider>
    </NotificationProvider>
  </SyncProvider>
</SafeAreaProvider>
```

---

## Setup Instructions

### 1. Supabase Dashboard Setup

Run the SQL schema in Supabase SQL Editor:
```
/supabase/schema.sql
```

This creates:
- All required tables
- Row Level Security policies
- Helper functions (code redemption)
- Initial valid codes
- Auto-update triggers

### 2. Environment Variables

For production, move credentials to environment:
```bash
SUPABASE_URL=https://hqzyzioyospxwfzrdwkj.supabase.co
SUPABASE_ANON_KEY=sb_publishable_sr7Yk8Rtrv0t02DJ6Qxmig_3A_j8kCH
```

### 3. Authentication Settings

In Supabase Dashboard > Authentication:
- Enable Email provider
- Configure email templates (optional)
- Set password requirements

---

## Testing the Hybrid Architecture

### Test Scenarios

1. **Offline Save**
   - Enable airplane mode
   - Complete a day / write journal
   - Verify local save works
   - Disable airplane mode
   - Verify sync happens

2. **Cross-Device Sync**
   - Sign in on Device A
   - Complete days, write entries
   - Sign in on Device B
   - Verify data appears

3. **Conflict Resolution**
   - Edit same entry offline on two devices
   - Bring both online
   - Verify most recent wins

4. **Guest to Authenticated**
   - Use app as guest
   - Create account
   - Verify local data syncs to cloud
