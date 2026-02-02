const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  getReportsOverview,
  getAssetsListing,
  getTransactionListing,
  getDepreciationStatement,
  getAssetsLedger,
} = require('../controllers/reportController');

router.use(requireAuth);
router.get('/reports', getReportsOverview);
router.get('/reports/assets-listing', getAssetsListing);
router.get('/reports/transaction-listing', getTransactionListing);
router.get('/reports/depreciation-statement', getDepreciationStatement);
router.get('/reports/assets-ledger', getAssetsLedger);

module.exports = router;
