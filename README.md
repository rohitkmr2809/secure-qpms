# Secure Cloud-Based Competitive Examination Question Paper Management System (QPMS)

> **Academic Disclaimer**: This project is a college microproject / proof-of-concept prototype built for academic demonstration of Zero-Trust security principles, RBAC, authenticated encryption, document integrity hashing, and controlled examination release. It is not intended for production government examination administration without enterprise HSM/KMS infrastructure.

---

## 1. Project Overview

Government competitive examination question papers are high-stakes, highly sensitive documents vulnerable to pre-examination compromise. Traditional paper handling and poorly protected digital portals suffer from insider threats, privilege escalation, unauthorized tampering, and uncontrolled early disclosure.

The **Secure Question Paper Management System (QPMS)** is a lightweight, cloud-deployable web application built to enforce a **Zero-Trust Security Architecture** across the lifecycle of an examination question paper: from initial drafting and peer review to cryptographic hashing, encryption at rest, and controlled examination-day release.

---

## 2. Key Objectives

- **Confidentiality**: Protect question papers at rest using authenticated symmetric encryption (AES-256-GCM). Plaintext copies are never stored in the database.
- **Integrity**: Calculate and verify a SHA-256 cryptographic digest before and during release to detect any unauthorized modifications.
- **Role-Based Access Control (RBAC)**: Enforce strict separation of duties across Question Setters, Reviewers, Examination Officers, and System Administrators.
- **Accountability**: Maintain an append-only, tamper-evident audit log of every authentication attempt, document creation, inspection, approval, rejection, and release.
- **Controlled Release**: Prevent premature disclosure of scheduled examination papers until predefined release timestamps are reached.

---

## 3. Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Next.js Server Route Handlers (RESTful JSON APIs)
- **Database**: MongoDB Atlas using Mongoose ODM with serverless connection caching
- **Authentication**: Stateless, secure HTTP-Only JWT cookies with bcrypt password hashing (10 salt rounds)
- **Cryptography**: Node.js native `crypto` module (AES-256-GCM, SHA-256)
- **Deployment**: Vercel (Frontend & Serverless API) + GitHub + MongoDB Atlas

---

## 4. System Architecture

The following diagram illustrates the flow of encrypted documents, verification hashes, and audit events between the client roles, the Next.js API server, and MongoDB Atlas.

```mermaid
flowchart TD
    subgraph Users["Authorized Personnel (RBAC)"]
        QS["Prof. Question Setter\n(QUESTION_SETTER)"]
        REV["Dr. Exam Reviewer\n(REVIEWER)"]
        EO["Officer In-Charge\n(EXAM_OFFICER)"]
        ADM["System Administrator\n(ADMIN)"]
    end

    subgraph AppServer["Next.js Application Server (Vercel)"]
        AuthMid["Auth & RBAC Guard\n(JWT + bcrypt)"]
        CryptoEngine["Crypto Engine\n- AES-256-GCM (Ciphertext + IV + Tag)\n- SHA-256 (Integrity Checksum)"]
        AuditEngine["Audit Logger\n(Append-Only Stream)"]
        ReleaseGuard["Controlled Release Time-Lock\n(Server-Side Clock Check)"]
    end

    subgraph Database["MongoDB Atlas (Cloud Database)"]
        UserCol[("Users Collection\n(bcrypt hashed passwords)")]
        QPCol[("QuestionPapers Collection\n(AES ciphertext + SHA-256 hash)")]
        AuditCol[("AuditLogs Collection\n(Immutable activity records)")]
    end

    QS -->|1. Draft / Submit Paper| AuthMid
    REV -->|2. Verify Integrity & Approve/Reject| AuthMid
    EO -->|3. Schedule & Release on Exam Day| AuthMid
    ADM -->|4. View Logs & User Directory| AuthMid

    AuthMid --> CryptoEngine
    AuthMid --> AuditEngine
    AuthMid --> ReleaseGuard

    CryptoEngine -->|Store/Fetch Encrypted Docs| QPCol
    AuditEngine -->|Write Events| AuditCol
    AuthMid -->|Verify Credentials| UserCol
```

