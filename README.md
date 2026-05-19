# EHRChain - Blockchain-Anchored Medical Record Platform

EHRChain is a professional-grade, local-first Electronic Health Record (EHR) platform designed to provide a secure, immutable, and patient-centric healthcare environment. Built on Ethereum-compatible blockchain technology, it ensures that every medical record, diagnosis, and clinical finding is cryptographically signed and verified by licensed healthcare providers.

![EHRChain Banner](https://img.shields.io/badge/Status-Clinical--Grade-emerald?style=for-the-badge)
![Blockchain](https://img.shields.io/badge/Blockchain-Verified-blue?style=for-the-badge)
![Local-First](https://img.shields.io/badge/Architecture-Local--First-orange?style=for-the-badge)

## 🏥 Key Features

### 🔐 Blockchain Integrity
- **Immutable Records**: Every health record is anchored to the local Hardhat blockchain (`Chain ID: 31337`).
- **Cryptographic Signatures**: Hospitals use MetaMask to sign record hashes, ensuring non-repudiation of clinical findings.
- **On-Chain Verification**: Anyone with a Record ID can verify the authenticity and provider of a record directly on the blockchain.

### 👩‍⚕️ Hospital Provider Portal
- **Single & Bulk Issuance**: Issue individual records or upload CSVs for large-scale clinical assessments.
- **Clinical Dashboard**: Track issuance statistics, wallet balances, and recent patient interactions.
- **Provider Identity**: Secure hospital registration with administrative approval workflows and official logo/verification document handling.

### 👤 Patient Dashboard
- **Clinical Timeline**: A secure view of all verified medical records and diagnoses.
- **Medical Profile**: Manage clinical data including Blood Group, Medical History, and Profile Pictures.
- **Secure Sharing**: Export professional "Medical Certificates" as PDFs or share a secure public record link via QR code.

### 🛡️ Administrative Control
- **Provider Approval**: Centralized management for reviewing and approving healthcare providers.
- **System Monitoring**: Global statistics on total records issued and active clinical institutions.
- **Session Isolation**: Advanced JWT-based role isolation to prevent cross-portal authorization conflicts.

## 🛠️ Technology Stack

- **Frontend**: React (Vite), Vanilla CSS (Premium Aesthetics), Lucide Icons, Google Fonts (Inter/Outfit).
- **Backend**: Node.js, Express, Mongoose (MongoDB).
- **Blockchain**: Solidity (Smart Contracts), Hardhat (Local Node), Ethers.js, MetaMask.
- **Authentication**: Role-based JWT (Admin, Hospital, Patient).

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas)
- [MetaMask](https://metamask.io/) Browser Extension

### 2. Smart Contract Setup
```bash
# In the root directory
npx hardhat node
# In a new terminal
npx hardhat run scripts/deploy.js --network localhost
```
*Note: Copy the deployed contract address to your `.env` files.*

### 3. Backend Setup
```bash
cd cert-system-backend
npm install
# Configure your .env with MONGO_URI, JWT_SECRET, and CONTRACT_ADDRESS
npm start
```

### 4. Frontend Setup
```bash
cd cert-system-frontend
npm install
# Configure VITE_API_BASE_URL and VITE_CONTRACT_ADDRESS
npm run dev
```

## 📋 CSV Bulk Upload Format
When using the bulk issuance tool, ensure your CSV follows this structure:
`patient_id, diagnosis, medical_status`
Example: `PAT1778, Hypertension, Stable`

## ⚖️ License
This project is developed for secure clinical demonstrations and healthcare research.

---
*Built with ❤️ for the future of decentralized healthcare.* 
#this project total work on blockckain based and there patient data record 
