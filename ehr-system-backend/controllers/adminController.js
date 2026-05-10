// Admin Controller - Login, approve/reject hospitals, view statistics
const Admin = require('../models/Admin');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const blockchain = require('../utils/blockchain');

// Admin login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Find admin
    const admin = await Admin.findByUsername(username);
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, admin.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        admin_id: admin.admin_id,
        username: admin.username,
        role: 'admin'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      admin: {
        admin_id: admin.admin_id,
        username: admin.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get admin profile
exports.getProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.admin_id);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    res.json({
      admin: {
        admin_id: admin.admin_id,
        username: admin.username,
        created_at: admin.created_at
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get dashboard data (statistics)
exports.getDashboard = async (req, res) => {
  try {
    const stats = await Admin.getStatistics();
    const pendingInstitutes = await Admin.getPendingInstitutes();

    res.json({
      statistics: stats,
      pendingInstitutes: pendingInstitutes,
      totalPending: pendingInstitutes.length
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all hospitals
exports.getAllInstitutes = async (req, res) => {
  try {
    const hospitals = await Admin.getAllInstitutes();
    res.json({
      total: hospitals.length,
      hospitals
    });
  } catch (error) {
    console.error('Get hospitals error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get pending hospitals
exports.getPendingInstitutes = async (req, res) => {
  try {
    const hospitals = await Admin.getPendingInstitutes();
    res.json({
      total: hospitals.length,
      hospitals
    });
  } catch (error) {
    console.error('Get pending error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Approve hospital
exports.approveInstitute = async (req, res) => {
  try {
    const { hospital_id } = req.params;

    if (!hospital_id) {
      return res.status(400).json({ error: 'Hospital ID required' });
    }

    // Fetch hospital info to get wallet address
    const hospital = await Admin.getInstituteById(hospital_id);
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    await Admin.approveInstitute(hospital_id);

    // Try to add issuer on-chain; if it fails, still keep DB approval but surface warning
    let onchain = { success: false, error: null };
    try {
      const isAlready = await blockchain.isProvider(hospital.wallet_address);
      if (!isAlready) {
        const tx = await blockchain.addProvider(hospital.wallet_address);
        onchain = { success: true, txHash: tx.txHash, blockNumber: tx.blockNumber };
      } else {
        onchain = { success: true, note: 'Already provider' };
      }
    } catch (err) {
      console.error('On-chain addIssuer failed:', err.message);
      onchain = { success: false, error: err.message };
    }

    res.json({
      message: 'Hospital approved successfully',
      hospital_id,
      wallet_address: hospital.wallet_address,
      onchain
    });
  } catch (error) {
    console.error('Approve error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Reject hospital
exports.rejectInstitute = async (req, res) => {
  try {
    const { hospital_id } = req.params;
    const { reason } = req.body;

    if (!hospital_id) {
      return res.status(400).json({ error: 'Hospital ID required' });
    }

    await Admin.rejectInstitute(hospital_id);

    res.json({
      message: 'Hospital rejected successfully',
      hospital_id,
      reason: reason || 'No reason provided'
    });
  } catch (error) {
    console.error('Reject error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Revoke an approved hospital and remove on-chain issuer
exports.revokeInstitute = async (req, res) => {
  try {
    const { hospital_id } = req.params;

    if (!hospital_id) {
      return res.status(400).json({ error: 'Hospital ID required' });
    }

    const hospital = await Admin.getInstituteById(hospital_id);
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    await Admin.rejectInstitute(hospital_id);

    let onchain = { success: false, error: null };
    try {
      if (hospital.wallet_address) {
        const tx = await blockchain.removeProvider(hospital.wallet_address);
        onchain = { success: true, txHash: tx.txHash, blockNumber: tx.blockNumber };
      } else {
        onchain = { success: false, error: 'No wallet on file' };
      }
    } catch (err) {
      console.error('On-chain removeIssuer failed:', err.message);
      onchain = { success: false, error: err.message };
    }

    res.json({
      message: 'Hospital revoked successfully',
      hospital_id,
      wallet_address: hospital.wallet_address,
      onchain
    });
  } catch (error) {
    console.error('Revoke error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get statistics
exports.getStatistics = async (req, res) => {
  try {
    const stats = await Admin.getStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get on-chain issuer status for an hospital
exports.getIssuerStatus = async (req, res) => {
  try {
    const { hospital_id } = req.params;
    if (!hospital_id) {
      return res.status(400).json({ error: 'Hospital ID required' });
    }

    const hospital = await Admin.getInstituteById(hospital_id);
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }
    if (!hospital.wallet_address) {
      return res.status(400).json({ error: 'Hospital has no wallet_address on file' });
    }

    const isIssuer = await blockchain.isProvider(hospital.wallet_address);
    res.json({
      hospital_id,
      wallet_address: hospital.wallet_address,
      isIssuer
    });
  } catch (error) {
    console.error('Issuer status error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get blockchain status
exports.getBlockchainStatus = async (req, res) => {
  try {
    const networkInfo = await blockchain.getNetworkInfo();
    res.json({
      status: 'connected',
      blockchain: networkInfo
    });
  } catch (error) {
    console.error('Blockchain status error:', error);
    res.status(500).json({ error: error.message });
  }
};
