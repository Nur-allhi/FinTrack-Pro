# FinTrack Pro — Auth Setup Guide

## Overview

This app now uses **Supabase Auth** for authentication with two sign-in methods:

1. **Email/Password** — Admin creates accounts; users log in with credentials
2. **Google OAuth** — Users sign in with their Google account

Each user gets their own **isolated data silo** (all tables filtered by `user_id`).

---

## Step 1: Supabase Project Setup

1. Go to [supabase.com](https://supabase.com) and create a project (free tier works)
2. Once created, go to **Project Settings > API** and copy:
   - `Project URL` → `SUPABASE_URL`
   - `anon public key` → `SUPABASE_ANON_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY`

3. Open `.env` in the project root and fill in:

```
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
ADMIN_EMAILS="your@email.com"
```

`ADMIN_EMAILS` is a comma-separated list of emails that can access the **Users** admin tab.

---

## Step 2: Enable Auth Providers

### Email/Password (Required)
- Supabase Dashboard → **Authentication > Providers**
- **Email** should be enabled by default (if not, enable it)

### Google OAuth (Optional)
- Supabase Dashboard → **Authentication > Providers > Google**
- **Enable** the provider
- You need credentials from Google Cloud Console:
  1. Go to [console.cloud.google.com](https://console.cloud.google.com)
  2. Create a project → **APIs & Services > OAuth consent screen**
  3. **Credentials > Create Credentials > OAuth client ID**
  4. Application type: **Web application**
  5. Add redirect URI: `https://your-project.supabase.co/auth/v1/callback`
  6. Copy the **Client ID** and **Client Secret** into Supabase

---

## Step 3: Configure Redirect URLs (Google OAuth)

In Supabase Dashboard → **Authentication > URL Configuration**:

- **Site URL**: `http://localhost:3001` (for development)
- **Redirect URLs**: Add `http://localhost:3001`

---

## Step 4: Run Database Migration

The app needs a `user_id` column on all tables for data isolation.

1. Go to Supabase Dashboard → **SQL Editor**
2. Open the file `supabase/migrations/001_add_user_id.sql`
3. Copy and run the SQL in the editor

---

## Step 5: Install & Run

```bash
npm install
npm run build
npm run dev
```

The app runs at `http://localhost:3001`.

---

## Step 6: Create Your First User

1. Open the app in your browser (`http://localhost:3001`)
2. Click **"Sign in with Email"**
3. You won't have an account yet — that's fine for now

### To create the first user, you have two options:

**Option A: Supabase Dashboard (quickest)**
- Go to **Authentication > Users > Add User**
- Enter your email and a temporary password
- Check "Auto-confirm user"

**Option B: Direct API call**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"access_token": "YOUR_SUPABASE_JWT"}'
```

---

## Step 7: Log In & Access Admin Panel

1. Sign in with the credentials you created
2. Once logged in, if your email is in `ADMIN_EMAILS`, you'll see a **Users** tab in the sidebar
3. Click **Users** → **Create User** to add new accounts
4. New users can log in with their email + password

---

## How It Works

```
                    ┌──────────────────────┐
                    │   Login Page          │
                    │  Google OAuth  │  Email │
                    └────────┬─────────────┘
                             │
                    ┌────────▼─────────────┐
                    │  Supabase Auth        │
                    │  (handles login)      │
                    └────────┬─────────────┘
                             │ JWT (access_token)
                    ┌────────▼─────────────┐
                    │  Express Backend      │
                    │  ┌─────────────────┐  │
                    │  │ Auth Middleware   │  │
                    │  │ verifies JWT,    │  │
                    │  │ extracts user_id │  │
                    │  └────────┬────────┘  │
                    │  ┌────────▼────────┐  │
                    │  │ Routes filter    │  │
                    │  │ by req.user.id   │  │
                    │  │ on all queries   │  │
                    │  └────────┬────────┘  │
                    └───────────┼──────────┘
                                │
                    ┌───────────▼──────────┐
                    │  Supabase Database    │
                    │  (user_id isolation)  │
                    └──────────────────────┘
```

---

## Admin Panel Features

- **Create User** — Set email + password, user is immediately active
- **List Users** — See all registered users with sign-in method and last login
- **Delete User** — Remove a user account

Access: Only users whose email is in the `ADMIN_EMAILS` env var see the **Users** tab.

---

## Troubleshooting

| Problem | Likely Fix |
|---------|-----------|
| `Supabase not configured` | Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env` |
| `Cannot create user: service_role required` | Set `SUPABASE_SERVICE_ROLE_KEY` in `.env` |
| `Email already registered` | User already exists — check Supabase Auth dashboard |
| `401 Unauthorized` on API calls | Token expired — log out and back in |
| Google sign-in redirects to wrong page | Check **Site URL** in Supabase Auth URL config |
| Admin tab not showing | Verify your email is in `ADMIN_EMAILS` and matches exactly |
