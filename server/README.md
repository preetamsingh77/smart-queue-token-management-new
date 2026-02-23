# CivicFlow — Admin Server Scripts

This folder contains server-side Node.js scripts using the **Firebase Admin SDK** to manage the CivicFlow platform. These scripts run **outside** the browser and have elevated privileges.

> ⚠️ **SECURITY**: `serviceAccountKey.json` is git-ignored. Never commit it or share it publicly.

---

## Setup

```bash
cd server
npm install
```

---

## Available Scripts

### 1. 🌱 Seed Firestore Database
Populates Firebase with all 11 services and 5 initial counters. Run this **once** after first connecting.

```bash
node seedFirestore.js
```

---

### 2. 👤 Set User Role
Assigns a role to a registered user by email. The user must have signed up via the app first.

```bash
node setUserRole.js <email> <role>
```

**Roles:**
| Role | Access |
|------|--------|
| `ADMIN` | Admin Dashboard, CommandCenter, Settings |
| `OFFICER` | Officer Dashboard |
| `CITIZEN` | Citizen Portal (default) |

**Examples:**
```bash
# Make yourself an admin
node setUserRole.js your@email.com ADMIN

# Assign officer role
node setUserRole.js officer@office.gov OFFICER
```

---

### 3. 📋 List All Users
Displays all registered users and their current roles.

```bash
node listUsers.js
```

---

## Workflow: First-Time Setup

1. Run the dev server: `npm run dev` (from root)
2. Sign up via the app at `http://localhost:3007/#/signup`
3. Come back here and run:
   ```bash
   node setUserRole.js your@email.com ADMIN
   ```
4. Sign out and back in — you now have full Admin access
5. Seed the database:
   ```bash
   node seedFirestore.js
   ```
