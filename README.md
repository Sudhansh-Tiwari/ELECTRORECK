# Electroreck — Electrical Engineering Society, NIT Kurukshetra
## Unified Student Platform & Administrative Control Portal

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel&logoColor=white)](https://electroreck-ten.vercel.app)
[![Live Site](https://img.shields.io/badge/🌐%20Live%20Site-electroreck--ten.vercel.app-eaa943?style=for-the-badge)](https://electroreck-ten.vercel.app)

> 🔗 **Live Demo:** [https://electroreck-ten.vercel.app](https://electroreck-ten.vercel.app)
> 🔑 **Admin Portal:** [https://electroreck-ten.vercel.app/admin](https://electroreck-ten.vercel.app/admin)

Official web portal and administrative management system for **Electroreck**, the Department of Electrical Engineering society at the National Institute of Technology, Kurukshetra.

Built with high-performance modern Vanilla web standards (HTML5, CSS3, JavaScript ES2022) and backed by a single unified **Supabase** backend (PostgreSQL, Auth, RLS, Edge Functions, and real-time synchronisation).

---

## 🚀 Key Features

### 1. Student Portal (`index.html`, `register.html`, `induction.html`, `my-registrations.html`)
- **Interactive Public Site**:
  - Live animated hero with circuit canvas simulation and real-time statistics.
  - Dynamic event grid filterable by category (*All*, *Cultural*, *Technical*, *Research*, *Workshops*).
  - Seat counters and registration statuses update in real time directly from the database.
- **Event Registration Flow**:
  - Validates college email domain (`@nitkkr.ac.in`) and 9-digit roll number format (`[0-9]{9}`).
  - Validates team size boundaries (`min_team_size` to `max_team_size`).
  - Blocks submissions after the event deadline or when maximum capacity is reached.
  - Automatically saves registrations with status **"Pending"** and displays a clean *"Request submitted, awaiting admin approval"* state.
- **Society Induction Recruitment**:
  - Multi-wing preference selection loaded live from the `wings` database table.
  - Validates statement of intent (10–500 characters).
  - Enforces single submission constraint per student with pending review tracking.
- **Student Dashboard ("My Passes / My Registrations")**:
  - Live per-request status cards:
    - 🟡 **Pending**: Amber badge with review notice; pass unavailable until approved.
    - 🟢 **Approved**: Green badge, official Pass ID chip (`ER-2026-XXXXX`), and printable official entry ticket.
    - 🔴 **Rejected**: Red badge with organizer rejection reason clearly shown.
  - Society induction application status tracking (*Pending*, *Shortlisted*, *Approved*, *Rejected*).

---

### 2. Admin Portal (`admin.html`, `admin.css`, `admin.js`)
Restricted, role-protected management center styled to match the society's theme:
- **Role-Based Access Control**:
  - 👑 **Super Admin** (`admin`): Full unrestricted control over registrations, society applications, events, coordinators, and audit activity logs.
  - 🎯 **Lead Organizer** (`organizer` / `coordinator`): Approve or reject event requests, create/edit events, view attendees.
  - 👥 **Core Team** (`member`): Read-only view for verification and registration tracking.
  - 🚫 **Students**: Automatically blocked with an Access Denied view.
- **Dashboard Section**:
  - Live metrics: Pending Event Requests, Pending Society Applications, Active Events, Approved Participants.
  - Chronological *"Needs Action"* queue prioritized oldest-first for rapid triage.
  - Recent administrative audit feed.
- **Event Requests (Participant Approvals)**:
  - Searchable table with event dropdown filter and status tabs (*All*, *Pending*, *Approved*, *Rejected*).
  - Detail drawer opening full team composition, roll numbers, leader phone, and live event seat capacity.
  - **Approve Action**: Verifies capacity before approving; assigns pass ID (`ER-2026-XXXXX`), records `reviewed_at`, and dispatches notification.
  - **Reject Action**: Requires mandatory rejection reason via a confirmation modal.
  - **Bulk Actions**: Multi-select checkboxes for batch approve and batch reject.
  - **Capacity Safeguard**: Prevents approval if the event is already full.
  - **Export CSV**: Formula-injection sanitized CSV generation (`=`, `+`, `-`, `@` escaped).
- **Society Induction Requests**:
  - Review candidate domain, academic year, branch, and written statement of purpose.
  - Actions: **Shortlist**, **Approve**, **Reject** (with reason modal).
  - On **Approve**, the candidate's database role is automatically promoted to `"member"`.
- **Manage Events**:
  - Card & table views with seat progress bars and computed statuses (*Open*, *Full*, *Closed*).
  - **"+ Add New Event" Modal**: Title, category, tagline, description, venue, event date, registration deadline, team size min/max, seats, and status.
  - Newly created events appear instantly on the public student website.
  - Actions to **Edit**, **Close Registrations**, and **Delete** (with confirmation dialog).
- **Activity Log (Super Admin Only)**:
  - Complete chronological audit log of all administrative actions with timestamp, admin identity, action type, and target ID.

---

## 🛠️ Environment Variables & Configuration

Configure these keys in your deployment platform (Vercel) or in a local `.env.local` file:

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `SUPABASE_URL` | Your Supabase project URL | `https://xyzcompany.supabase.co` |
| `SUPABASE_ANON_KEY` | Public anonymous key for client requests | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | (Optional) Service key for backend Edge Functions | `eyJhbGciOi...` |
| `RESEND_API_KEY` | (Optional) API key for transactional email dispatches | `re_123456789...` |

### Setting Supabase Keys on the Frontend:
In `index.html` (or via browser `localStorage`), configure:
```javascript
window.ELECTRORECK_CONFIG = {
  SUPABASE_URL: "https://your-project-id.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOi..."
};
```
*Note: When no Supabase keys are provided, Electroreck automatically activates an offline localStorage database simulator with complete pre-seeded events, demo accounts, and sample requests for testing and development.*

---

## 👑 How to Create the First Super Admin User

For security, Super Admin accounts cannot be created via public signups.

1. Navigate to [`login.html`](file:///Users/shalabh/ElectroReck/login.html) and sign up with your college email (e.g. `admin@nitkkr.ac.in`).
2. Open the **Supabase Dashboard** > **SQL Editor** and run:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE email = 'admin@nitkkr.ac.in';
   ```
3. To assign an **Organizer** or **Event Coordinator**:
   ```sql
   UPDATE public.profiles
   SET role = 'coordinator',
       coordinator_event_id = (SELECT id FROM public.events WHERE slug = 'electrica')
   WHERE email = 'organizer@nitkkr.ac.in';
   ```
4. Now sign in through [`admin.html`](file:///Users/shalabh/ElectroReck/admin.html) to access the complete admin portal.

---

## 🚀 How to Deploy on Vercel

1. **Push Code to GitHub**:
   ```bash
   git add .
   git commit -m "feat: complete Electroreck Admin Portal and student sync"
   git push origin main
   ```
2. **Import into Vercel**:
   - Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
   - Select your `ElectroReck` repository.
   - **Framework Preset**: *Other*
   - **Build Command**: *(Leave empty)*
   - **Output Directory**: `./` (Root directory)
3. **Set Environment Variables**:
   - Under Project Settings > Environment Variables, add `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
4. **Deploy**:
   - Click **Deploy**. Vercel will host the static frontend with instant global CDN caching.

---

## 🧪 Automated Verification Suite

Run the automated test suite locally at any time:

```bash
node run-tests.js
```

### Verification Results:
```
===============================================================
⚡ ELECTRORECK COMPREHENSIVE AUTOMATED VERIFICATION SUITE
===============================================================

✅ PASS: College Email Domain Enforcement — Blocked non-college email with clear error
✅ PASS: Password Minimum Length Constraint — Enforced minimum 8 character rule
✅ PASS: Direct Student Signup & Auto Sign-in Flow — Account created, logged in immediately without confirmation email
✅ PASS: Login & Auto Student Role Assignment — Logged in successfully as role "student"
✅ PASS: Roll Number 9-Digit Format Enforcement — Correctly rejected 8-digit roll number with 9-digit requirement
✅ PASS: Event Registration & Pass Generation (ER-2026-XXXXX) — Pending -> Approved -> Generated Pass: ER-2026-00101
✅ PASS: Duplicate Registration Block (Same Student) — Correctly rejected duplicate user registration
✅ PASS: Duplicate Roll Number Block (Per Event) — Correctly rejected duplicate roll number
✅ PASS: Full Event Capacity Check — Correctly rejected full event
✅ PASS: Closed Event Block — Correctly rejected closed event
✅ PASS: Student Access to Admin Records Restricted — Student blocked with Access Denied
✅ PASS: Admin Status Change & Seat Release on Rejection — Seat released (2 -> 1 seats filled)
✅ PASS: CSV Formula Injection Sanitization (=, +, -, @) — All dangerous prefixes prepended with single quote
✅ PASS: Induction Single Application Constraint — Blocked duplicate application successfully

TOTAL TESTS: 14 | PASSED: 14 | FAILED: 0 | SUCCESS RATE: 100%
===============================================================
```
