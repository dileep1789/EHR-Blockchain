// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract EHRRegistry is Ownable {
    using ECDSA for bytes32;

    struct HealthRecord {
        string patientName;
        string diagnosis;
        string recordDate;
        string providerName;
        address provider;
        bool exists;
    }

    mapping(string => HealthRecord) private records;
    mapping(address => bool) public authorizedProviders;
    mapping(address => bool) public relayers;
    mapping(address => uint256) public hospitalBalance;

    uint256 public gasLimitPerRecord = 300000;
    uint256 public gasPriceForRecord = 30 gwei;

    event RecordAdded(string indexed recordId, string patientName, string diagnosis, address indexed provider, string recordDate);
    event ProviderAdded(address indexed provider);
    event ProviderRemoved(address indexed provider);
    event GasFundDeposited(address indexed hospital, uint256 amount);

    constructor() Ownable(msg.sender) {}

    function addProvider(address provider) external onlyOwner {
        authorizedProviders[provider] = true;
        emit ProviderAdded(provider);
    }

    function addRelayer(address relayer) external onlyOwner {
        relayers[relayer] = true;
    }

    function removeProvider(address provider) external onlyOwner {
        authorizedProviders[provider] = false;
        emit ProviderRemoved(provider);
    }

    function removeRelayer(address relayer) external onlyOwner {
        relayers[relayer] = false;
    }

    function depositGasFund() external payable {
        hospitalBalance[msg.sender] += msg.value;
        emit GasFundDeposited(msg.sender, msg.value);
    }

    function withdrawBalance(uint256 amount) external {
        require(hospitalBalance[msg.sender] >= amount, "Insufficient balance");
        hospitalBalance[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
    }

    function addRecordWithSignature(
        string memory recordId,
        string memory patientName,
        string memory diagnosis,
        string memory recordDate,
        string memory providerName,
        address authorizedSigner,
        bytes32 messageHash,
        bytes memory signature
    ) external {
        require(relayers[msg.sender], "Relayer not authorized");
        require(!records[recordId].exists, "Record already exists");
        require(authorizedProviders[authorizedSigner], "Signer not authorized");

        uint256 gasCost = gasLimitPerRecord * gasPriceForRecord;
        require(hospitalBalance[authorizedSigner] >= gasCost, "Insufficient balance");
        hospitalBalance[authorizedSigner] -= gasCost;
        payable(msg.sender).transfer(gasCost);

        require(keccak256(abi.encodePacked(recordId, patientName, diagnosis, recordDate, providerName, authorizedSigner)) == messageHash, "Hash mismatch");
        require(ECDSA.recover(MessageHashUtils.toEthSignedMessageHash(messageHash), signature) == authorizedSigner, "Invalid signature");

        records[recordId] = HealthRecord(patientName, diagnosis, recordDate, providerName, authorizedSigner, true);
        emit RecordAdded(recordId, patientName, diagnosis, authorizedSigner, recordDate);
    }

    function verifyRecord(string memory recordId) external view returns (bool exists, string memory patientName, string memory diagnosis, string memory recordDate, string memory providerName, address provider) {
        HealthRecord memory r = records[recordId];
        return (r.exists, r.patientName, r.diagnosis, r.recordDate, r.providerName, r.provider);
    }

    function getRecord(string memory recordId) external view returns (HealthRecord memory) {
        require(records[recordId].exists, "Record not found");
        return records[recordId];
    }

    receive() external payable {}
}
