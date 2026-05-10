// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title CertificateVerificationNoNonce
 * @notice Certificate issuance with signature verification, prepaid gas balance system, NO NONCE
 * @dev This version removes nonce for sign-once-bulk functionality while keeping all payment features
 * 
 * IMPORTANT: Removing nonce means signatures can be reused. Security relies on:
 * - Backend validation and deduplication (check certificate_id uniqueness)
 * - Trusted relayer (only submit valid unique certificates)
 * - Server-side logging to prevent replay attacks
 */
contract CertificateVerificationNoNonce is Ownable2Step {
    using ECDSA for bytes32;

    struct Certificate {
        string studentName;
        string courseName;
        string issueDate;
        string issuerName;
        address issuer;
        bool exists;
    }

    // Certificate storage
    mapping(string => Certificate) private certificates;

    // Issuer authorization
    mapping(address => bool) public issuers;

    // Relayer authorization (trusted submitters)
    mapping(address => bool) public relayers;

    // Prepaid balance system (pay-per-cert gas debit)
    mapping(address => uint256) public universityBalance;

    // Bulk authorization usage tracker: authHash => used count
    mapping(bytes32 => uint256) public bulkUsed;

    // Gas configuration
    uint256 public gasLimitPerCertificate = 300000;
    uint256 public gasPriceForCertificate = 30 gwei;

    event CertificateIssued(
        string indexed certId,
        string studentName,
        string courseName,
        address indexed issuer,
        string issueDate
    );

    event IssuerAdded(address indexed issuer);
    event IssuerRemoved(address indexed issuer);
    event GasFundDeposited(address indexed university, uint256 amount);
    event BalanceWithdrawn(address indexed university, uint256 amount);

    modifier onlyIssuer() {
        require(issuers[msg.sender], "Not authorized issuer");
        _;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Add authorized issuer
     */
    function addIssuer(address issuer) external onlyOwner {
        require(issuer != address(0), "Invalid address");
        issuers[issuer] = true;
        emit IssuerAdded(issuer);
    }

    /**
     * @notice Add trusted relayer (owner only)
     */
    function addRelayer(address relayer) external onlyOwner {
        require(relayer != address(0), "Invalid address");
        relayers[relayer] = true;
    }

    /**
     * @notice Remove issuer authorization
     */
    function removeIssuer(address issuer) external onlyOwner {
        issuers[issuer] = false;
        emit IssuerRemoved(issuer);
    }

    /**
     * @notice Remove relayer authorization
     */
    function removeRelayer(address relayer) external onlyOwner {
        relayers[relayer] = false;
    }

    /**
     * @notice Deposit prepaid gas funds for certificate issuance
     */
    function depositGasFund() external payable {
        require(msg.value > 0, "Must send funds");
        universityBalance[msg.sender] += msg.value;
        emit GasFundDeposited(msg.sender, msg.value);
    }

    /**
     * @notice Withdraw remaining balance
     */
    function withdrawBalance(uint256 amount) external {
        require(universityBalance[msg.sender] >= amount, "Insufficient balance");
        universityBalance[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
        emit BalanceWithdrawn(msg.sender, amount);
    }

    /**
     * @notice Update gas parameters (owner only)
     */
    function updateGasParameters(uint256 _gasLimit, uint256 _gasPrice) external onlyOwner {
        gasLimitPerCertificate = _gasLimit;
        gasPriceForCertificate = _gasPrice;
    }

    /**
     * @notice Issue certificate with signature verification (NO NONCE - enables sign-once-bulk)
     * @dev University signs message hash once, relayer can reuse for batch. Backend must prevent duplicates.
     */
    function addCertificateWithSignature(
        string memory certId,
        string memory studentName,
        string memory courseName,
        string memory issueDate,
        string memory issuerName,
        address authorizedSigner,
        bytes32 messageHash,
        bytes memory signature
    ) external {
        require(relayers[msg.sender], "Relayer not authorized");
        require(!certificates[certId].exists, "Certificate already exists");
        require(issuers[authorizedSigner], "Signer not authorized");

        // Deduct gas cost from university balance
        {
            uint256 gasCost = gasLimitPerCertificate * gasPriceForCertificate;
            require(universityBalance[authorizedSigner] >= gasCost, "Insufficient balance");
            universityBalance[authorizedSigner] -= gasCost;
            payable(msg.sender).transfer(gasCost);
        }

        // Verify signature (NO NONCE in hash)
        require(
            keccak256(abi.encodePacked(certId, studentName, courseName, issueDate, issuerName, authorizedSigner)) == messageHash,
            "Hash mismatch"
        );

        // Add EIP-191 prefix to messageHash for signature recovery
        require(
            ECDSA.recover(MessageHashUtils.toEthSignedMessageHash(messageHash), signature) == authorizedSigner,
            "Invalid signature"
        );

        // Store certificate
        Certificate storage cert = certificates[certId];
        cert.studentName = studentName;
        cert.courseName = courseName;
        cert.issueDate = issueDate;
        cert.issuerName = issuerName;
        cert.issuer = authorizedSigner;
        cert.exists = true;

        emit CertificateIssued(certId, studentName, courseName, authorizedSigner, issueDate);
    }

    /**
     * @notice Issue certificate using a single bulk authorization signature (one signature reused)
     * @dev Auth hash pattern: keccak256(abi.encodePacked("BULK_AUTH", authorizedSigner, batchId, certificateCount, expiry))
     */
    function addCertificateWithAuth(
        string memory certId,
        string memory studentName,
        string memory courseName,
        string memory issueDate,
        string memory issuerName,
        address authorizedSigner,
        bytes32 authHash,
        bytes memory authSignature,
        uint256 batchId,
        uint256 certificateCount,
        uint256 expiry
    ) external {
        require(relayers[msg.sender], "Relayer not authorized");
        require(issuers[authorizedSigner], "Signer not authorized");
        require(block.timestamp <= expiry, "Auth expired");
        require(certificateCount > 0, "certificateCount=0");
        require(bulkUsed[authHash] < certificateCount, "Auth quota exceeded");

        // Validate auth hash and signature (EIP-191)
        require(
            keccak256(abi.encodePacked("BULK_AUTH", authorizedSigner, batchId, certificateCount, expiry)) == authHash,
            "Auth hash mismatch"
        );

        require(
            ECDSA.recover(MessageHashUtils.toEthSignedMessageHash(authHash), authSignature) == authorizedSigner,
            "Invalid auth signature"
        );

        require(!certificates[certId].exists, "Certificate already exists");

        {
            uint256 gasCost = gasLimitPerCertificate * gasPriceForCertificate;
            require(universityBalance[authorizedSigner] >= gasCost, "Insufficient balance");
            universityBalance[authorizedSigner] -= gasCost;
            payable(msg.sender).transfer(gasCost);
        }

        {
            Certificate storage cert = certificates[certId];
            cert.studentName = studentName;
            cert.courseName = courseName;
            cert.issueDate = issueDate;
            cert.issuerName = issuerName;
            cert.issuer = authorizedSigner;
            cert.exists = true;
        }

        bulkUsed[authHash] += 1;

        emit CertificateIssued(certId, studentName, courseName, authorizedSigner, issueDate);
    }

    /**
     * @notice Verify certificate authenticity
     */
    function verifyCertificate(string memory certId)
        external
        view
        returns (
            bool exists,
            string memory studentName,
            string memory courseName,
            string memory issueDate,
            string memory issuerName,
            address issuer
        )
    {
        Certificate memory cert = certificates[certId];
        return (
            cert.exists,
            cert.studentName,
            cert.courseName,
            cert.issueDate,
            cert.issuerName,
            cert.issuer
        );
    }

    /**
     * @notice Get certificate details
     */
    function getCertificate(string memory certId)
        external
        view
        returns (Certificate memory)
    {
        require(certificates[certId].exists, "Certificate not found");
        return certificates[certId];
    }

    /**
     * @notice Withdraw native POL balance (owner only)
     * @dev Allows owner to withdraw any POL sent directly to the contract
     */
    function withdrawNative(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient contract balance");
        payable(owner()).transfer(amount);
    }

    /**
     * @notice Withdraw all native POL balance (owner only)
     */
    function withdrawAllNative() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No native balance to withdraw");
        payable(owner()).transfer(balance);
    }

    /**
     * @notice Get contract's native POL balance
     */
    function getNativeBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Allow contract to receive POL
     */
    receive() external payable {}
}
