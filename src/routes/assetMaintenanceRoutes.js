const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  getMaintenance,
  addMaintenance,
  updateMaintenance,
  deleteMaintenance,
} = require('../controllers/assetMaintenanceController');

router.use(requireAuth);
router.get('/asset-maintenance', getMaintenance);
router.post('/asset-maintenance', addMaintenance);
router.put('/asset-maintenance/:id', requireRole('superadmin'), updateMaintenance);
router.post('/asset-maintenance/delete/:id', requireRole('superadmin'), deleteMaintenance);

module.exports = router;
