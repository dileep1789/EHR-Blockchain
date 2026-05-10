const express = require('express');
const { ethers } = require('ethers');
const router = express.Router();

const blockchainService = require('../utils/blockchain');

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
 * Returns prepaid balance and gas spent for a university wallet.
 */
router.get('/balance', async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) {
      return res.status(400).json({ success: false, error: 'address is required' });
    }

    const balanceWei = await blockchainService.getHospitalBalance(address);
    const gasSpentWei = ethers.BigNumber.from(0); // not tracked in contract

    res.json({
      success: true,
      data: {
        address,
        balanceWei: balanceWei.toString(),
        balancePol: ethers.utils.formatEther(balanceWei),
        gasSpentWei: gasSpentWei.toString(),
        gasSpentPol: ethers.utils.formatEther(gasSpentWei)
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

    // Gas ledger logging (MongoDB version - optional, add GasCost model if needed)
    try {
      const gasCostWei = await blockchainService.getGasCostWei();
      const gasCostPol = ethers.utils.formatEther(gasCostWei);
      console.log(`Gas cost logged: certId=${certId}, wallet=${signerAddress}, cost=${gasCostPol} POL, tx=${txResult.txHash}`);
    } catch (loggingError) {
      console.warn('Gas cost logging skipped:', loggingError.message);
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
