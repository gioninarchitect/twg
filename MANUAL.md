# Tea With God - Complete Operations Manual

**Last Updated:** January 4, 2026
**Purpose:** Everything you need to manage this project without AI assistance

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Local Development Setup](#local-development-setup)
3. [Folder Structure](#folder-structure)
4. [Server Information](#server-information)
5. [Deployment Guide](#deployment-guide)
6. [Common Tasks](#common-tasks)
7. [Troubleshooting](#troubleshooting)
8. [Code Editing Guide](#code-editing-guide)
9. [Database & Backend](#database--backend)
10. [Emergency Procedures](#emergency-procedures)

---

## Project Overview

Tea With God is a 40-day healing companion app for women. It consists of:

| Component | Technology | Location |
|-----------|------------|----------|
| Marketing Website | HTML/CSS/JS | `/website/` |
| PWA Mobile App | React Native + Expo | `/mobile/` |
| Backend API | Node.js + Express | `/backend/` |
| Admin Dashboard | HTML/JS | `/website/admin/` |
| B2B Portal | HTML/JS | `/website/b2b/` |

**Live URLs:**
- Staging: https://twg.cleva-ai.co.za
- Production: https://teawithgod.com

---

## Local Development Setup

### Prerequisites
- Node.js v18+ installed
- npm or yarn
- Git
- Code editor (VS Code recommended)
- Terminal access

### First Time Setup

```bash
# Navigate to project
cd /Users/florisolivier/TWGAPP/tea-with-God

# Install mobile app dependencies
cd mobile
npm install

# Install backend dependencies
cd ../backend
npm install
```

### Running Locally

#### Mobile App (Expo)
```bash
cd /Users/florisolivier/TWGAPP/tea-with-God/mobile

# Start Expo dev server
npx expo start

# Or start web version directly
npx expo start --web
```

#### Backend Server
```bash
cd /Users/florisolivier/TWGAPP/tea-with-God/backend

# Start server
node src/server.js

# Server runs on http://localhost:3000
```

#### Website (Static)
```bash
cd /Users/florisolivier/TWGAPP/tea-with-God/website

# Use any static server
npx serve -l 8081 .

# Access at http://localhost:8081
```

---

## Folder Structure

```
tea-with-God/
├── mobile/                    # React Native Expo app (PWA source)
│   ├── src/
│   │   ├── screens/           # App screens
│   │   │   ├── brainGames/    # All 6 brain games
│   │   │   ├── DashboardScreen.tsx
│   │   │   ├── DevotionalScreen.tsx
│   │   │   └── JournalScreen.tsx
│   │   ├── components/        # Reusable components
│   │   ├── services/          # API services
│   │   ├── theme/             # Colors, typography
│   │   └── worldModel/        # AI/analytics
│   ├── assets/                # Images, fonts
│   ├── app.json               # Expo config
│   └── package.json
│
├── website/                   # Marketing website
│   ├── index.html             # Homepage
│   ├── checkout.html          # Purchase page
│   ├── admin/                 # Admin dashboard
│   │   └── index.html
│   ├── b2b/                   # B2B portal
│   │   └── index.html
│   ├── app/                   # Built PWA (from mobile/dist)
│   ├── images/
│   ├── css/
│   └── js/
│
├── backend/                   # Node.js API
│   ├── src/
│   │   ├── server.js          # Main entry point
│   │   ├── database/          # SQLite schema
│   │   └── services/          # Email, Yoco, etc.
│   ├── data/                  # SQLite database files
│   ├── protected/             # Protected downloads (PDF)
│   │   └── books/
│   └── .env                   # Environment variables (NEVER commit)
│
├── CLAUDE.md                  # AI instructions
├── NEXT_SESSION.md            # Session handoff notes
└── MANUAL.md                  # This file
```

---

## Server Information

### Server Access

| Item | Value |
|------|-------|
| **IP Address** | 154.66.196.12 |
| **SSH User** | root |
| **SSH Command** | `ssh root@154.66.196.12` |

### Server Paths

| What | Path |
|------|------|
| Website Root | `/var/www/twg` |
| PWA App | `/var/www/twg/app` |
| Backend | `/var/www/twg/backend` |
| Flipbook | `/var/www/twg/flipbook` |
| Nginx Config | `/etc/nginx/sites-available/` |

### PM2 Process Management

```bash
# SSH into server first
ssh root@154.66.196.12

# Check running processes
pm2 list

# Restart backend
pm2 restart twg-api

# View logs
pm2 logs twg-api

# Stop backend
pm2 stop twg-api

# Start backend
pm2 start twg-api
```

### Backend Environment Variables

Located at `/var/www/twg/backend/.env`:

```
# Database
DATABASE_PATH=./data/tea_with_god.db

# Yoco Payment (LIVE KEYS - DO NOT SHARE)
YOCO_PUBLIC_KEY=pk_live_xxxxx
YOCO_SECRET_KEY=sk_live_xxxxx

# Email (SMTP)
SMTP_HOST=mail.example.com
SMTP_USER=noreply@teawithgod.com
SMTP_PASS=xxxxx

# Admin
ADMIN_EMAILS=admin@teawithgod.com

# Owner Access Codes
OWNER_CODES=REVIEW,OWNER2025,BETAREVIEW,TEAWITHGOD2025
```

**CRITICAL:** Never overwrite this file during deployment. Always exclude `.env` from tarballs.

---

## Deployment Guide

### Deploy PWA (Mobile App)

**When to use:** After making changes to mobile app code

```bash
# Step 1: Build the PWA
cd /Users/florisolivier/TWGAPP/tea-with-God/mobile
npx expo export -p web

# Step 2: Copy to website folder
rm -rf ../website/app/*
cp -r dist/* ../website/app/

# Step 3: Deploy to server
cd /Users/florisolivier/TWGAPP/tea-with-God
tar --exclude='._*' --exclude='.DS_Store' -czf /tmp/twg-pwa.tar.gz -C website app
scp /tmp/twg-pwa.tar.gz root@154.66.196.12:/tmp/
ssh root@154.66.196.12 "cd /var/www/twg && rm -rf app && tar -xzf /tmp/twg-pwa.tar.gz && chown -R www-data:www-data app && chmod -R 755 app && rm /tmp/twg-pwa.tar.gz && echo 'PWA deployed'"
```

### Deploy Website

**When to use:** After editing HTML/CSS/JS files in `/website/`

```bash
cd /Users/florisolivier/TWGAPP/tea-with-God/website
tar --exclude='._*' --exclude='.DS_Store' --exclude='*.txt' -czf /tmp/twg-website.tar.gz .
scp /tmp/twg-website.tar.gz root@154.66.196.12:/tmp/
ssh root@154.66.196.12 "cd /var/www/twg && tar -xzf /tmp/twg-website.tar.gz && chown -R www-data:www-data /var/www/twg && chmod -R 755 /var/www/twg && rm /tmp/twg-website.tar.gz && echo 'Website deployed'"
```

### Deploy Backend

**When to use:** After editing backend code

**IMPORTANT:** Never include `.env` or `*.db` files!

```bash
cd /Users/florisolivier/TWGAPP/tea-with-God/backend
tar --exclude='*.db' --exclude='node_modules' --exclude='.env' -czf /tmp/twg-backend.tar.gz .
scp /tmp/twg-backend.tar.gz root@154.66.196.12:/tmp/
ssh root@154.66.196.12 "cd /var/www/twg/backend && tar -xzf /tmp/twg-backend.tar.gz && npm install --production && pm2 restart twg-api && rm /tmp/twg-backend.tar.gz && echo 'Backend deployed'"
```

---

## Common Tasks

### Edit a Brain Game

1. Open the file:
   ```
   /Users/florisolivier/TWGAPP/tea-with-God/mobile/src/screens/brainGames/[GameName].tsx
   ```

2. Make your changes

3. Test locally:
   ```bash
   cd /Users/florisolivier/TWGAPP/tea-with-God/mobile
   npx expo start --web
   ```

4. Build and deploy (see Deploy PWA above)

### Edit Website Pages

1. Edit files in `/website/` folder
2. Test locally with `npx serve`
3. Deploy (see Deploy Website above)

### Edit Backend API

1. Edit files in `/backend/src/`
2. Test locally with `node src/server.js`
3. Deploy (see Deploy Backend above)

### Add a New Owner Access Code

1. SSH into server: `ssh root@154.66.196.12`
2. Edit env file: `nano /var/www/twg/backend/.env`
3. Add code to `OWNER_CODES` (comma-separated)
4. Restart: `pm2 restart twg-api`

### Check Server Logs

```bash
ssh root@154.66.196.12 "pm2 logs twg-api --lines 100"
```

### Restart Backend

```bash
ssh root@154.66.196.12 "pm2 restart twg-api"
```

---

## Troubleshooting

### PWA Shows Old Version

1. Clear browser cache (Ctrl+Shift+R)
2. Try incognito mode
3. Check if deployment completed
4. Verify files on server: `ssh root@154.66.196.12 "ls -la /var/www/twg/app"`

### Backend Not Responding

```bash
# Check if running
ssh root@154.66.196.12 "pm2 list"

# Check logs for errors
ssh root@154.66.196.12 "pm2 logs twg-api --lines 50"

# Restart
ssh root@154.66.196.12 "pm2 restart twg-api"
```

### 502 Bad Gateway

Usually means backend crashed:
```bash
ssh root@154.66.196.12 "pm2 restart twg-api"
```

### Database Issues

Database is at `/var/www/twg/backend/data/tea_with_god.db`

```bash
# Backup database
ssh root@154.66.196.12 "cp /var/www/twg/backend/data/tea_with_god.db /tmp/backup-$(date +%Y%m%d).db"
```

### Permission Errors

```bash
ssh root@154.66.196.12 "chown -R www-data:www-data /var/www/twg && chmod -R 755 /var/www/twg"
```

### Expo Build Fails

```bash
cd /Users/florisolivier/TWGAPP/tea-with-God/mobile

# Clear cache
npx expo start --clear

# Or reinstall
rm -rf node_modules
npm install
```

---

## Code Editing Guide

### Brain Games Location

All brain games are in:
```
/mobile/src/screens/brainGames/
```

| Game | File |
|------|------|
| Breathe with God | `BreatheWithGod.tsx` |
| Gratitude Garden | `GratitudeGarden.tsx` |
| Scripture Palace | `ScripturePalace.tsx` |
| Thought Detective | `ThoughtDetective.tsx` |
| Body Scan Release | `BodyScanRelease.tsx` |
| Pattern Peace | `PatternPeace.tsx` |
| Hub/Menu | `BrainGamesHub.tsx` |

### Theme Colors

Located at `/mobile/src/theme/colors.ts`:

```typescript
export const COLORS = {
  background: '#0D0D0D',      // Dark background
  backgroundCard: '#1a1a1a', // Card background
  textPrimary: '#FAFAFA',    // White text
  textSecondary: 'rgba(250,250,250,0.6)',
  gold: '#D4AF37',           // Accent color
};
```

### Adding New Screens

1. Create file in `/mobile/src/screens/`
2. Add to navigation in `/mobile/src/navigation/`
3. Export from index file

---

## Database & Backend

### SQLite Database

Location: `/backend/data/tea_with_god.db`

Key tables:
- `users` - User accounts
- `orders` - Purchases
- `access_codes` - Book access codes

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/health` | GET | Health check |
| `/api/v1/orders` | POST | Create order |
| `/api/v1/verify-code` | POST | Verify access code |
| `/api/v1/admin/stats` | GET | Admin statistics |

### Yoco Payments

Configured via environment variables. Live keys on server.

Test keys for local development:
- Public: `pk_test_xxxxx`
- Secret: `sk_test_xxxxx`

---

## Emergency Procedures

### Site Down - Quick Fix

```bash
# Check nginx
ssh root@154.66.196.12 "systemctl status nginx"

# Restart nginx
ssh root@154.66.196.12 "systemctl restart nginx"

# Check backend
ssh root@154.66.196.12 "pm2 restart twg-api"
```

### Rollback Deployment

If a bad deployment breaks something:

```bash
# Check git history locally
git log --oneline -10

# Reset to previous commit
git checkout [commit-hash]

# Rebuild and redeploy
```

### Backup Everything

```bash
# Backup server
ssh root@154.66.196.12 "tar -czf /tmp/twg-backup-$(date +%Y%m%d).tar.gz /var/www/twg"
scp root@154.66.196.12:/tmp/twg-backup-*.tar.gz ~/Desktop/
```

### Contact for Help

If you're stuck:
1. Check this manual
2. Check `CLAUDE.md` for more context
3. Google the error message
4. Ask on Stack Overflow or relevant forums

---

## Quick Reference Card

### Build PWA
```bash
cd mobile && npx expo export -p web && cp -r dist/* ../website/app/
```

### Deploy PWA
```bash
tar --exclude='._*' -czf /tmp/pwa.tar.gz -C website app && scp /tmp/pwa.tar.gz root@154.66.196.12:/tmp/ && ssh root@154.66.196.12 "cd /var/www/twg && rm -rf app && tar -xzf /tmp/pwa.tar.gz && chown -R www-data:www-data app && rm /tmp/pwa.tar.gz"
```

### Restart Backend
```bash
ssh root@154.66.196.12 "pm2 restart twg-api"
```

### Check Logs
```bash
ssh root@154.66.196.12 "pm2 logs twg-api --lines 50"
```

### Server IP
```
154.66.196.12
```

---

*Keep this manual updated as the project evolves.*
