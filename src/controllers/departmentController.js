const { body, validationResult } = require('express-validator');
const departmentQuery = require('../queries/departmentQuery');

const getDepartments = async (req, res) => {
  const departments = await departmentQuery.getAll();
  res.render('departments', { title: req.t('departments.title'), departments });
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
      const departments = await departmentQuery.getAll();
      return res.render('departments', {
        title: req.t('departments.title'),
        errors: errors.array().map((e) => ({ ...e, msg: req.t(e.msg) || e.msg })),
        departments,
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
      const departments = await departmentQuery.getAll();
      return res.render('departments', {
        title: req.t('departments.title'),
        errors: errors.array().map((e) => ({ ...e, msg: req.t(e.msg) || e.msg })),
        departments,
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

module.exports = {
  getDepartments,
  addDepartment,
  updateDepartment,
  deleteDepartment,
};
