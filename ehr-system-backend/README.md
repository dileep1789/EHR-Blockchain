# Blockchain Certificate Verification System - Backend

Version: 2.2  
Status: Active Development  
Last Updated: February 13, 2026  
Base URL: `http://localhost:3001`

## Table of Contents
1. [Overview](#overview)
2. [Core Features](#core-features)
3. [Tech Stack](#tech-stack)
4. [Smart Contract](#smart-contract)
5. [Prerequisites](#prerequisites)
6. [Setup Instructions](#setup-instructions)
7. [Environment Configuration](#environment-configuration)
8. [Running the Server](#running-the-server)
9. [Authentication](#authentication)
10. [API Reference](#api-reference)
11. [Static Files and Uploads](#static-files-and-uploads)
12. [Project Structure](#project-structure)
13. [Team](#team)
14. [Troubleshooting](#troubleshooting)

## Documentation Links
- Full API documentation: [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md)
- Smart contract documentation: [`contracts/README.md`](contracts/README.md)

## Overview
This backend powers a blockchain-based certificate platform with:
- Role-based auth for students, universities, and admins
- Certificate issuance and verification on Polygon Amoy
- Public verification endpoints for certificates and student portfolios
- Email verification and transactional emails
- AI-powered career insights for students
- Contact form API with rate limiting and email notifications

## Core Features
- Student onboarding, profile management, and dashboard
- University registration, approval workflow, and certificate issuance
- Admin institute moderation (approve/reject/revoke)
- MetaMask and relayer-backed blockchain issuance flows
- Public verification APIs for third-party checks
- SMTP-driven email flows:
  - Account verification
  - Certificate issued notifications
  - Contact form routing

## Tech Stack

### Runtime and Framework
- Node.js
- Express `^5.2.1`

### Database
- MySQL `^3.7.0` driver (`mysql2`)

### Authentication and Security
- JWT (`jsonwebtoken ^9.0.2`)
- Password hashing (`bcrypt ^5.1.1`)
- CORS (`cors ^2.8.5`)
- Session support (`express-session ^1.18.0`)

### Blockchain
- ethers `^5.8.0`
- Polygon Amoy RPC integration
- Smart contract interaction via relayer key

### Smart Contract
- Solidity (`contracts/CertificateVerificationNoNonce.sol`)
- OpenZeppelin contracts (`@openzeppelin/contracts ^5.4.0`)
- Signature-based certificate authorization (single and bulk)
- Prepaid gas-balance model for issuer transactions

### AI and Messaging
- Google Generative AI SDK (`@google/generative-ai ^0.24.1`)
- Nodemailer (`nodemailer ^6.10.1`)

### File and Document Utilities
- Multer (`multer ^2.0.2`)
- PDFKit (`pdfkit ^0.15.0`)
- PapaParse (`papaparse ^5.5.3`)

## Smart Contract
Contract docs:
- Main contract guide: [`contracts/README.md`](contracts/README.md)
- Contract source: [`contracts/CertificateVerificationNoNonce.sol`](contracts/CertificateVerificationNoNonce.sol)

What the contract handles:
- On-chain certificate issue/verify
- Issuer and relayer authorization model
- Signature verification (per-certificate and bulk auth)
- Prepaid gas reimbursement workflow

Backend integration requirements:
1. Deploy the contract on your target network (Polygon Amoy recommended).
2. Set `CONTRACT_ADDRESS` in `.env`.
3. Set `RPC_URL` and `RELAYER_PRIVATE_KEY` in `.env`.
4. Use admin/owner flows to authorize issuers and relayers.

## Prerequisites
- Node.js 18+ (Node 20+ recommended)
- npm
- MySQL 8+
- A deployed certificate smart contract (or test deployment)
- Polygon Amoy access RPC
- SMTP credentials for emails
- Gemini API key for AI insights

## Setup Instructions
1. Install dependencies:
```bash
npm install
```

2. Create `.env` from the template:
```bash
cp .env.example .env
```

3. Create MySQL database:
```bash
mysql -u root -p
CREATE DATABASE cert_verification_system;
```

4. Import schema:
```bash
mysql -u root -p cert_verification_system < database/schema.sql
```

5. Seed the admin account:
```bash
node seedAdmin.js
```

6. Start the API:
```bash
npm run dev
```

## Environment Configuration
Use `.env.example` as the source of truth. Key values:

```dotenv
# Blockchain
RPC_URL=https://rpc-amoy.polygon.technology
RELAYER_PRIVATE_KEY=your_relayer_private_key_here
CONTRACT_ADDRESS=your_contract_address_here

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_db_password_here
DB_NAME=cert_verification_system

# Server
PORT=3001
NODE_ENV=development

# Security
JWT_SECRET=your_jwt_secret_key_here
SESSION_SECRET=your_session_secret_key_here

# AI
GEMINI_API_KEY=your_gemini_api_key_here

# SMTP
SMTP_HOST=mail.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SMTP_SECURE=false
SMTP_FROM=CertiChain <no-reply@example.com>

# App URLs
APP_URL=http://localhost:3001
FRONTEND_URL=https://your-frontend-domain.com

# Email verification
REQUIRE_EMAIL_VERIFICATION=true
EMAIL_VERIFICATION_TTL_HOURS=24
```

### CORS Behavior
- Local frontend origins are allowed directly in `server.js`:
  - `http://localhost:5173`
  - `http://localhost:3000`
- Additional production frontend origin is read from `FRONTEND_URL`
- In non-production, CORS is open for development convenience

## Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

Health check endpoint:
- `GET /api/health`

## Authentication
Protected endpoints require:
```http
Authorization: Bearer <JWT_TOKEN>
```

Role guards are enforced in middleware for:
- Student
- University
- Admin

## API Reference

### Auth Routes (`/api/auth`)
- `POST /student/register`
- `POST /student/login`
- `GET /student/verify-email`
- `POST /student/resend-verification`
- `GET /student/profile` (student auth)

### Student Routes (`/api/student`)
- `GET /dashboard`
- `GET /certificates`
- `GET /certificates/:certificateId`
- `GET /certificates/:certificateId/verify`
- `POST /career-insights`
- `PATCH /portfolio/visibility`
- `PATCH /profile` (multipart fields: `profile_photo`, `cv`)

### University Routes (`/api/university`)
Public:
- `POST /register` (multipart fields: `logo`, `verification_doc`)
- `POST /login`
- `GET /verify-email`
- `POST /resend-verification`

Protected:
- `GET /profile`
- `GET /dashboard`
- `GET /students/search`
- `POST /certificate/issue`
- `POST /certificate/sign-payload`
- `POST /certificate/issue-signed`
- `POST /certificate/bulk-auth`
- `POST /certificate/bulk-issue-signed`
- `GET /certificates`
- `POST /certificates/bulk`

### Admin Routes (`/api/admin`)
Public:
- `POST /login`

Protected:
- `GET /profile`
- `GET /dashboard`
- `GET /institutes`
- `GET /institutes/pending`
- `GET /institutes/:institute_id/issuer-status`
- `POST /institutes/:institute_id/approve`
- `POST /institutes/:institute_id/reject`
- `POST /institutes/:institute_id/revoke`
- `GET /statistics`
- `GET /blockchain/status`

### Verification Routes (`/api/verify`)
Public:
- `GET /certificate/:certificateId`
- `GET /user/:userId`

### Payment Routes (`/api/payment`)
- `GET /gas-cost`
- `GET /balance?address=0x...`
- `POST /issue-with-metamask`
- `POST /bulk-issue`

### MetaMask Routes (`/api/metamask`)
- `POST /issue-with-metamask`
- `GET /status`

### Contact Routes (`/api/contact`)
Public:
- `POST /send-message`
- `GET /health`

Validation summary for `POST /send-message`:
- `name`: 2 to 100 chars
- `email`: valid format, max 255
- `subject`: 3 to 200 chars
- `message`: 10 to 5000 chars

Rate limiting:
- 5 requests/hour per IP
- Exceeding limit returns `429`

## Static Files and Uploads
- Public:
  - `/uploads/institutes/logos/*`
  - `/uploads/students/*`
- Protected:
  - `/uploads/institutes/documents/*` (JWT required)
  - `GET /api/files/:filename` (JWT required)

## Project Structure
```text
config/
  database.js
controllers/
  adminController.js
  authController.js
  contactController.js
  studentController.js
  universityController.js
  verifyController.js
database/
  schema.sql
middleware/
  auth.js
  upload.js
models/
  Admin.js
  Certificate.js
  Institute.js
  Student.js
routes/
  admin.js
  auth.js
  contact.js
  metamask-routes.js
  payment.js
  student.js
  university.js
  verify.js
utils/
  blockchain.js
  contactEmail.js
  emailVerification.js
  mailer.js
server.js
seedAdmin.js
```

## Team
- Teshan Pamodya
- Kavindu Lakshan
- Chamath Theekshana
- Thamindu Keshan

## Troubleshooting
- `ECONNREFUSED` (MySQL): verify DB server is running and `.env` credentials are correct
- CORS blocked in browser: confirm request origin and `FRONTEND_URL`
- Email failures: verify `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- Blockchain transaction failures: verify `RPC_URL`, `RELAYER_PRIVATE_KEY`, `CONTRACT_ADDRESS`
- `403 verification_required`: user/institute must complete email verification first

---

Smart contract implementation details are available at `contracts/README.md`.
