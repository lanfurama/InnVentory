const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  getAccount, changeEmail, changePassword, changeRole,
} = require('../controllers/accountController');

router.use(requireAuth);
router.get('/account', getAccount);
router.put('/account/changeemail', changeEmail);
router.put('/account/changepassword', changePassword);
router.put('/account/changerole', changeRole);

module.exports = router;
