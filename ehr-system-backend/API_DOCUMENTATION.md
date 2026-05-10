# Certificate Verification Backend - Full API Documentation

Version: 2.0  
Last Updated: February 13, 2026  
Base URL: `http://localhost:3001`

## Table of Contents
1. [Overview](#overview)
2. [Auth and Roles](#auth-and-roles)
3. [Global Behavior](#global-behavior)
4. [Health and Utility Endpoints](#health-and-utility-endpoints)
5. [Auth API](#auth-api)
6. [Student API](#student-api)
7. [University API](#university-api)
8. [Admin API](#admin-api)
9. [Public Verification API](#public-verification-api)
10. [Payment API](#payment-api)
11. [MetaMask API](#metamask-api)
12. [Contact API](#contact-api)
13. [Error Handling](#error-handling)
14. [cURL Quick Tests](#curl-quick-tests)
15. [Related Docs](#related-docs)

## Overview
This backend supports:
- Student, university, and admin authentication
- On-chain certificate issuance and verification
- Public certificate and portfolio verification
- MetaMask-assisted issuance flows
- Contact form processing with rate limiting
- Email verification and notification workflows
- AI-based career insights

Mounted route groups:
- `/api/auth`
- `/api/student`
- `/api/university`
- `/api/admin`
- `/api/verify`
- `/api/payment`
- `/api/metamask`
- `/api/contact`

## Auth and Roles
JWT auth header for protected routes:
```http
Authorization: Bearer <JWT_TOKEN>
```

Role middleware:
- `verifyStudent`
- `verifyUniversity`
- `verifyAdmin`

Common auth errors:
```json
{ "error": "No token provided" }
```
```json
{ "error": "Invalid or expired token" }
```
```json
{ "error": "Access denied. Students only." }
```

## Global Behavior

### CORS
Configured in `server.js`:
- Hardcoded local origins:
  - `http://localhost:5173`
  - `http://localhost:3000`
- Additional production origin from `FRONTEND_URL`
- In non-production, all origins are allowed

### Static File Access
Public:
- `GET /uploads/institutes/logos/*`
- `GET /uploads/students/*`

Protected:
- `GET /uploads/institutes/documents/*` (JWT required)
- `GET /api/files/:filename` (JWT required)

### File Upload Limits
From `middleware/upload.js`:
- Max file size: 5MB per file

Allowed MIME types:
- `logo`: png, jpeg, jpg, webp, gif
- `verification_doc`: pdf + image formats
- `profile_photo`: png, jpeg, jpg, webp, gif
- `cv`: pdf, doc, docx

## Health and Utility Endpoints

### GET /api/health
General backend health.

Response (200):
```json
{
  "status": "OK",
  "timestamp": "2026-02-13T10:00:00.000Z",
  "database": "Connected",
  "blockchain": "0xYourContractAddress"
}
```

### GET /api/contact/health
Contact subsystem health.

Response (200):
```json
{
  "status": "OK",
  "emailService": "configured",
  "adminEmail": "configured"
}
```

## Auth API
Base: `/api/auth`

### POST /api/auth/student/register
Register student account.

Request body:
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "gender": "Male",
  "birthdate": "2000-01-15"
}
```

Response (201, verification enabled):
```json
{
  "success": true,
  "message": "Registration successful. Verification email sent.",
  "verification_required": true,
  "email_sent": true,
  "userId": "STU1739439723ABC12",
  "student": {
    "userId": "STU1739439723ABC12",
    "full_name": "John Doe",
    "email": "john@example.com",
    "gender": "Male",
    "birthdate": "2000-01-15"
  }
}
```

Response (201, verification disabled):
```json
{
  "success": true,
  "message": "Student registered successfully",
  "userId": "STU1739439723ABC12",
  "token": "JWT_TOKEN",
  "student": {
    "userId": "STU1739439723ABC12",
    "full_name": "John Doe",
    "email": "john@example.com",
    "gender": "Male",
    "birthdate": "2000-01-15"
  }
}
```

Validation errors:
- `400` missing fields
- `400` invalid email
- `400` password < 8 chars
- `400` email already registered

### POST /api/auth/student/login
Student login.

Request body:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

Response (200):
```json
{
  "success": true,
  "message": "Login successful",
  "token": "JWT_TOKEN",
  "student": {
    "userId": "STU1739439723ABC12",
    "full_name": "John Doe",
    "email": "john@example.com",
    "gender": "Male",
    "birthdate": "2000-01-15"
  }
}
```

Special response:
```json
{
  "error": "Email not verified. Please check your inbox.",
  "verification_required": true
}
```

### GET /api/auth/student/verify-email?token=...
Verifies student email token.  
Returns HTML page (not JSON).

### POST /api/auth/student/resend-verification
Resend verification email.

Request body:
```json
{ "email": "john@example.com" }
```

Response:
```json
{ "success": true, "message": "Verification email sent." }
```

### GET /api/auth/student/profile
Get current student profile.

Auth: student JWT

Response:
```json
{
  "success": true,
  "student": {
    "user_id": "STU1739439723ABC12",
    "full_name": "John Doe",
    "email": "john@example.com",
    "gender": "Male",
    "birthdate": "2000-01-15",
    "is_portfolio_public": 1,
    "profile_photo_url": null,
    "cv_url": null,
    "github_url": null,
    "email_verified": 1,
    "created_at": "2026-02-13T08:00:00.000Z"
  }
}
```

## Student API
Base: `/api/student`  
All endpoints require student JWT.

### GET /api/student/dashboard
Returns student profile summary, certificates, stats, and institution rollup.

Response (200):
```json
{
  "success": true,
  "student": {
    "userId": "STU1739439723ABC12",
    "full_name": "John Doe",
    "email": "john@example.com",
    "gender": "Male",
    "birthdate": "2000-01-15",
    "isPortfolioPublic": 1,
    "profile_photo_url": "/uploads/students/photos/profile_photo-123.png",
    "cv_url": "/uploads/students/cvs/cv-123.pdf",
    "github_url": "https://github.com/johndoe"
  },
  "certificates": [],
  "statistics": {
    "totalCertificates": 0,
    "blockchainVerifiedCount": 0,
    "institutionsCount": 0,
    "activeCertificatesCount": 0
  },
  "institutions": []
}
```

### GET /api/student/certificates
List all student certificates.

Response:
```json
{
  "success": true,
  "certificates": [
    {
      "certificate_id": "CERT123",
      "course": "Blockchain 101",
      "grade": "A",
      "issued_date": "2026-02-12",
      "institute_name": "Tech University",
      "blockchain_tx_hash": "0x..."
    }
  ]
}
```

### GET /api/student/certificates/:certificateId
Get one certificate owned by logged student.

Errors:
- `404` certificate not found

### GET /api/student/certificates/:certificateId/verify
Verifies against blockchain and compares DB data to chain data.

Response (not on-chain):
```json
{
  "verified": false,
  "onBlockchain": false,
  "message": "Certificate not found on blockchain"
}
```

Response (on-chain):
```json
{
  "verified": true,
  "onBlockchain": true,
  "databaseCert": {
    "certificateId": "CERT123",
    "courseName": "Blockchain 101",
    "grade": "A",
    "issueDate": "2026-02-12",
    "issuerName": "Tech University",
    "transactionHash": "0x..."
  },
  "blockchainCert": {},
  "comparison": { "match": true },
  "message": "✅ Certificate verified on blockchain!"
}
```

### POST /api/student/career-insights
Generates or returns cached AI career insights.

Request:
```json
{ "regenerate": false }
```

Response:
```json
{
  "success": true,
  "insights": {
    "careerMatches": [{ "title": "Blockchain Developer", "matchPercentage": 88 }],
    "topSkills": ["Solidity", "Smart Contracts"],
    "nextSteps": [{ "step": "Step 1", "title": "Build project", "description": "Create dApp", "completed": false }],
    "summary": "Career summary...",
    "generatedAt": "2026-02-13T09:00:00.000Z"
  }
}
```

Errors:
- `400` no certificates found
- `500` Gemini API key missing / AI parse failure

### PATCH /api/student/portfolio/visibility
Toggle portfolio public/private.

Request:
```json
{ "isPublic": true }
```

Response:
```json
{
  "success": true,
  "message": "Portfolio visibility updated",
  "isPublic": true
}
```

### PATCH /api/student/profile
Update profile fields + optional files.

Content-Type: `multipart/form-data`

Fields:
- `full_name`
- `email`
- `gender`
- `birthdate`
- `github_url`
- `profile_photo` (file)
- `cv` (file)

Response:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "student": {
    "userId": "STU1739439723ABC12",
    "github_url": "https://github.com/johndoe",
    "profile_photo_url": "/uploads/students/photos/profile_photo-123.png",
    "cv_url": "/uploads/students/cvs/cv-123.pdf"
  }
}
```

## University API
Base: `/api/university`

### Public Endpoints

### POST /api/university/register
Register institute (pending approval by admin).

Content-Type: `multipart/form-data`

Fields:
- `institute_name` (required)
- `email` (required)
- `password` (required, min 8)
- `wallet_address` (required, `0x` + 40 hex)
- `logo` (optional file)
- `verification_doc` (required file)

Response (201, verification enabled):
```json
{
  "message": "Institute registered successfully. Verification email sent. Awaiting admin approval.",
  "verification_required": true,
  "email_sent": true,
  "institute": {
    "institute_id": "INST1739439723ABCD1234",
    "institute_name": "Tech University",
    "email": "admin@tech.edu",
    "logo_url": "/uploads/institutes/logos/logo-123.png",
    "verification_doc_url": "/uploads/institutes/documents/verification_doc-123.pdf"
  }
}
```

Response (201, verification disabled):
```json
{
  "message": "Institute registered successfully. Awaiting admin approval.",
  "token": "JWT_TOKEN",
  "institute": {
    "institute_id": "INST1739439723ABCD1234",
    "institute_name": "Tech University",
    "email": "admin@tech.edu",
    "logo_url": "/uploads/institutes/logos/logo-123.png",
    "verification_doc_url": "/uploads/institutes/documents/verification_doc-123.pdf"
  }
}
```

### POST /api/university/login
Request:
```json
{
  "email": "admin@tech.edu",
  "password": "password123"
}
```

Response:
```json
{
  "message": "Login successful",
  "token": "JWT_TOKEN",
  "institute": {
    "institute_id": "INST1739439723ABCD1234",
    "institute_name": "Tech University",
    "email": "admin@tech.edu"
  }
}
```

Special errors:
- `403` email not verified + `verification_required: true`
- `403` institute not approved (`verification_status != approved`)

### GET /api/university/verify-email?token=...
Returns HTML verification page.

### POST /api/university/resend-verification
Request:
```json
{ "email": "admin@tech.edu" }
```

Response:
```json
{ "success": true, "message": "Verification email sent." }
```

### Protected Endpoints (University JWT)

### GET /api/university/profile
Response:
```json
{
  "institute": {
    "institute_id": "INST1739439723ABCD1234",
    "institute_name": "Tech University",
    "email": "admin@tech.edu",
    "wallet_address": "0x1234...",
    "verification_status": "approved",
    "logo_url": "/uploads/institutes/logos/logo-123.png",
    "verification_doc_url": "/uploads/institutes/documents/verification_doc-123.pdf",
    "created_at": "2026-02-13T08:00:00.000Z"
  }
}
```

### GET /api/university/dashboard
Returns institute profile + aggregate certificate data.

### GET /api/university/students/search?query=john&limit=10
Notes:
- query length < 3 returns empty list
- limit max = 25 (default 10)

Response:
```json
{
  "success": true,
  "students": [{ "user_id": "STU...", "full_name": "John Doe", "email": "john@example.com" }]
}
```

### POST /api/university/certificate/issue
Issue one certificate directly via blockchain utility.

Request:
```json
{
  "student_id": "STU1739439723ABC12",
  "course_name": "Blockchain 101",
  "grade": "A"
}
```

Response (201):
```json
{
  "message": "Certificate issued successfully on blockchain!",
  "certificate": {
    "certificate_id": "CERT1739439723abcd1234",
    "student_id": "STU1739439723ABC12",
    "course_name": "Blockchain 101",
    "grade": "A",
    "issued_date": "2026-02-13",
    "blockchain": {
      "transactionHash": "0x...",
      "blockNumber": 12345,
      "gasUsed": "50000"
    },
    "status": "Confirmed on Polygon Amoy"
  }
}
```

### POST /api/university/certificate/sign-payload
Create hash/payload for wallet signature.

Request:
```json
{
  "student_id": "STU1739439723ABC12",
  "course_name": "Blockchain 101",
  "grade": "A"
}
```

Response:
```json
{
  "success": true,
  "certificate_id": "CERT1739439723abcd1234",
  "issued_date": "2026-02-13",
  "signer_address": "0x1234...",
  "message_hash": "0x...",
  "certData": {
    "certId": "CERT1739439723abcd1234",
    "studentName": "John Doe",
    "courseName": "Blockchain 101",
    "issueDate": "2026-02-13",
    "issuerName": "Tech University"
  }
}
```

### POST /api/university/certificate/issue-signed
Submit signed payload from wallet.

Request:
```json
{
  "certificate_id": "CERT1739439723abcd1234",
  "student_id": "STU1739439723ABC12",
  "course_name": "Blockchain 101",
  "grade": "A",
  "issued_date": "2026-02-13",
  "signature": "0x...",
  "signer_address": "0x1234...",
  "message_hash": "0x..."
}
```

Response (201):
```json
{
  "message": "Certificate issued successfully (MetaMask-signed, relayer-submitted)",
  "certificate": {
    "certificate_id": "CERT1739439723abcd1234",
    "student_id": "STU1739439723ABC12",
    "course_name": "Blockchain 101",
    "grade": "A",
    "issued_date": "2026-02-13",
    "blockchain": {
      "transactionHash": "0x...",
      "blockNumber": 12345,
      "gasUsed": "50000",
      "status": 1
    },
    "status": "Confirmed on Polygon Amoy"
  }
}
```

### POST /api/university/certificate/bulk-auth
Generate one authorization hash for bulk issuance.

Request:
```json
{ "certificate_count": 3 }
```

Response:
```json
{
  "success": true,
  "auth_hash": "0x...",
  "batch_id": 1739439723000,
  "certificate_count": 3,
  "expiry": 1739443323
}
```

### POST /api/university/certificate/bulk-issue-signed
Bulk issue using one signed authorization.

Request:
```json
{
  "auth_hash": "0x...",
  "auth_signature": "0x...",
  "signer_address": "0x1234...",
  "batch_id": 1739439723000,
  "certificate_count": 2,
  "expiry": 1739443323,
  "certificates": [
    {
      "certId": "CERTA001",
      "student_id": "STU1739439723ABC12",
      "studentName": "John Doe",
      "courseName": "Blockchain 101",
      "issueDate": "2026-02-13",
      "issuerName": "Tech University",
      "grade": "A"
    }
  ]
}
```

Response:
```json
{
  "success": true,
  "total": 2,
  "successful": 2,
  "failed": 0,
  "results": [
    {
      "certificate_id": "CERTA001",
      "student_id": "STU1739439723ABC12",
      "blockchain_tx_hash": "0x...",
      "blockchain_status": "confirmed",
      "blockchain_block": 12345,
      "blockchain_gas_used": "50000",
      "success": true
    }
  ]
}
```

### GET /api/university/certificates
Response:
```json
{
  "total": 10,
  "certificates": []
}
```

### POST /api/university/certificates/bulk
Simple bulk insertion endpoint (non-signature flow).

Request:
```json
{
  "certificates": [
    { "student_id": "STU1739439723ABC12", "course_name": "AI Fundamentals", "grade": "A" }
  ]
}
```

Response:
```json
{
  "message": "Bulk upload processed",
  "total": 1,
  "successful": 1,
  "failed": 0,
  "results": [
    {
      "index": 0,
      "certificate_id": "CERT1739439723AB123",
      "student_id": "STU1739439723ABC12",
      "course_name": "AI Fundamentals",
      "grade": "A",
      "status": "Success"
    }
  ]
}
```

## Admin API
Base: `/api/admin`

### POST /api/admin/login
Request:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

Response:
```json
{
  "message": "Login successful",
  "token": "JWT_TOKEN",
  "admin": {
    "admin_id": "ADMIN001",
    "username": "admin"
  }
}
```

### Protected (Admin JWT)

### GET /api/admin/profile
```json
{
  "admin": {
    "admin_id": "ADMIN001",
    "username": "admin",
    "created_at": "2026-02-13T08:00:00.000Z"
  }
}
```

### GET /api/admin/dashboard
```json
{
  "statistics": {},
  "pendingInstitutes": [],
  "totalPending": 0
}
```

### GET /api/admin/institutes
```json
{ "total": 0, "institutes": [] }
```

### GET /api/admin/institutes/pending
```json
{ "total": 0, "institutes": [] }
```

### GET /api/admin/institutes/:institute_id/issuer-status
```json
{
  "institute_id": "INST1739439723ABCD1234",
  "wallet_address": "0x1234...",
  "isIssuer": true
}
```

### POST /api/admin/institutes/:institute_id/approve
Approves DB status and attempts on-chain `addIssuer`.

### POST /api/admin/institutes/:institute_id/reject
Marks institute rejected.

Request body (optional):
```json
{ "reason": "Invalid document" }
```

### POST /api/admin/institutes/:institute_id/revoke
Revokes institute and attempts on-chain `removeIssuer`.

### GET /api/admin/statistics
Returns aggregate stats object from model layer.

### GET /api/admin/blockchain/status
Returns current chain connectivity/network details.

## Public Verification API
Base: `/api/verify`  
No auth required.

### GET /api/verify/certificate/:certificateId
Returns DB certificate + on-chain verification info.

Response:
```json
{
  "success": true,
  "certificate": {},
  "onchain": {
    "checked": true,
    "verified": true
  }
}
```

### GET /api/verify/user/:userId
Returns public portfolio data if portfolio visibility is enabled.

Response:
```json
{
  "success": true,
  "student": {
    "userId": "STU1739439723ABC12",
    "fullName": "John Doe",
    "email": "john@example.com",
    "profilePhotoUrl": "/uploads/students/photos/profile_photo-123.png",
    "cvUrl": "/uploads/students/cvs/cv-123.pdf",
    "githubUrl": "https://github.com/johndoe"
  },
  "certificates": [],
  "careerInsights": null
}
```

Special errors:
- `403 { "error": "This portfolio is private" }`
- `404` student not found

## Payment API
Base: `/api/payment`

### GET /api/payment/gas-cost
```json
{
  "success": true,
  "data": {
    "wei": "1000000000000000",
    "pol": "0.001"
  }
}
```

### GET /api/payment/balance?address=0x...
```json
{
  "success": true,
  "data": {
    "address": "0x1234...",
    "balanceWei": "1000000000000000000",
    "balancePol": "1.0",
    "gasSpentWei": "0",
    "gasSpentPol": "0.0"
  }
}
```

### POST /api/payment/issue-with-metamask
Request:
```json
{
  "certId": "CERT001",
  "studentName": "John Doe",
  "courseName": "Blockchain 101",
  "issueDate": "2026-02-13",
  "issuerName": "Tech University",
  "messageHash": "0x...",
  "signature": "0x...",
  "signerAddress": "0x1234..."
}
```

Response:
```json
{
  "success": true,
  "message": "Certificate issued on-chain with prepaid gas",
  "data": {
    "certId": "CERT001",
    "transactionHash": "0x...",
    "blockNumber": 12345,
    "gasUsed": "50000",
    "status": 1
  }
}
```

### POST /api/payment/bulk-issue
Request:
```json
{
  "signerAddress": "0x1234...",
  "certificates": [
    {
      "certId": "CERT001",
      "studentName": "John Doe",
      "courseName": "Blockchain 101",
      "issueDate": "2026-02-13",
      "issuerName": "Tech University",
      "messageHash": "0x...",
      "signature": "0x..."
    }
  ]
}
```

## MetaMask API
Base: `/api/metamask`

### POST /api/metamask/issue-with-metamask
Issue certificate after signature recovery and relayer submit.

### GET /api/metamask/status
Response:
```json
{
  "success": true,
  "data": {
    "installed": true,
    "requiredChain": {
      "id": 80002,
      "name": "Polygon Amoy",
      "rpc": "https://rpc-amoy.polygon.technology"
    },
    "contract": {
      "address": "0x7d6159A7cBd7061AA231288651e750B5c5046343",
      "network": "Polygon Amoy"
    }
  }
}
```

## Contact API
Base: `/api/contact`  
No auth required.

### POST /api/contact/send-message
Request:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Need Support",
  "message": "I need help verifying my certificate."
}
```

Validation constraints:
- `name`: 2-100 chars
- `email`: valid format, max 255 chars
- `subject`: 3-200 chars
- `message`: 10-5000 chars

Success:
```json
{
  "success": true,
  "message": "Your message has been sent successfully. We will get back to you soon."
}
```

Validation error:
```json
{
  "error": "Name is required",
  "errors": ["Name is required"]
}
```

Rate limit:
- Max 5 requests/hour/IP

Rate limit response:
```json
{
  "error": "Too many requests. Please try again in 12 minutes.",
  "retryAfter": 720
}
```

### GET /api/contact/health
Already documented in [Health and Utility Endpoints](#health-and-utility-endpoints).

## Error Handling
Typical shapes:
```json
{ "error": "Something went wrong" }
```
or
```json
{ "success": false, "error": "Something went wrong" }
```

Global fallbacks:
- `404 { "error": "Route not found" }`
- `500 { "error": "Internal server error" }`

## cURL Quick Tests

### Student Login
```bash
curl -X POST http://localhost:3001/api/auth/student/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"john@example.com\",\"password\":\"password123\"}"
```

### Student Dashboard
```bash
curl http://localhost:3001/api/student/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### University Bulk Auth
```bash
curl -X POST http://localhost:3001/api/university/certificate/bulk-auth \
  -H "Authorization: Bearer UNIVERSITY_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"certificate_count\":2}"
```

### Public Verify
```bash
curl http://localhost:3001/api/verify/certificate/CERT001
```

### Contact Form
```bash
curl -X POST http://localhost:3001/api/contact/send-message \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"John\",\"email\":\"john@example.com\",\"subject\":\"Help\",\"message\":\"Need help with verification\"}"
```

## Related Docs
- Main project documentation: `README.md`
- Smart contract documentation: `contracts/README.md`
