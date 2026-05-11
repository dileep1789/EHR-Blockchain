/**
 * MetaMask Integration for EHRChain
 * Handles: Connection, Signing, Deposits, On-Chain Payments
 * Uses Ethers v6 Syntax
 */
class MetaMask {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.userAddress = null;
    this.chainId = null;
    // MATCH THIS TO YOUR BACKEND .ENV
    this.CONTRACT_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
    this.CHAIN_ID = 31337;
    this.RPC_URL = 'http://127.0.0.1:8545';
    this.BLOCK_EXPLORER = '';

    this.CONTRACT_ABI = [
      { inputs: [], name: 'depositGasFund', outputs: [], stateMutability: 'payable', type: 'function' },
      { inputs: [{ internalType: 'address', name: '', type: 'address' }], name: 'hospitalBalance', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
      { inputs: [], name: 'gasLimitPerRecord', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
      { inputs: [], name: 'gasPriceForRecord', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
      { inputs: [{ internalType: 'string', name: 'recordId', type: 'string' }], name: 'getRecord', outputs: [{ components: [{ internalType: 'string', name: 'patientName', type: 'string' }, { internalType: 'string', name: 'diagnosis', type: 'string' }, { internalType: 'string', name: 'recordDate', type: 'string' }, { internalType: 'string', name: 'providerName', type: 'string' }, { internalType: 'address', name: 'provider', type: 'address' }, { internalType: 'bool', name: 'exists', type: 'bool' }], internalType: 'struct EHRRegistry.HealthRecord', name: '', type: 'tuple' }], stateMutability: 'view', type: 'function' },
      { inputs: [{ internalType: 'string', name: 'recordId', type: 'string' }], name: 'verifyRecord', outputs: [{ internalType: 'bool', name: 'exists', type: 'bool' }, { internalType: 'string', name: 'patientName', type: 'string' }, { internalType: 'string', name: 'diagnosis', type: 'string' }, { internalType: 'string', name: 'recordDate', type: 'string' }, { internalType: 'string', name: 'providerName', type: 'string' }, { internalType: 'address', name: 'provider', type: 'address' }], stateMutability: 'view', type: 'function' },
    ];
  }

  static isInstalled() {
    return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
  }

  async connect() {
    if (!MetaMask.isInstalled()) {
      throw new Error('MetaMask is not installed.');
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from MetaMask');
      }

      this.userAddress = accounts[0];
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();

      await this.switchToLocalNetwork();
      this.setupEventListeners();

      return this.userAddress;
    } catch (error) {
      console.error('MetaMask connection failed:', error.message);
      throw error;
    }
  }

  async switchToLocalNetwork() {
    const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
    const localChainId = '0x' + this.CHAIN_ID.toString(16);

    if (currentChainId !== localChainId) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: localChainId }]
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await this.addLocalNetwork();
        } else {
          throw switchError;
        }
      }
    }

    this.chainId = this.CHAIN_ID;
  }

  async addLocalNetwork() {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: '0x' + this.CHAIN_ID.toString(16),
          chainName: 'Local Hardhat Network',
          rpcUrls: [this.RPC_URL],
          nativeCurrency: {
            name: 'Hardhat ETH',
            symbol: 'ETH',
            decimals: 18
          },
          blockExplorerUrls: []
        }
      ]
    });
  }

  setupEventListeners() {
    if (!window.ethereum) return;
    
    window.ethereum.on('accountsChanged', (accounts) => {
      this.userAddress = accounts[0] || null;
      if (this.userAddress && this.provider) {
        this.provider.getSigner().then(s => this.signer = s);
      }
      window.dispatchEvent(
        new CustomEvent('metamask:accountChanged', { detail: accounts[0] })
      );
    });

    window.ethereum.on('chainChanged', () => {
      window.location.reload();
    });

    window.ethereum.on('disconnect', () => {
      this.disconnect();
      window.dispatchEvent(new CustomEvent('metamask:disconnected'));
    });
  }

  createMessageHash(recordId, patientName, diagnosis, recordDate, providerName, signerAddress) {
    return ethers.solidityPackedKeccak256(
      ['string', 'string', 'string', 'string', 'string', 'address'],
      [recordId, patientName, diagnosis, recordDate, providerName, signerAddress]
    );
  }

  async signMessageHash(messageHash) {
    if (!messageHash || !messageHash.startsWith('0x')) {
      throw new Error('Invalid messageHash format');
    }

    if (!this.userAddress) {
      throw new Error('Wallet not connected');
    }

    try {
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [messageHash, this.userAddress]
      });
      return signature;
    } catch (error) {
      console.error('Signing failed:', error.message);
      throw error;
    }
  }

  async signAndAddRecord(recordData) {
    if (!this.userAddress) {
      throw new Error('Wallet not connected');
    }

    const messageHash = this.createMessageHash(
      recordData.recordId,
      recordData.patientName,
      recordData.diagnosis,
      recordData.recordDate,
      recordData.providerName,
      this.userAddress
    );

    const signature = await this.signMessageHash(messageHash);

    return {
      messageHash,
      signature,
      signerAddress: this.userAddress,
      recordData
    };
  }

  getContractWithSigner() {
    if (!this.signer) {
      throw new Error('Signer not ready');
    }
    return new ethers.Contract(
      this.CONTRACT_ADDRESS,
      this.CONTRACT_ABI,
      this.signer
    );
  }

  async depositGasFunds(amountPol) {
    if (!amountPol || Number(amountPol) <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    try {
      const contract = this.getContractWithSigner();
      const amountWei = ethers.parseEther(String(amountPol));

      const tx = await contract.depositGasFund({
        value: amountWei,
        gasLimit: 200000n
      });

      const receipt = await tx.wait();

      return {
        hash: tx.hash,
        receipt: receipt
      };
    } catch (error) {
      console.error('Deposit failed:', error.message);
      throw error;
    }
  }

  async getContractBalance(address = null) {
    try {
      const contract = this.getContractWithSigner();
      const targetAddress = address || this.userAddress;

      const bal = await contract.hospitalBalance(targetAddress);
      const balPol = Number(ethers.formatEther(bal));

      return {
        wei: bal.toString(),
        pol: balPol
      };
    } catch (error) {
      console.error('Balance fetch failed:', error.message);
      // Return 0 instead of crashing
      return { wei: '0', pol: 0 };
    }
  }

  async getGasCost() {
    try {
      const contract = this.getContractWithSigner();

      const [limit, price] = await Promise.all([
        contract.gasLimitPerRecord(),
        contract.gasPriceForRecord()
      ]);

      const cost = BigInt(limit.toString()) * BigInt(price.toString());
      const costPol = Number(ethers.formatEther(cost));

      return {
        wei: cost.toString(),
        pol: costPol,
        limit: limit.toString(),
        price: price.toString()
      };
    } catch (error) {
      console.error('Gas cost fetch failed:', error.message);
      throw error;
    }
  }

  async sendIssuanceTransaction(signedData) {
    if (!this.userAddress) {
      throw new Error('Wallet not connected');
    }

    try {
      const response = await fetch('/api/payment/issue-with-metamask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('hospitalToken')}`
        },
        body: JSON.stringify({
          ...signedData.recordData,
          messageHash: signedData.messageHash,
          signature: signedData.signature,
          signerAddress: signedData.signerAddress
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Issuance transaction failed:', error.message);
      throw error;
    }
  }

  async getNativeBalance() {
    if (!this.provider || !this.userAddress) {
      throw new Error('Wallet not connected');
    }

    try {
      const balWei = await this.provider.getBalance(this.userAddress);
      return Number(ethers.formatEther(balWei));
    } catch (error) {
      console.error('Balance fetch failed:', error.message);
      return 0;
    }
  }

  async verifyRecord(recordId) {
    try {
      const contract = this.getContractWithSigner();
      const rec = await contract.verifyRecord(recordId);

      return {
        exists: rec.exists,
        patientName: rec.patientName,
        diagnosis: rec.diagnosis,
        recordDate: rec.recordDate,
        providerName: rec.providerName,
        provider: rec.provider
      };
    } catch (error) {
      console.error('Verification failed:', error.message);
      throw error;
    }
  }

  getAddress() {
    return this.userAddress;
  }

  getNetworkInfo() {
    return {
      networkName: 'Local Hardhat',
      chainId: this.CHAIN_ID,
      rpcUrl: this.RPC_URL,
      blockExplorer: this.BLOCK_EXPLORER,
      contractAddress: this.CONTRACT_ADDRESS
    };
  }

  getExplorerUrl(hash, type = 'tx') {
    // type can be 'tx' (transaction) or 'address'
    if (this.chainId === 31337) {
      // Local Hardhat network - no public explorer
      return null;
    } else if (this.chainId === 80002) {
      // Polygon Amoy Testnet
      return `https://amoy.polygonscan.com/${type}/${hash}`;
    } else if (this.chainId === 137) {
      // Polygon Mainnet
      return `https://polygonscan.com/${type}/${hash}`;
    }
    return null;
  }

  getNetworkName() {
    if (this.chainId === 31337) {
      return 'Local Hardhat Network';
    } else if (this.chainId === 80002) {
      return 'Polygon Amoy Testnet';
    } else if (this.chainId === 137) {
      return 'Polygon Mainnet';
    }
    return 'Unknown Network';
  }

  disconnect() {
    this.userAddress = null;
    this.provider = null;
    this.signer = null;
    this.chainId = null;
  }
}

if (typeof window !== 'undefined') {
  window.MetaMask = MetaMask;
  window.MetaMaskIntegration = MetaMask;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MetaMask;
}