---

## 5. Mapping Implementation to Proposed Methodology

| Methodology Step | Conceptual Principle | Practical Implementation in QPMS |
| :--- | :--- | :--- |
| **Step 1: User Registration & Identity** | Verified identities, least privilege | Pre-registered users with immutable roles (`ADMIN`, `QUESTION_SETTER`, `REVIEWER`, `EXAM_OFFICER`). |
| **Step 2: Strong Authentication** | Zero plaintext credentials | Passwords salted and hashed with `bcryptjs`. Stateless HTTP-Only session cookies. |
| **Step 3: Secure Question-Paper Creation** | Immediate encryption before storage | Question Setters author papers via `/question-papers/create`. Content is digested into SHA-256 and encrypted before DB write. |
| **Step 4: Encryption and Secure Storage** | Confidentiality at rest | AES-256-GCM authenticated encryption (`iv:authTag:ciphertext`). Application secret stored in server environment variable. |
| **Step 5: Role-Based Access Control (RBAC)** | Strict privilege boundaries | Server-side validation via `hasRequiredRole()`. Setters cannot approve; Reviewers cannot release; Officers cannot alter text. |
| **Step 6: Multi-Level Review & Approval** | Prevent single-person compromise | Reviewer portal (`/review`) allows authorized reviewers to inspect papers, write remarks, and approve or reject. |
| **Step 7: Integrity Verification** | Tamper detection | Real-time SHA-256 recalculation upon document fetch. Flags mismatches with alert: *"Integrity verification failed. The document may have been modified."* |
| **Step 8: Continuous Monitoring & Audit** | Immutable accountability | All events (`LOGIN`, `FAILED_LOGIN`, `CREATE`, `SUBMIT`, `APPROVE`, `REJECT`, `SCHEDULE`, `RELEASE`, `VIEW`, `INTEGRITY_CHECK`) saved to `AuditLog`. |
| **Step 9: Controlled Examination-Day Release** | Time-locked access | Examination Officer schedules release time. Server blocks early access before timestamp. Status moves to `RELEASED`. |
| **Step 10: Emergency & Incident Handling** | Fast response to irregularities | Audit logs flag `INTEGRITY_CHECK_FAIL` and repeated `FAILED_LOGIN`. Admin dashboard provides visibility. |
| **Step 11: Post-Examination Archival** | Lifecycle management | Status transitions: `DRAFT` → `SUBMITTED` → `APPROVED` → `SCHEDULED` → `RELEASED`. |

---

## 6. Question Paper Lifecycle State Machine

```
   [ QUESTION SETTER ]
            │
            ▼
     ┌─────────────┐
     │    DRAFT    │ ◄─── (Can edit/save locally)
     └──────┬──────┘
            │ Submit for Review
            ▼
     ┌─────────────┐
     │  SUBMITTED  │
     └──────┬──────┘
            │
            ├──────────────────────────┐
            ▼ (Reviewer Approves)      ▼ (Reviewer Rejects)
     ┌─────────────┐            ┌─────────────┐
     │  APPROVED   │            │  REJECTED   │
     └──────┬──────┘            └─────────────┘
            │ Schedule Release (Exam Officer)
            ▼
     ┌─────────────┐
     │  SCHEDULED  │ ◄─── [Time-locked until Exam Hour]
     └──────┬──────┘
            │ Release Trigger (Time reached)
            ▼
     ┌─────────────┐
     │  RELEASED   │ ◄─── [Decryption Unlocked for Exam Centers]
     └─────────────┘
```

---

## 7. Demo Accounts (College Evaluation)

For convenience during college viva and project demonstrations, the login page (`/login`) includes **1-Click Quick Demo Login** buttons for all four roles:

