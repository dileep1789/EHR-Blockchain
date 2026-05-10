// Backend endpoint for MetaMask-signed health records (MongoDB version)
const express = require('express');
const ethers = require('ethers');
const router = express.Router();
const blockchainService = require('../utils/blockchain');
const HealthRecord = require('../models/HealthRecord');

/**
 * POST /api/metamask/add-record-with-metamask
 */
router.post('/add-record-with-metamask', async (req, res) => {
  try {
    const {
      recordId, patientName, diagnosis, recordDate,
      providerName, messageHash, signature, signerAddress, hospitalId
    } = req.body;

    if (!recordId || !patientName || !diagnosis || !recordDate || !providerName || !messageHash || !signature || !signerAddress) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    console.log('📥 Received MetaMask signed record request');
    console.log('   Record ID:', recordId);
    console.log('   Signer:', signerAddress);

    // Verify signature
    const recoveredAddress = ethers.utils.recoverAddress(messageHash, signature);
    if (recoveredAddress.toLowerCase() !== signerAddress.toLowerCase()) {
      return res.status(401).json({ success: false, error: 'Signature verification failed' });
    }
    console.log('✅ Signature verified, recovered address:', recoveredAddress);

    // Submit to blockchain
    const transactionResult = await blockchainService.issueWithMetaMaskSignature(
      { recordId, patientName, diagnosis, recordDate, providerName },
      messageHash, signature, signerAddress
    );
    console.log('✅ Record issued on blockchain, TX:', transactionResult.txHash);

    // Save to MongoDB
    await HealthRecord.create({
      record_id: recordId,
      patient_name: patientName,
      diagnosis,
      record_date: recordDate,
      hospital_name: providerName,
      hospital_id: hospitalId || signerAddress,
      blockchain_tx_hash: transactionResult.txHash,
      blockchain_verified: true
    });

    res.json({
      success: true,
      message: 'Health record added successfully',
      data: {
        recordId,
        transactionHash: transactionResult.txHash,
        blockNumber: transactionResult.blockNumber,
        gasUsed: transactionResult.gasUsed,
      }
    });
  } catch (error) {
    console.error('❌ Error issuing record:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/metamask/status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      requiredChain: { id: 80002, name: 'Polygon Amoy', rpc: 'https://rpc-amoy.polygon.technology' },
      contract: { address: process.env.CONTRACT_ADDRESS || '0x...', network: 'Polygon Amoy' }
    }
  });
});

module.exports = router;
