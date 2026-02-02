const { body, validationResult } = require('express-validator');
const assetCategoryQuery = require('../queries/assetCategoryQuery');

const getCategories = async (req, res) => {
  const categories = await assetCategoryQuery.getAll();
  res.render('assetCategory', { title: req.t('assetCategory.title'), categories });
};

const addCategory = [
  body('name').trim().notEmpty().withMessage('assetCategory.nameRequired'),
  body('code').trim().notEmpty().withMessage('assetCategory.codeRequired'),
  body('code').custom(async (value) => {
    const dup = await assetCategoryQuery.checkCodeExists(value);
    if (dup) throw new Error('assetCategory.addFailCodeExists');
    return true;
  }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const categories = await assetCategoryQuery.getAll();
      return res.render('assetCategory', {
        title: req.t('assetCategory.title'),
        errors: errors.array().map((e) => ({ ...e, msg: req.t(e.msg) || e.msg })),
        categories,
      });
    }
    const { name, code, useful_life_years, depreciation_method, residual_value } = req.body;
    await assetCategoryQuery.add(name, code, parseInt(useful_life_years, 10) || 5, depreciation_method || 'straight_line', parseFloat(residual_value) || 0);
    res.redirect('/asset-categories');
  },
];

const updateCategory = [
  body('name').trim().notEmpty().withMessage('assetCategory.nameRequired'),
  body('code').trim().notEmpty().withMessage('assetCategory.codeRequired'),
  body('code').custom(async (value, { req }) => {
    const dup = await assetCategoryQuery.checkCodeExists(value, parseInt(req.body.id, 10));
    if (dup) throw new Error('assetCategory.editFailCodeExists');
    return true;
  }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const categories = await assetCategoryQuery.getAll();
      return res.render('assetCategory', {
        title: req.t('assetCategory.title'),
        errors: errors.array().map((e) => ({ ...e, msg: req.t(e.msg) || e.msg })),
        categories,
      });
    }
    const { id, name, code, useful_life_years, depreciation_method, residual_value } = req.body;
    await assetCategoryQuery.update(id, name, code, parseInt(useful_life_years, 10) || 5, depreciation_method || 'straight_line', parseFloat(residual_value) || 0);
    res.redirect('/asset-categories');
  },
];

const deleteCategory = async (req, res) => {
  await assetCategoryQuery.remove(req.params.id);
  res.redirect('/asset-categories');
};

module.exports = {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
};