| Role | Email | Password | Allowed Permissions |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@qpms.com` | `Admin@123` | View users, view all papers, inspect audit trail, system statistics. |
| **QUESTION SETTER** | `setter@qpms.com` | `Setter@123` | Author question papers, save drafts, submit papers for review, view own papers. |
| **REVIEWER** | `reviewer@qpms.com` | `Reviewer@123` | Inspect submitted papers, verify SHA-256 integrity, approve or reject papers with remarks. |
| **EXAM OFFICER** | `officer@qpms.com` | `Officer@123` | View approved papers, schedule release window, execute controlled exam-day release. |

---

## 8. Database Collections & Schema Design

### 1. `User`
- `name`: string (e.g., "Prof. Question Setter")
- `email`: string (unique, lowercase)
- `password`: string (bcrypt hash, 10 salt rounds)
- `role`: enum (`ADMIN`, `QUESTION_SETTER`, `REVIEWER`, `EXAM_OFFICER`)
- `createdAt`, `updatedAt`: timestamps

### 2. `QuestionPaper`
- `title`: string
- `subject`: string
- `examName`: string
- `examDate`: string
- `content`: string (AES-256-GCM encrypted payload in format `iv:authTag:ciphertext`)
- `integrityHash`: string (64-character SHA-256 hexadecimal digest of original content)
- `status`: enum (`DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`, `SCHEDULED`, `RELEASED`)
- `createdBy`: `{ id, name, email }`
- `reviewedBy`: `{ id, name, email }` (optional)
- `reviewedAt`: date (optional)
- `reviewRemarks`: string (optional)
- `releaseTime`: date (optional, for scheduled release)
- `releasedBy`: `{ id, name, email }` (optional)
- `releasedAt`: date (optional)
- `createdAt`, `updatedAt`: timestamps

### 3. `AuditLog`
- `userId`: string
- `userName`: string
- `action`: enum (`LOGIN`, `FAILED_LOGIN`, `LOGOUT`, `CREATE_QUESTION_PAPER`, `UPDATE_QUESTION_PAPER`, `SUBMIT_QUESTION_PAPER`, `APPROVE_QUESTION_PAPER`, `REJECT_QUESTION_PAPER`, `SCHEDULE_RELEASE`, `RELEASE_QUESTION_PAPER`, `VIEW_QUESTION_PAPER`, `INTEGRITY_CHECK_PASS`, `INTEGRITY_CHECK_FAIL`)
- `resource`: string (e.g., "QUESTION_PAPER", "AUTH")
- `resourceId`: string
- `details`: string
- `ipAddress`: string
- `timestamp`: date

---

## 9. Local Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local community edition or free MongoDB Atlas cloud cluster)

### Step 1: Clone or Navigate to Project
```bash
cd qpms
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Inside `.env.local`, ensure the following values are configured:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/qpms?retryWrites=true&w=majority
AUTH_SECRET=qpms_college_super_secret_jwt_key_2026_demo
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

### Step 4: Seed Demo Data
Run the database seed script to create the 4 demo accounts and 3 sample examination papers:
```bash
npm run seed
```
Output:
```text
🌱 Starting QPMS Database Seeding...
✅ Connected to MongoDB
🧹 Cleaned existing collections
✅ Created Demo Accounts (ADMIN, QUESTION_SETTER, REVIEWER, EXAM_OFFICER)
✅ Created 3 Sample Question Papers (APPROVED, SUBMITTED, SCHEDULED)
✅ Created Audit Logs
🎉 Seeding successfully completed!
```

### Step 5: Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 10. Step-by-Step MongoDB Atlas Setup (Free Cloud Cluster)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2. Click **Build a Database** and select the **M0 Free Tier** (Shared).
3. Under **Security Quickstart**:
   - Create a database user (e.g., `qpms_admin`) and a strong password. Note these down.
   - Under **Where would you like to connect from?**, select **Network Access** → **Allow Access from Anywhere** (`0.0.0.0/0`) so Vercel serverless functions can connect.
4. Click **Connect** → **Drivers** (Node.js).
5. Copy the connection string. It will look like:
   ```
   mongodb+srv://qpms_admin:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```
