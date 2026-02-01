const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const getLog = require('../controllers/logController');

router.get('/log', requireAuth, requireRole('superadmin'), getLog);

module.exports = router;
