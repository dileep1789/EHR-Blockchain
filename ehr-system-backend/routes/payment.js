const express = require('express');
const { ethers } = require('ethers');
const router = express.Router();

const blockchainService = require('../utils/blockchain');
const GasLedger = require('../models/GasLedger');

/**
 * GET /api/payment/gas-cost
 * Returns on-chain gas cost per certificate in wei and POL.
 */
router.get('/gas-cost', async (req, res) => {
  try {
    const costWei = await blockchainService.getGasCostWei();
    res.json({
      success: true,
      data: {
        wei: costWei.toString(),
        pol: ethers.utils.formatEther(costWei)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/payment/balance?address=<wallet>
 * Returns prepaid balance and gas spent for a hospital wallet.
 * Gas spending is tracked in database ledger and synced with on-chain state.
 */
router.get('/balance', async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) {
      return res.status(400).json({ success: false, error: 'address is required' });
    }

    // Ensure ledger exists for this wallet
    await GasLedger.getOrCreate(address);

    // Get current balance from on-chain contract
    const balanceWei = await blockchainService.getHospitalBalance(address);

    // Deposits happen directly through MetaMask, so rebuild deposited total
    // from contract events before calculating spent.
    const deposits = await blockchainService.getGasFundDeposits(address);
    if (deposits.totalWei && deposits.totalWei !== '0') {
      await GasLedger.syncDeposits(address, deposits.totalWei, deposits.lastTxHash);
    }

    // Sync ledger with on-chain state (calculates spent = deposited - remaining)
    const ledger = await GasLedger.syncBalance(address, balanceWei.toString());

    res.json({
      success: true,
      data: {
        address: address.toLowerCase(),
        balanceWei: balanceWei.toString(),
        balancePol: ethers.utils.formatEther(balanceWei),
        gasSpentWei: ledger.balance_spent,
        gasSpentPol: ethers.utils.formatEther(ledger.balance_spent),
        totalDepositedWei: ledger.balance_deposited,
        totalDepositedPol: ethers.utils.formatEther(ledger.balance_deposited),
        depositEventCount: deposits.count || 0,
        lastSyncTime: ledger.last_sync_time,
        lastDepositTx: ledger.last_deposit_tx
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/payment/issue-with-metamask
 * Body: certId, studentName, courseName, issueDate, issuerName, messageHash, signature, signerAddress
 */
router.post('/issue-with-metamask', async (req, res) => {
  try {
    const {
      record_id,
      patient_name,
      diagnosis,
      record_date,
      hospital_name,
      message_hash,
      signature,
      signer_address
    } = req.body;

    if (!record_id || !patient_name || !diagnosis || !record_date || !hospital_name || !message_hash || !signature || !signer_address) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const recordData = { recordId: record_id, patientName: patient_name, diagnosis: diagnosis, recordDate: record_date, providerName: hospital_name };
    const { messageHash: expectedHash } = await blockchainService.computeRecordHash(recordData, signer_address);

    if (expectedHash.toLowerCase() !== message_hash.toLowerCase()) {
      return res.status(400).json({ success: false, error: 'Message hash mismatch. Recreate signature including signer address.' });
    }

    const txResult = await blockchainService.issueWithMetaMaskSignature(recordData, message_hash, signature, signer_address);

    // Sync gas ledger after successful record issuance
    try {
      await GasLedger.getOrCreate(signer_address);
      const gasCostWei = await blockchainService.getGasCostWei();
      const gasCostPol = ethers.utils.formatEther(gasCostWei);
      console.log(`✅ Record issued: recordId=${record_id}, wallet=${signer_address}, gasCost=${gasCostPol} POL, tx=${txResult.txHash}`);
    } catch (loggingError) {
      console.warn('⚠️  Gas ledger sync skipped:', loggingError.message);
    }

    res.json({
      success: true,
      message: 'Record issued on-chain with prepaid gas',
      data: {
        record_id,
        transactionHash: txResult.txHash,
        blockNumber: txResult.blockNumber,
        gasUsed: txResult.gasUsed,
        status: txResult.status
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/payment/bulk-issue
 * Body: signerAddress, certificates: [{ certId, studentName, courseName, issueDate, issuerName, messageHash, signature }]
 */
router.post('/bulk-issue', async (req, res) => {
  try {
    const { signerAddress, certificates } = req.body;
    if (!signerAddress || !Array.isArray(certificates) || certificates.length === 0) {
      return res.status(400).json({ success: false, error: 'signerAddress and certificates[] are required' });
    }

    const entries = certificates.map((c) => {
      const certData = {
        certId: c.certId,
        studentName: c.studentName,
        courseName: c.courseName,
        issueDate: c.issueDate,
        issuerName: c.issuerName
      };
      const expectedHash = blockchainService.buildMessageHash(certData, signerAddress);
      if (!c.messageHash || expectedHash.toLowerCase() !== c.messageHash.toLowerCase()) {
        throw new Error(`Message hash mismatch for certificate ${c.certId}`);
      }
      return {
        certData,
        messageHash: c.messageHash,
        signature: c.signature
      };
    });

    const results = await blockchainService.issueBulkWithPayment(entries, signerAddress);

    res.json({ success: true, message: 'Bulk issuance complete', data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
