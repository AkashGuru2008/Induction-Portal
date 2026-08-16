# Induction Portal — Backend

Express + PostgreSQL API.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in real values (a `.env` with a
   generated `JWT_SECRET` is already included for local dev — **do not
   commit it**, it's covered by `.gitignore`).

3. Create the database (adjust name/user as needed):
   ```bash
   createdb induction_portal
   ```

4. Apply the schema:
   ```bash
   npm run migrate
   ```

5. Seed the initial admin account (uses `ADMIN_USERNAME` / `ADMIN_PASSWORD`
   from `.env`):
   ```bash
   npm run seed:admin
   ```

6. Start the server:
   ```bash
   npm run dev   # nodemon, auto-restarts
   # or
   npm start
   ```

The API runs on `http://localhost:5000` by default (`PORT` in `.env`).

## Email

If `SMTP_HOST` is left blank in `.env`, outgoing emails (confirmations,
domain assignment notices, interview reminders, round results) are logged
to the console instead of actually sent — handy for local development.
Fill in `SMTP_*` vars to send real email.


