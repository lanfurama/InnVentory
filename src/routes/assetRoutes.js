const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  getAssets,
  getAssetDetail,
  addAsset,
  updateAsset,
  disposeAsset,
  deleteAsset,
} = require('../controllers/assetController');

router.use(requireAuth);
router.get('/assets', getAssets);
router.get('/assets/:id', getAssetDetail);
router.post('/assets', addAsset);
router.put('/assets/:id', updateAsset);
router.post('/assets/dispose/:id', requireRole('superadmin'), disposeAsset);
router.post('/assets/delete/:id', requireRole('superadmin'), deleteAsset);

module.exports = router;
