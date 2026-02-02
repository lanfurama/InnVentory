const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/assetCategoryController');

router.use(requireAuth);
router.get('/asset-categories', getCategories);
router.post('/asset-categories', requireRole('superadmin'), addCategory);
router.put('/asset-categories', requireRole('superadmin'), updateCategory);
router.post('/asset-categories/delete/:id', requireRole('superadmin'), deleteCategory);

module.exports = router;
