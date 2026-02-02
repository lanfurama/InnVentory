const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  getTransfers,
  addTransfer,
  deleteTransfer,
} = require('../controllers/assetTransferController');

router.use(requireAuth);
router.get('/asset-transfers', getTransfers);
router.post('/asset-transfers', addTransfer);
router.post('/asset-transfers/delete/:id', requireRole('superadmin'), deleteTransfer);

module.exports = router;
