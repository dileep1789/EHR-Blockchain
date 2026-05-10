# CertiChain Frontend

Web3 certificate issuance and verification UI built with React, Vite, and Tailwind CSS. This app provides role-based dashboards for students, institutes, and admins, plus public verification and portfolio sharing.

## Features
- Multi-role authentication (student, institute, admin)
- Certificate issuance, bulk issuance, and history views
- Public certificate verification and public student portfolio route
- MetaMask-gated flows for blockchain actions
- API client with token-aware interceptors

## Tech Stack
- React 19
- React Router DOM 7
- Vite 7
- Tailwind CSS 4
- Axios
- Ethers

## Setup
### Prerequisites
- Node.js 18+ and npm

### Install
```bash
npm install
```

### Run (Development)
```bash
npm run dev
```

Vite dev server runs at `http://localhost:5173/`.

## Environment Variables
Create a local `.env` file (or copy `.env.example`) and set:
```
VITE_API_BASE_URL=http://localhost:3001/api
```

The frontend reads this in `src/services/api.js`.

## Scripts
```bash
npm run dev
npm run build
npm run build:staging
npm run build:production
npm run preview
npm run lint
```

## Routes
| Route | Component | Auth | Role |
|-------|-----------|------|------|
| `/` | Homepage | No | Public |
| `/login` | Login | No | Public |
| `/signup` | Signup | No | Public |
| `/verify` | VerifyPage | No | Public |
| `/privacy-policy` | PrivacyPolicy | No | Public |
| `/admin/login` | AdminLogin | No | Public |
| `/studentdashboard` | StudentDashboard (layout) | Yes | Student |
| `/studentportfolio` | StudentPortfolio | Yes | Student |
| `/portfolio/:userId` | StudentPortfolio | No | Public |
| `/institute/dashboard` | InstituteDashboard | Yes | Institute |
| `/institute/issue` | IssueCertificate | Yes | Institute |
| `/institute/bulk-issue` | BulkIssue | Yes | Institute |
| `/institute/history` | History | Yes | Institute |
| `/institute/wallet` | Wallet | Yes | Institute |
| `/admin/dashboard` | AdminDashboard | Yes | Admin |
| `/admin/approvals` | AdminApprovals | Yes | Admin |
| `/admin/institutes` | AdminInstitutes | Yes | Admin |

## Project Structure
```
src/
├── routes/
│   ├── AppRoutes.jsx
│   └── ProtectedRoutes.jsx
├── layouts/
│   ├── StudentLayout.jsx
│   ├── InstituteLayout.jsx
│   └── AdminLayout.jsx
├── components/
├── pages/
│   ├── Home/
│   ├── Auth/
│   ├── Verify/
│   ├── Student/
│   ├── Institute/
│   ├── Admin/
│   └── Legal/
├── context/
├── services/
│   └── api.js
├── styles/
│   └── index.css
├── App.jsx
└── main.jsx
```

## API Integration
API utilities live in `src/services/api.js`. Tokens are stored in:
- `studentToken`
- `instituteToken`
- `adminToken`

The Axios interceptor automatically attaches the first available token and redirects to the appropriate login on 401.

Backend documentation is in `backenddocumentation.md`.

## MetaMask Notes
Blockchain-related pages require a connected wallet. The UI will block access until MetaMask is connected, and expects Polygon Amoy testnet.

## Build Output
`npm run build` outputs to `dist/`.

## Team Members
- Teshan Pamodya
- Kavindu Lakshan
- Chamath Theekshana
- Thamindu Keshan

## Troubleshooting
| Issue | Fix |
|------|-----|
| CORS errors | Ensure backend runs on `http://localhost:3001` |
| 401 redirects | Clear tokens from localStorage and re-login |
| Tailwind not applied | Verify `src/styles/index.css` is imported in `src/main.jsx` |
| API 404 | Confirm `VITE_API_BASE_URL` matches backend base path |

## Next Steps
1. Finalize UI styling and responsive layouts
2. Wire remaining API calls and error states
3. Add form validation and UX polish
4. Set up deployment pipeline
