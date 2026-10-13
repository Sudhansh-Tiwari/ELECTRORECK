# Electroreck — Electrical Engineering Society, NIT Kurukshetra

Official web portal and registration platform for **Electroreck**, the Department of Electrical Engineering society at the National Institute of Technology, Kurukshetra.

Built with a high-performance vanilla stack and powered by **Supabase** (Postgres, Auth, Row-Level Security, and Triggers).

---

## 🚀 Key Features

- **Four Core Society Events**:
  - **Electrica** (Cultural): Online quiz and talent showcase combining circuits and creativity.
  - **Advanza** (Technical): Circuit design and power systems challenge.
  - **Digispark** (Technical): Digital logic design, FPGA, DSP, and microcontroller interfacing.
  - **Vidhwaan** (Research & Presentation): National power grid simulation and research presentation.
- **Reliable Registration Engine**:
  - Live capacity tracking (rejected/cancelled registrations automatically free up seats).
  - Pre-filled authenticated profile data with read-only college email.
  - Dynamic team formation with member limits per event.
  - Strict roll number format enforcement (`[0-9]{9}`).
  - Instant unique digital entry pass generation (`ER-2026-00001`) with printable PDF card.
  - Automatic confirmation email dispatch.
- **Society Induction Portal**:
  - Recruitment application with wing selection from live `wings` table.
  - 10 to 500 characters essay validator.
  - Enforced single induction application per student.
- **Student Dashboard (`my-registrations.html`)**:
  - Real-time pass wallet with status badges (`Confirmed`, `Pending`, `Rejected`, `Cancelled`).
  - View & print modal for official passes.
  - Society induction application status tracker.
- **Protected Administration Center (`admin.html`)**:
  - Role-based scoping (`student`, `coordinator`, `admin`).
  - Coordinators are restricted to their assigned event's registrations and settings.
  - Real-time event capacity and induction metrics.
  - Status modification dropdowns with instant seat recalculation.
  - Filterable and searchable registration tables.
  - **Formula Injection-Safe CSV Export**: Sanitizes dangerous formula prefixes (`=`, `+`, `-`, `@`) by prepending `'`.

---

## 🛠️ Supabase Setup & Database Schema

