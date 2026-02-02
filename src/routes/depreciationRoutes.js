const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  getDepreciationPage,
  calculateDepreciation,
  showCalculationRun,
  removeCalculationRun,
} = require('../controllers/depreciationController');

router.use(requireAuth);
router.get('/depreciation', getDepreciationPage);
router.post('/depreciation/calculate', requireRole('superadmin'), calculateDepreciation);
router.get('/depreciation/show/:id', showCalculationRun);
router.post('/depreciation/remove/:id', requireRole('superadmin'), removeCalculationRun);

module.exports = router;
