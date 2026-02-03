const { body, validationResult } = require('express-validator');
const departmentQuery = require('../queries/departmentQuery');
const assetQuery = require('../queries/assetQuery');

const getDepartments = async (req, res) => {
  const [departments, countByDepartment] = await Promise.all([
    departmentQuery.getAll(),
    assetQuery.getCountByDepartment(),
  ]);
  const countByDeptMap = {};
  (countByDepartment || []).forEach((row) => { countByDeptMap[row.id] = parseInt(row.count, 10) || 0; });
  res.render('departments', {
    title: req.t('departments.title'),
    departments,
    countByDeptMap,
  });
};

const addDepartment = [
  body('name').trim().notEmpty().withMessage('departments.nameRequired'),
  body('code').trim().notEmpty().withMessage('departments.codeRequired'),
  body('code').custom(async (value) => {
    const dup = await departmentQuery.checkCodeExists(value);
    if (dup) throw new Error('departments.addFailCodeExists');
    return true;
  }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const [departments, countByDepartment] = await Promise.all([
        departmentQuery.getAll(),
        assetQuery.getCountByDepartment(),
      ]);
      const countByDeptMap = {};
      (countByDepartment || []).forEach((row) => { countByDeptMap[row.id] = parseInt(row.count, 10) || 0; });
      return res.render('departments', {
        title: req.t('departments.title'),
        errors: errors.array().map((e) => ({ ...e, msg: req.t(e.msg) || e.msg })),
        departments,
        countByDeptMap,
      });
    }
    await departmentQuery.add(req.body.name, req.body.code);
    res.redirect('/departments');
  },
];

const updateDepartment = [
  body('name').trim().notEmpty().withMessage('departments.nameRequired'),
  body('code').trim().notEmpty().withMessage('departments.codeRequired'),
  body('code').custom(async (value, { req }) => {
    const dup = await departmentQuery.checkCodeExists(value, parseInt(req.body.id, 10));
    if (dup) throw new Error('departments.editFailCodeExists');
    return true;
  }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const [departments, countByDepartment] = await Promise.all([
        departmentQuery.getAll(),
        assetQuery.getCountByDepartment(),
      ]);
      const countByDeptMap = {};
      (countByDepartment || []).forEach((row) => { countByDeptMap[row.id] = parseInt(row.count, 10) || 0; });
      return res.render('departments', {
        title: req.t('departments.title'),
        errors: errors.array().map((e) => ({ ...e, msg: req.t(e.msg) || e.msg })),
        departments,
        countByDeptMap,
      });
    }
    await departmentQuery.update(req.body.id, req.body.name, req.body.code);
    res.redirect('/departments');
  },
];

const deleteDepartment = async (req, res) => {
  await departmentQuery.remove(req.params.id);
  res.redirect('/departments');
};

const getDepartmentAssets = async (req, res) => {
  const department = await departmentQuery.getById(req.params.id);
  if (!department) return res.redirect('/departments');
  const assets = await assetQuery.getByDepartmentId(req.params.id);
  res.render('departmentAssets', {
    title: req.t('departments.assetsOf') ? req.t('departments.assetsOf', { name: department.name }) : `Assets of ${department.name}`,
    department,
    assets,
  });
};

module.exports = {
  getDepartments,
  getDepartmentAssets,
  addDepartment,
  updateDepartment,
  deleteDepartment,
};
