# Smart Contract: CertificateVerificationNoNonce

**Network:** Polygon (Amoy recommended for testing)

## Overview
This contract issues and verifies certificates on-chain using a trusted relayer and a prepaid gas balance model. It removes nonce usage to allow a single signature to authorize multiple certificate submissions, so uniqueness and replay protection must be enforced by the backend and relayer.

## Key Concepts
- **Issuers**: Universities or institutes authorized by the owner.
- **Relayers**: Trusted submitters that call issuance functions.
- **Prepaid gas**: Issuers deposit funds used to reimburse relayers per certificate.
- **No nonce**: Signatures can be reused; backend must enforce uniqueness.

## Core Functions
- `addIssuer(address issuer)`: Owner authorizes an issuer.
- `removeIssuer(address issuer)`: Owner revokes an issuer.
- `addRelayer(address relayer)`: Owner authorizes a relayer.
- `removeRelayer(address relayer)`: Owner revokes a relayer.
- `depositGasFund()`: Issuer deposits POL for issuance fees.
- `withdrawBalance(uint256 amount)`: Issuer withdraws remaining balance.
- `updateGasParameters(uint256 gasLimit, uint256 gasPrice)`: Owner updates gas pricing.
- `addCertificateWithSignature(...)`: Issue using a per-certificate signature.
- `addCertificateWithAuth(...)`: Issue using a single bulk authorization signature.
- `verifyCertificate(string certId)`: Read-only verification.
- `getCertificate(string certId)`: Read-only retrieval (reverts if missing).

## Signature Scheme
### Per-Certificate Signature
The issuer signs the hash below (no nonce):
```
messageHash = keccak256(abi.encodePacked(
  certId,
  studentName,
  courseName,
  issueDate,
  issuerName,
  authorizedSigner
))
```
The relayer submits `messageHash` and the EIP-191 signature to `addCertificateWithSignature`.

### Bulk Authorization Signature
The issuer signs a single authorization hash:
```
authHash = keccak256(abi.encodePacked(
  "BULK_AUTH",
  authorizedSigner,
  batchId,
  certificateCount,
  expiry
))
```
The relayer reuses the signature up to `certificateCount` times before `expiry`.

## Security Notes
- **No nonce means replay is possible**. The backend must guarantee unique `certId` and prevent resubmission.
- Keep relayer keys secure; only trusted relayers can submit certificates.
- Use server-side logging and idempotency checks for issuance.

## Deployment Notes
1. Deploy the contract with the owner account.
2. Add issuers and relayers using owner functions.
3. Update `CONTRACT_ADDRESS` in the backend `.env`.

## Events
- `CertificateIssued`
- `IssuerAdded`, `IssuerRemoved`
- `GasFundDeposited`, `BalanceWithdrawn`
