const { body, validationResult } = require('express-validator');
const assetTransferQuery = require('../queries/assetTransferQuery');
const assetQuery = require('../queries/assetQuery');
const departmentQuery = require('../queries/departmentQuery');

const getTransfers = async (req, res) => {
  const fromDeptId = req.query.from_dept_id ? parseInt(req.query.from_dept_id, 10) : null;
  const selectedAssetId = req.query.asset_id ? parseInt(req.query.asset_id, 10) : null;

  const [transfers, assets, departments] = await Promise.all([
    assetTransferQuery.getAll(),
    fromDeptId
      ? assetQuery.getByDepartmentId(fromDeptId)
      : assetQuery.getAll(),
    departmentQuery.getAll(),
  ]);

  res.render('assetTransfer', {
    title: req.t('assetTransfer.title'),
    transfers,
    assets,
    departments,
    selectedFromDeptId: fromDeptId || null,
    selectedAssetId: selectedAssetId || null,
  });
};

const addTransfer = [
  body('asset_id').trim().notEmpty().withMessage('assetTransfer.assetRequired'),
  body('to_dept_id').trim().notEmpty().withMessage('assetTransfer.toDeptRequired'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const fromDeptId = req.body.from_dept_id ? parseInt(req.body.from_dept_id, 10) : null;
      const [transfers, assets, departments] = await Promise.all([
        assetTransferQuery.getAll(),
        fromDeptId ? assetQuery.getByDepartmentId(fromDeptId) : assetQuery.getAll(),
        departmentQuery.getAll(),
      ]);
      return res.render('assetTransfer', {
        title: req.t('assetTransfer.title'),
        errors: errors.array().map((e) => ({ ...e, msg: req.t(e.msg) || e.msg })),
        transfers,
        assets,
        departments,
        selectedFromDeptId: fromDeptId || null,
        selectedAssetId: null,
      });
    }
    const asset = await assetQuery.getById(req.body.asset_id);
    await assetTransferQuery.add(
      req.body.asset_id,
      asset?.department_id || null,
      req.body.to_dept_id,
      req.body.reason,
      req.session.user?.email,
    );
    if (asset) {
      await assetQuery.update(req.body.asset_id, {
        assetCode: asset.asset_code,
        name: asset.name,
        serialNumber: asset.serial_number,
        categoryId: asset.category_id,
        purchasePrice: asset.purchase_price,
        acquisitionDate: asset.acquisition_date,
        departmentId: req.body.to_dept_id,
        custodian: asset.custodian,
        location: asset.location,
        warrantyExpiry: asset.warranty_expiry,
        status: asset.status,
        image: asset.image,
        notes: asset.notes,
      });
    }
    res.redirect('/asset-transfers');
  },
];

const deleteTransfer = async (req, res) => {
  await assetTransferQuery.remove(req.params.id);
  res.redirect('/asset-transfers');
};

module.exports = {
  getTransfers,
  addTransfer,
  deleteTransfer,
};
