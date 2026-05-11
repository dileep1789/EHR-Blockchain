// GasLedger Model - Tracks hospital gas fund deposits and spending
const mongoose = require('mongoose');

const gasLedgerSchema = new mongoose.Schema({
  hospital_wallet: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    match: /^0x[a-fA-F0-9]{40}$/ // Validate Ethereum address
  },
  balance_deposited: { 
    type: String, // Store as string to handle large BigNumbers
    default: '0' 
  },
  balance_spent: { 
    type: String, // Calculated from on-chain balance: deposited - current_balance
    default: '0' 
  },
  balance_remaining: { 
    type: String, // Current balance from on-chain contract
    default: '0' 
  },
  last_deposit_tx: { 
    type: String, 
    default: null,
    description: 'Transaction hash of last depositGasFund call'
  },
  last_withdrawal_tx: { 
    type: String, 
    default: null,
    description: 'Transaction hash of last withdrawBalance call'
  },
  last_sync_time: {
    type: Date,
    default: Date.now,
    description: 'Last time balance was synced from contract'
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  },
  updated_at: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const GasLedgerModel = mongoose.models.GasLedger || mongoose.model('GasLedger', gasLedgerSchema);

class GasLedger {
  /**
   * Create or get ledger entry for a hospital wallet
   */
  static async getOrCreate(walletAddress) {
    let ledger = await GasLedgerModel.findOne({ hospital_wallet: walletAddress.toLowerCase() });
    if (!ledger) {
      ledger = new GasLedgerModel({
        hospital_wallet: walletAddress.toLowerCase(),
      });
      await ledger.save();
    }
    return ledger.toObject();
  }

  /**
   * Record a gas fund deposit
   */
  static async recordDeposit(walletAddress, amountWei, txHash) {
    const ledger = await GasLedgerModel.findOne({ hospital_wallet: walletAddress.toLowerCase() });
    if (!ledger) {
      throw new Error(`Gas ledger not found for wallet ${walletAddress}`);
    }

    // Add to existing deposited balance
    const prevDeposited = BigInt(ledger.balance_deposited || '0');
    const newDeposit = BigInt(amountWei);
    const totalDeposited = prevDeposited + newDeposit;

    await GasLedgerModel.updateOne(
      { hospital_wallet: walletAddress.toLowerCase() },
      {
        balance_deposited: totalDeposited.toString(),
        last_deposit_tx: txHash,
        updated_at: new Date()
      }
    );

    return await this.getOrCreate(walletAddress);
  }

  /**
   * Update balance tracking by syncing with on-chain state
   * Calculates: spent = deposited - remaining
   */
  static async syncBalance(walletAddress, currentBalanceWei) {
    const ledger = await GasLedgerModel.findOne({ hospital_wallet: walletAddress.toLowerCase() });
    if (!ledger) {
      throw new Error(`Gas ledger not found for wallet ${walletAddress}`);
    }

    const deposited = BigInt(ledger.balance_deposited || '0');
    const remaining = BigInt(currentBalanceWei);
    const spent = deposited > remaining ? (deposited - remaining) : BigInt(0);

    await GasLedgerModel.updateOne(
      { hospital_wallet: walletAddress.toLowerCase() },
      {
        balance_remaining: remaining.toString(),
        balance_spent: spent.toString(),
        last_sync_time: new Date(),
        updated_at: new Date()
      }
    );

    return await this.getOrCreate(walletAddress);
  }

  /**
   * Sync total deposits discovered from on-chain GasFundDeposited events.
   */
  static async syncDeposits(walletAddress, totalDepositedWei, lastDepositTx = null) {
    const ledger = await GasLedgerModel.findOne({ hospital_wallet: walletAddress.toLowerCase() });
    if (!ledger) {
      throw new Error(`Gas ledger not found for wallet ${walletAddress}`);
    }

    const currentDeposited = BigInt(ledger.balance_deposited || '0');
    const onchainDeposited = BigInt(totalDepositedWei || '0');

    if (onchainDeposited <= currentDeposited) {
      return ledger.toObject();
    }

    await GasLedgerModel.updateOne(
      { hospital_wallet: walletAddress.toLowerCase() },
      {
        balance_deposited: onchainDeposited.toString(),
        last_deposit_tx: lastDepositTx || ledger.last_deposit_tx,
        updated_at: new Date()
      }
    );

    return await this.getOrCreate(walletAddress);
  }

  /**
   * Get current ledger state
   */
  static async getBalance(walletAddress) {
    const ledger = await GasLedgerModel.findOne({ hospital_wallet: walletAddress.toLowerCase() });
    return ledger ? ledger.toObject() : null;
  }

  /**
   * Record a withdrawal
   */
  static async recordWithdrawal(walletAddress, txHash) {
    await GasLedgerModel.updateOne(
      { hospital_wallet: walletAddress.toLowerCase() },
      {
        last_withdrawal_tx: txHash,
        updated_at: new Date()
      }
    );

    return await this.getOrCreate(walletAddress);
  }
}

module.exports = GasLedger;
