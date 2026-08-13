# Firm Feed Backend

Node.js + Express + MySQL (Sequelize) backend — admin-uploaded feed, multi-owner firms,
category-based browsing, and Excel bulk upload for users & firms. Built in the same
style as `job-junction-backend`.

## 1. Setup

```bash
cd firm-feed-backend
npm install
```

Create a MySQL database (or let Sequelize do it via the sync script) and fill in `.env`:

```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=firm_feed
DB_USER=root
DB_PASSWORD=yourpassword

ACCESS_TOKEN_SECRET=some_long_random_string
REFRESH_TOKEN_SECRET=some_other_long_random_string
```

## 2. Create tables + seed the first admin

```bash
npm run db:sync
```

This creates all tables (via Sequelize `sync({ alter: true })`) and, if no admin exists yet,
creates one using `SEED_ADMIN_NAME` / `SEED_ADMIN_EMAIL` / `SEED_ADMIN_MOBILE` from `.env`.
The default password follows the same rule as every other user:
first name (lowercase) + `@123` — e.g. "Super Admin" → `super@123`.
The generated password is printed to the console — copy it and log in once.

Alternatively you can run `database/schema.sql` directly in MySQL and create the first
admin manually (remember: password must be bcrypt-hashed, so prefer the sync script).

## 3. Run the server

```bash
npm run dev     # nodemon, auto-restart
# or
npm start
```

Server starts on `http://localhost:3000` (or your `PORT`).

## 4. Login flow

```
POST /api/auth/login
{ "email": "super@example.com", "password": "super@123" }
```

Returns `accessToken` + `refreshToken`. Send `Authorization: Bearer <accessToken>` on all
protected routes. `is_password_reset_required` on the user object tells your frontend
whether to force a password-change screen (`POST /api/auth/change-password`).

## 5. Creating users & firms

- **Single user**: `POST /api/admin/users` `{ name, email, mobile, role }` — password is
  auto-generated as `firstname@123`.
- **Bulk users**: `POST /api/admin/users/bulk-upload` — multipart form field `file`,
  an `.xlsx` with columns `name, email, mobile, role`. See `database/sample-templates/`.
- **Single firm**: `POST /api/admin/firms` (multipart, optional `logo` file) —
  `{ name, category_id, description, address, city, state, pincode, contact_email,
  contact_phone, owner_ids: [1,2] }`.
- **Bulk firms**: `POST /api/admin/firms/bulk-upload` — multipart form field `file`,
  columns `firm_name, category, description, address, city, state, pincode,
  contact_email, contact_phone, owner_emails` (comma-separated emails).

Every bulk upload writes a row to `upload_logs` with a per-row `error_log`, and the
API response also returns `{ total, success_count, failed_count, errors: [...] }`
immediately so the frontend can show what failed and why.

## 6. Full route list

See `firm-feed-backend-doc.md` (the design document) section 8 for the complete table
of routes, or browse `routes/*.js` directly — they're grouped exactly the same way.

## 7. Notes

- Firm ↔ User is a genuine many-to-many (`firm_owners` junction table): one user can
  own many firms, one firm can have many owners, and one owner per firm can optionally
  be flagged `is_primary_owner`.
- Feed is global — every logged-in user (any role) sees every `published` feed post via
  `GET /api/feed`.
- Firms are filterable by category via `GET /api/firms?category_id=`.
- Uploaded images/logos are served statically from `/uploads/...`.
