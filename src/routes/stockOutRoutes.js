const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  getStockOut,
  addStockOut,
  updateStockOut,
  deleteStockOut,
} = require('../controllers/stockOutController');

router.use(requireAuth);
router.get('/stock-out', getStockOut);
router.post('/stock-out', addStockOut);
router.put('/stock-out/:id', updateStockOut);
router.post('/stock-out/delete/:id', deleteStockOut);

module.exports = router;
