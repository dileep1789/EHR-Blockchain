// Blockchain Integration - Interact with EHRRegistry
const { ethers } = require('ethers');
require('dotenv').config();

// Contract ABI for EHRRegistry (deployed on Polygon Amoy)
const CONTRACT_ABI = [
  { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" },
  { "inputs": [], "name": "ECDSAInvalidSignature", "type": "error" },
  { "inputs": [ { "internalType": "uint256", "name": "length", "type": "uint256" } ], "name": "ECDSAInvalidSignatureLength", "type": "error" },
  { "inputs": [ { "internalType": "bytes32", "name": "s", "type": "bytes32" } ], "name": "ECDSAInvalidSignatureS", "type": "error" },
  { "inputs": [ { "internalType": "address", "name": "owner", "type": "address" } ], "name": "OwnableInvalidOwner", "type": "error" },
  { "inputs": [ { "internalType": "address", "name": "account", "type": "address" } ], "name": "OwnableUnauthorizedAccount", "type": "error" },
  { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "hospital", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "BalanceWithdrawn", "type": "event" },
  { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "string", "name": "recordId", "type": "string" }, { "indexed": false, "internalType": "string", "name": "patientName", "type": "string" }, { "indexed": false, "internalType": "string", "name": "diagnosis", "type": "string" }, { "indexed": true, "internalType": "address", "name": "provider", "type": "address" }, { "indexed": false, "internalType": "string", "name": "recordDate", "type": "string" } ], "name": "RecordAdded", "type": "event" },
  { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "hospital", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "GasFundDeposited", "type": "event" },
  { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "provider", "type": "address" } ], "name": "ProviderAdded", "type": "event" },
  { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "provider", "type": "address" } ], "name": "ProviderRemoved", "type": "event" },
  { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" } ], "name": "OwnershipTransferred", "type": "event" },
  { "inputs": [ { "internalType": "string", "name": "recordId", "type": "string" }, { "internalType": "string", "name": "patientName", "type": "string" }, { "internalType": "string", "name": "diagnosis", "type": "string" }, { "internalType": "string", "name": "recordDate", "type": "string" }, { "internalType": "string", "name": "providerName", "type": "string" }, { "internalType": "address", "name": "authorizedSigner", "type": "address" }, { "internalType": "bytes32", "name": "messageHash", "type": "bytes32" }, { "internalType": "bytes", "name": "signature", "type": "bytes" } ], "name": "addRecordWithSignature", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [ { "internalType": "address", "name": "provider", "type": "address" } ], "name": "addProvider", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [ { "internalType": "address", "name": "relayer", "type": "address" } ], "name": "addRelayer", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "name": "depositGasFund", "outputs": [], "stateMutability": "payable", "type": "function" },
  { "inputs": [], "name": "gasLimitPerRecord", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "gasPriceForRecord", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [ { "internalType": "string", "name": "recordId", "type": "string" } ], "name": "getRecord", "outputs": [ { "components": [ { "internalType": "string", "name": "patientName", "type": "string" }, { "internalType": "string", "name": "diagnosis", "type": "string" }, { "internalType": "string", "name": "recordDate", "type": "string" }, { "internalType": "string", "name": "providerName", "type": "string" }, { "internalType": "address", "name": "provider", "type": "address" }, { "internalType": "bool", "name": "exists", "type": "bool" } ], "internalType": "struct EHRRegistry.HealthRecord", "name": "", "type": "tuple" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [ { "internalType": "address", "name": "", "type": "address" } ], "name": "authorizedProviders", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [ { "internalType": "address", "name": "provider", "type": "address" } ], "name": "removeProvider", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [ { "internalType": "address", "name": "relayer", "type": "address" } ], "name": "removeRelayer", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [ { "internalType": "address", "name": "", "type": "address" } ], "name": "hospitalBalance", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [ { "internalType": "string", "name": "recordId", "type": "string" } ], "name": "verifyRecord", "outputs": [ { "internalType": "bool", "name": "exists", "type": "bool" }, { "internalType": "string", "name": "patientName", "type": "string" }, { "internalType": "string", "name": "diagnosis", "type": "string" }, { "internalType": "string", "name": "recordDate", "type": "string" }, { "internalType": "string", "name": "providerName", "type": "string" }, { "internalType": "address", "name": "provider", "type": "address" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [ { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "withdrawBalance", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
];

class BlockchainService {
  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    this.wallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, this.provider);
    this.contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      CONTRACT_ABI,
      this.wallet
    );
  }

  formatWeiToPol(valueWei) {
    return Number(ethers.utils.formatEther(valueWei));
  }

  async getGasCostWei() {
    const [limit, price] = await Promise.all([
      this.contract.gasLimitPerRecord(),
      this.contract.gasPriceForRecord()
    ]);
    return ethers.BigNumber.from(limit).mul(price);
  }

  async getHospitalBalance(address) {
    try {
      if (!address || address === '-') return ethers.BigNumber.from(0);
      const bal = await this.contract.hospitalBalance(address);
      return ethers.BigNumber.from(bal);
    } catch (error) {
      console.error(`❌ Error fetching balance for ${address}:`, error.message);
      // Return 0 instead of throwing to prevent route crash
      return ethers.BigNumber.from(0);
    }
  }

  async computeRecordHash(recordData, signerAddress) {
    const { recordId, patientName, diagnosis, recordDate, providerName } = recordData;
    const messageHash = ethers.utils.solidityKeccak256(
      ['string', 'string', 'string', 'string', 'string', 'address'],
      [recordId, patientName, diagnosis, recordDate, providerName, signerAddress]
    );
    return { messageHash };
  }

  async verifyRecord(recordId) {
    try {
      console.log(`🔍 Verifying record on blockchain: ${recordId}`);

      const result = await this.contract.verifyRecord(recordId);
      const exists = result[0];
      if (!exists) {
        return { exists: false, verified: false, message: 'Record not found on blockchain' };
      }

      return {
        exists: true,
        verified: true,
        data: {
          recordId: recordId,
          patientName: result[1],
          diagnosis: result[2],
          recordDate: result[3],
          providerName: result[4],
          providerWallet: result[5]
        }
      };
    } catch (error) {
      console.error('❌ Verification error:', error.message);
      return {
        exists: false,
        verified: false,
        error: error.message
      };
    }
  }

  async issueWithMetaMaskSignature(recordData, messageHash, signature, signerAddress) {
    try {
      console.log('📝 Issuing record with MetaMask signature (relayer submit)...');
      console.log('   Signer:', signerAddress);
      
      const { messageHash: contractHash } = await this.computeRecordHash(recordData, signerAddress);
      if (contractHash.toLowerCase() !== messageHash.toLowerCase()) {
        throw new Error('Message hash mismatch with computed hash');
      }

      const recoveredAddress = ethers.utils.verifyMessage(ethers.utils.arrayify(messageHash), signature);
      if (recoveredAddress.toLowerCase() !== signerAddress.toLowerCase()) {
        throw new Error('Signature verification failed - recovered address does not match signer');
      }

      const isProvider = await this.isProvider(signerAddress);
      console.log(`Checking if ${signerAddress} is an authorized provider: ${isProvider}`);
      if (!isProvider) {
        throw new Error(`Signer ${signerAddress} is not an authorized provider on-chain`);
      }

      const [balanceWei, gasCostWei] = await Promise.all([
        this.getHospitalBalance(signerAddress),
        this.getGasCostWei()
      ]);

      if (balanceWei.lt(gasCostWei)) {
        const shortfall = gasCostWei.sub(balanceWei);
        throw new Error(`Insufficient on-chain balance. Need ${ethers.utils.formatEther(shortfall)} more POL`);
      }

      console.log('🔍 Preflight callStatic.addRecordWithSignature(...)');
      await this.contract.callStatic.addRecordWithSignature(
        recordData.recordId,
        recordData.patientName,
        recordData.diagnosis,
        recordData.recordDate,
        recordData.providerName,
        signerAddress,
        messageHash,
        signature
      );

      console.log('📤 Submitting transaction with relayer...');
      const tx = await this.contract.addRecordWithSignature(
        recordData.recordId,
        recordData.patientName,
        recordData.diagnosis,
        recordData.recordDate,
        recordData.providerName,
        signerAddress,
        messageHash,
        signature,
        {
          maxPriorityFeePerGas: ethers.utils.parseUnits('30', 'gwei'),
          maxFeePerGas: ethers.utils.parseUnits('60', 'gwei')
        }
      );

      const receipt = await tx.wait();

      return {
        txHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status
      };

    } catch (error) {
      console.error('❌ Error issuing record with MetaMask signature:', error.message);
      throw error;
    }
  }

  async addProvider(providerAddress) {
    const tx = await this.contract.addProvider(providerAddress, {
      gasLimit: 120000,
      maxPriorityFeePerGas: ethers.utils.parseUnits('30', 'gwei'),
      maxFeePerGas: ethers.utils.parseUnits('60', 'gwei')
    });
    const receipt = await tx.wait();
    return {
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      status: receipt.status
    };
  }

  async removeProvider(providerAddress) {
    const tx = await this.contract.removeProvider(providerAddress, {
      gasLimit: 120000,
      maxPriorityFeePerGas: ethers.utils.parseUnits('30', 'gwei'),
      maxFeePerGas: ethers.utils.parseUnits('60', 'gwei')
    });
    const receipt = await tx.wait();
    return {
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      status: receipt.status
    };
  }

  async isProvider(address) {
    return this.contract.authorizedProviders(address);
  }

  async checkBalance() {
    try {
      const balance = await this.provider.getBalance(this.wallet.address);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('Balance check error:', error.message);
      return null;
    }
  }

  async getNetworkInfo() {
    try {
      const network = await this.provider.getNetwork();
      const balance = await this.checkBalance();

      return {
        network: network.name,
        chainId: network.chainId,
        rpcUrl: process.env.RPC_URL,
        contractAddress: process.env.CONTRACT_ADDRESS,
        relayerAddress: this.wallet.address,
        relayerBalance: balance + ' ETH'
      };
    } catch (error) {
      return {
        error: error.message
      };
    }
  }
}

module.exports = new BlockchainService();
