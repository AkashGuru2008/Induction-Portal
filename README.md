# Induction Portal

A full-stack induction management system: public applications, admin review,
domain-scoped task/Q&A boards, interview scheduling, status tracking, and
round progression with email notifications.

**Stack:** React (Vite) frontend · Express backend · PostgreSQL database

```
induction-portal/
├── backend/    Express API + PostgreSQL
└── frontend/   React app (Vite)
```

## What's implemented

| Module | Feature | Status |
|---|---|---|
| A — Application Form | Public form, validation, confirmation email/page | ✅ Basic |
| B — Admin Dashboard | Filterable inductee list, individual view, **CSV export** | ✅ Basic + Brownie |
| C — Domain Access & Boards | Domain assignment gating, tasks, Q&A | ✅ Basic |
| D — Interview Scheduling | Slot creation, booking with conflict checks, reminder emails | ✅ Basic |
| E — Interview Status Tracking | Status (Scheduled/Completed/No-show), admin-only, **notes/rating** | ✅ Basic + Brownie |
| F — Round Progression & Announcements | Advance/reject, bulk final announcement, notification emails | ✅ Basic |

(Per the brief, most brownie/optional items were intentionally skipped —
conditional follow-up questions, panelist-level conflict detection across
domains, and the public toggleable results page are not implemented.)

## Quick start

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env        # a working .env with a generated JWT secret is already included
# edit .env: set your PostgreSQL connection details and admin credentials
createdb induction_portal
npm run migrate             # applies schema.sql
npm run seed:admin          # creates the admin account from ADMIN_USERNAME/ADMIN_PASSWORD
npm run dev                 # http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env        # points to the backend at http://localhost:5000/api by default
npm run dev                 # http://localhost:5173
```

Open `http://localhost:5173`, apply as an inductee, then log in as admin at
`/admin/login` using the credentials you seeded.

## Environment & secrets

Both `backend/.env` and `frontend/.env` are **git-ignored**. Only the
`.env.example` templates are meant to be committed. The backend's `.env`
already contains a randomly generated `JWT_SECRET` for local development —
rotate it before deploying anywhere real, and never commit real database
or SMTP credentials.

## Email

If `SMTP_HOST` is left blank in `backend/.env`, all outgoing email
(application confirmations, domain assignment notices, interview booking
confirmations + 24h reminders, round/final results) is logged to the
backend console instead of actually sent, so the whole flow is testable
without real SMTP credentials.

## Auth model

- **Admins** log in with a username/password (seeded via `npm run
  seed:admin`) and get a JWT scoped to `role: admin`.
- **Inductees** log in with their roll number + the email or phone they
  applied with (no separate password) and get a JWT scoped to `role:
  inductee`, used to gate access to their assigned domain page and
  interview booking.
