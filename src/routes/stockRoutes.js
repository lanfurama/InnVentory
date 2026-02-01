const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  getStock,
  getItemDetail,
  addItem,
  updateItem,
  deleteItem,
} = require('../controllers/stockController');

router.use(requireAuth);
router.get('/stock', getStock);
router.get('/stock/:id', getItemDetail);
router.post('/stock', addItem);
router.put('/stock/:id', updateItem);
router.post('/stock/delete/:id', requireRole('superadmin'), deleteItem);

module.exports = router;
