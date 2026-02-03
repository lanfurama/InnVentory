const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  getDepartments,
  getDepartmentAssets,
  addDepartment,
  updateDepartment,
  deleteDepartment,
} = require('../controllers/departmentController');

router.use(requireAuth);
router.get('/departments', getDepartments);
router.get('/departments/:id/assets', getDepartmentAssets);
router.post('/departments', requireRole('superadmin'), addDepartment);
router.put('/departments', requireRole('superadmin'), updateDepartment);
router.post('/departments/delete/:id', requireRole('superadmin'), deleteDepartment);

module.exports = router;
