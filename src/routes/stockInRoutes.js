const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  getStockIn,
  addStockIn,
  updateStockIn,
  deleteStockIn,
} = require('../controllers/stockInController');

router.use(requireAuth);
router.get('/stock-in', getStockIn);
router.post('/stock-in', addStockIn);
router.put('/stock-in/:id', updateStockIn);
router.post('/stock-in/delete/:id', deleteStockIn);

module.exports = router;
