const { body, validationResult } = require('express-validator');
const assetMaintenanceQuery = require('../queries/assetMaintenanceQuery');
const assetQuery = require('../queries/assetQuery');

const getMaintenance = async (req, res) => {
  const [maintenanceList, assets] = await Promise.all([
    assetMaintenanceQuery.getAll(),
    assetQuery.getAll(),
  ]);
  res.render('assetMaintenance', { title: req.t('assetMaintenance.title'), maintenanceList, assets });
};

const addMaintenance = [
  body('asset_id').trim().notEmpty().withMessage('assetMaintenance.assetRequired'),
  body('maintenance_date').trim().notEmpty().withMessage('assetMaintenance.dateRequired'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const maintenanceList = await assetMaintenanceQuery.getAll();
      const assets = await assetQuery.getAll();
      return res.render('assetMaintenance', {
        title: req.t('assetMaintenance.title'),
        errors: errors.array().map((e) => ({ ...e, msg: req.t(e.msg) || e.msg })),
        maintenanceList,
        assets,
      });
    }
    await assetMaintenanceQuery.add(
      req.body.asset_id,
      req.body.maintenance_date,
      req.body.description,
      req.body.cost || 0,
      req.session.user?.email,
    );
    res.redirect('/asset-maintenance');
  },
];

const updateMaintenance = [
  body('maintenance_date').trim().notEmpty().withMessage('assetMaintenance.dateRequired'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const maintenanceList = await assetMaintenanceQuery.getAll();
      const assets = await assetQuery.getAll();
      return res.render('assetMaintenance', {
        title: req.t('assetMaintenance.title'),
        errors: errors.array().map((e) => ({ ...e, msg: req.t(e.msg) || e.msg })),
        maintenanceList,
        assets,
      });
    }
    await assetMaintenanceQuery.update(
      req.params.id,
      req.body.maintenance_date,
      req.body.description,
      req.body.cost || 0,
      req.session.user?.email,
    );
    res.redirect('/asset-maintenance');
  },
];

const deleteMaintenance = async (req, res) => {
  await assetMaintenanceQuery.remove(req.params.id);
  res.redirect('/asset-maintenance');
};

module.exports = {
  getMaintenance,
  addMaintenance,
  updateMaintenance,
  deleteMaintenance,
};