### 1. Initialize Tables, Triggers & RLS
1. Create a new project on [Supabase](https://supabase.com/).
2. Open the **SQL Editor** from your Supabase dashboard.
3. Open [`supabase/schema.sql`](file:///Users/shalabh/ElectroReck/supabase/schema.sql) in this repository, copy its entire contents, paste it into the SQL Editor, and click **Run**.
4. This will set up:
   - Tables: `profiles`, `events`, `wings`, `event_registrations`, `induction_applications`.
   - Custom types: `user_role`, `registration_status`, `induction_status`.
   - Sequence: `pass_seq` (generates `ER-2026-XXXXX`).
   - Trigger functions: `handle_new_user()`, `validate_event_registration()`, `protect_profile_roles()`.
   - Complete Row-Level Security (RLS) policies for all tables.
   - Seed data for the 4 society events and recruitment wings.

### 2. Configure Auth Settings (Direct Signup)
1. In the Supabase Dashboard, go to **Authentication** > **Providers** > **Email**.
2. Ensure **Enable Email provider** is turned on.
3. Turn **OFF** "Confirm email" (or enable auto-confirm) so students are automatically signed in immediately upon signup without having to wait for a confirmation email link.
4. Set the Site URL / Redirect URL to your production domain or `http://localhost:3008/login.html`.

---

## 👑 How to Create the First Super Admin

To maintain strict security, **super admins can never be created through the public signup form**.

1. Have the administrator sign up normally via [`login.html`](file:///Users/shalabh/ElectroReck/login.html) using their college email address (e.g. `faculty_admin@nitkkr.ac.in`).
2. Confirm their email address.
3. Open the **Supabase SQL Editor** and execute the following command:

```sql
-- Promote student profile to Super Admin
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'faculty_admin@nitkkr.ac.in';
```

4. The user now has full administrative privileges across all events, induction applications, event settings, and wings management.

### How to Assign an Event Coordinator

To designate a coordinator for a specific event (e.g. *Electrica*):

```sql
UPDATE public.profiles
SET role = 'coordinator',
    coordinator_event_id = (SELECT id FROM public.events WHERE slug = 'electrica')
WHERE email = 'coordinator_email@nitkkr.ac.in';
```

---

## ✉️ How to Set and Customize the College Email Domain

By default, the platform restricts access to NIT Kurukshetra accounts ending with `@nitkkr.ac.in`.

### 1. Database-Level Enforcement
In [`supabase/schema.sql`](file:///Users/shalabh/ElectroReck/supabase/schema.sql), adjust the `allowed_domain` variable:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    allowed_domain TEXT := '@nitkkr.ac.in'; -- Change domain here if needed
BEGIN
    IF lower(NEW.email) NOT LIKE ('%' || allowed_domain) THEN
        RAISE EXCEPTION 'Registration restricted: Only college email addresses ending in % are permitted.', allowed_domain;
    END IF;
    ...
```

### 2. Frontend Validation
In [`supabase-client.js`](file:///Users/shalabh/ElectroReck/supabase-client.js), update:

```javascript
const COLLEGE_DOMAIN = '@nitkkr.ac.in'; // Change domain here
```

---

## 🧪 Automated Verification Suite

An automated test suite validates all business logic, duplicate checks, seat limits, role constraints, and CSV sanitization:

```bash
node run-tests.js
```

### Test Results Summary:
```
✅ PASS: College Email Domain Enforcement — Blocked non-college email with clear error
✅ PASS: Password Minimum Length Constraint — Enforced minimum 8 character rule
✅ PASS: Direct Student Signup & Auto Sign-in Flow — Account created, logged in immediately without confirmation email
✅ PASS: Login & Auto Student Role Assignment — Logged in successfully as role "student"
✅ PASS: Roll Number 9-Digit Format Enforcement — Correctly rejected 8-digit roll number with 9-digit requirement
✅ PASS: Event Registration & Pass Generation (ER-2026-XXXXX) — Generated Pass: ER-2026-00101
✅ PASS: Duplicate Registration Block (Same Student) — Correctly rejected duplicate user registration
✅ PASS: Duplicate Roll Number Block (Per Event) — Correctly rejected duplicate roll number
✅ PASS: Full Event Capacity Check — Correctly rejected full event
✅ PASS: Closed Event Block — Correctly rejected closed event
✅ PASS: Student Access to Admin Records Restricted — Student blocked with Access Denied
✅ PASS: Admin Status Change & Seat Release on Rejection — Seat released on rejection
✅ PASS: CSV Formula Injection Sanitization (=, +, -, @) — Dangerous prefixes prepended with single quote
✅ PASS: Induction Single Application Constraint — Blocked duplicate application successfully

TOTAL TESTS: 14 | PASSED: 14 | FAILED: 0 (100% Success Rate)
```

---

## 🌐 How to Deploy

### Option A: Static Hosting (Vercel, Netlify, Cloudflare Pages, GitHub Pages)
This project is pure HTML, CSS, and Vanilla JavaScript with no build steps required.

1. **Connect Supabase**:
   Provide your Supabase URL and Public Anon Key in `window.ELECTRORECK_CONFIG` in `index.html` or set in browser LocalStorage:
   ```javascript
   window.ELECTRORECK_CONFIG = {
     SUPABASE_URL: "https://your-project-id.supabase.co",
     SUPABASE_ANON_KEY: "eyJhbGciOi..."
   };
   ```
2. **Deploy**:
   - Push to GitHub and import repository in **Vercel** or **Netlify**.
   - Build Command: *(None)*
   - Output Directory: `./` (Root)

### Option B: Local Development
Run the included lightweight server:
```bash
node server.js
```
Open [http://localhost:3008](http://localhost:3008) in your browser.

> [!CAUTION]
> **Secret Key Safety**: Never place your Supabase `service_role` key in frontend code. Only use the public `anon` key in browser scripts.