6. Replace `<password>` with your user password and add `/qpms` before the `?` query parameter:
   ```
   mongodb+srv://qpms_admin:MyPassword123@cluster0.abcde.mongodb.net/qpms?retryWrites=true&w=majority
   ```
7. Paste this URI into your `.env.local` file and your Vercel Environment Variables.

---

## 11. GitHub Repository Setup

To host the code on GitHub:

```bash
# 1. Initialize git repository
git init

# 2. Stage all project files (.env.local is safely ignored by .gitignore)
git add .

# 3. Create initial commit
git commit -m "feat: complete QPMS microproject implementation"

# 4. Rename default branch to main
git branch -M main

# 5. Connect to your GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/qpms.git

# 6. Push code to GitHub
git push -u origin main
```

---

## 12. Vercel Deployment Guide

Deploying QPMS to Vercel takes less than 3 minutes:

1. Log in to [Vercel](https://vercel.com/) with your GitHub account.
2. Click **Add New...** → **Project**.
3. Select your `qpms` GitHub repository and click **Import**.
4. In the **Configure Project** screen, expand the **Environment Variables** section.
5. Add the three required environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string (from Step 10)
   - `AUTH_SECRET`: A random string for JWT signing (e.g., `qpms_super_secret_jwt_key_2026`)
   - `ENCRYPTION_KEY`: A 64-character hex key (e.g., `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef`)
6. Click **Deploy**.
7. Once deployment finishes, run the seed command against your Atlas database from your local terminal:
   ```bash
   npm run seed
   ```
8. Visit your production URL (e.g., `https://qpms.vercel.app`) to test!

---

## 13. System Testing Checklist (15 Tests)

Use this checklist during testing and college project evaluation:

| # | Test Scenario | Steps | Expected Result |
| :--- | :--- | :--- | :--- |
| **1** | **Admin Login** | Use `admin@qpms.com` / `Admin@123` | Enters dashboard, sees all metrics, users link, and full audit logs. |
| **2** | **Setter Login** | Use `setter@qpms.com` / `Setter@123` | Enters dashboard, sees "Create Question Paper" button; cannot access Review/Release. |
| **3** | **Reviewer Login** | Use `reviewer@qpms.com` / `Reviewer@123` | Enters dashboard, accesses `/review`, sees submitted queue; cannot create or release. |
| **4** | **Officer Login** | Use `officer@qpms.com` / `Officer@123` | Enters dashboard, accesses `/release`, sees approved queue; cannot edit papers. |
| **5** | **Unauthorized Access** | Try visiting `/audit-logs` as Setter | Blocked with 403 Forbidden alert: *"Only Administrators can inspect audit logs"*. |
| **6** | **Author Draft Paper** | As Setter, fill form and click "Save Draft" | Paper created with `DRAFT` status; content encrypted in MongoDB with AES-256. |
| **7** | **Submit Draft** | Open the draft paper and click "Submit for Review" | Status updates to `SUBMITTED`; Setter can no longer edit the content. |
| **8** | **Reviewer Approval** | Log in as Reviewer, open submitted paper, click "Approve Paper" | Status updates to `APPROVED`; Reviewer name & timestamp recorded; audit logged. |
| **9** | **Reviewer Rejection** | Open submitted paper, enter remarks, click "Reject Paper" | Status updates to `REJECTED`; Setter is alerted with remarks. |
| **10** | **SHA-256 Verification** | Click "View / Verify" on any paper | Green banner displays: *"Integrity verified"* with matching SHA-256 checksums. |
| **11** | **Schedule Release** | As Officer, click "Schedule Release" on approved paper, pick future date/time | Status updates to `SCHEDULED`; release timestamp saved. |
| **12** | **Access Locked Paper** | Try viewing content of `SCHEDULED` paper before release time | Content is hidden with amber lock banner: *"Paper content is locked until scheduled release time"*. |
| **13** | **Release Paper** | When release time is reached, Officer clicks "Release Paper" | Status updates to `RELEASED`; decryption becomes accessible to exam users. |
| **14** | **Audit Trail Verification** | As Admin, open `/audit-logs` | Every action from tests 1-13 is chronologically displayed with user, IP, and timestamp. |
| **15** | **Secure Logout** | Click "Logout" button | HTTP-only session cookie is invalidated; redirected to `/login`. |

---

## 14. Viva Defense & Examination Guide

### Q1: How do frontend, backend, and database communicate in this application?
- **Frontend**: Built with Next.js React components using Tailwind CSS. When an official performs an action (e.g. creating a paper or submitting a review), React makes an asynchronous `fetch()` call to Next.js Route Handlers (`/api/...`).
- **Backend (Route Handlers)**: Runs securely on the server. It extracts the user's identity from the HTTP-Only JWT session cookie, verifies their role (RBAC), interacts with the native `crypto` module for AES-256 encryption or SHA-256 integrity verification, and logs the event to the audit collection.
- **Database (MongoDB Atlas)**: Stores three collections (`users`, `questionpapers`, `auditlogs`). Uses Mongoose connection pooling optimized for serverless Vercel environments.

### Q2: Why is AES-256-GCM used instead of standard AES-CBC?
- AES-256-GCM (Galois/Counter Mode) is an **Authenticated Encryption with Associated Data (AEAD)** cipher.
- Unlike older modes like CBC, GCM produces an **Authentication Tag (`authTag`)** in addition to ciphertext. If any byte in the ciphertext or IV is tampered with by an attacker or rogue database administrator, decryption will immediately fail with an authentication error before any corrupted data is processed.

### Q3: What is the difference between encryption (AES-256) and hashing (SHA-256) in this project?
- **AES-256-GCM (Encryption)**: A two-way symmetric cipher used for **Confidentiality**. It protects the confidential questions so that unauthorized observers or database eavesdroppers cannot read them. Authorized users can decrypt it back to plaintext.
- **SHA-256 (Hashing)**: A one-way cryptographic hash function used for **Integrity Verification**. It produces a fixed 256-bit fingerprint of the document. Any change (even a single punctuation mark) drastically changes the hash. When a paper is viewed or released, the system re-computes the hash of the decrypted content; if it matches the stored hash, the paper is guaranteed untampered.

### Q4: How does the system prevent a compromised Question Setter from leaking the paper on exam day?
- The system enforces **Role-Based Access Control (RBAC)** and **Least Privilege**. Question Setters can only create and submit drafts. They have no permission to approve, schedule, or release papers.
- Furthermore, under the multi-level review model, an approved paper is locked in `SCHEDULED` status and cannot be decrypted by unauthorized users until the Examination Officer initiates the controlled release window.

### Q5: How is the audit log protected from insider tampering?
- Audit log records are stored in a dedicated `AuditLog` collection. The application only provides `INSERT` (`AuditLog.create`) and read capabilities. There are no update or delete routes exposed for audit logs, ensuring an append-only accountability trail.

---

## 15. Limitations & Future Enhancements

### Limitations of this Microproject:
- Built for academic demonstration; encryption keys are managed via environment variables rather than dedicated cloud hardware security modules (AWS KMS / Azure Key Vault / Google Cloud KMS).
- Authentication uses single-factor password + JWT cookies; production government systems require mandatory FIDO2 hardware security keys and biometric MFA.
- Single MongoDB instance instead of geo-replicated multi-region database with hardware-enforced write-once-read-many (WORM) storage.

### Future Enhancements:
- Cloud KMS integration (e.g., envelope encryption with automatic key rotation).
- Hardware token (WebAuthn / YubiKey) multi-factor authentication for privileged officials.
- Watermarked PDF dynamic rendering with recipient-specific steganographic identifiers to trace physical leaks.
- Threshold cryptography (Shamir's Secret Sharing) requiring $k$-of-$n$ examination officers to jointly unlock the question paper.

---

**Built with pride for academic demonstration of Cloud Security & Zero-Trust Architecture.**
