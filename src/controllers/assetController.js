const { promisify } = require('util');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const moment = require('moment');
const QRCode = require('qrcode');
const multer = require('multer');
const path = require('path');

const assetQuery = require('../queries/assetQuery');
const assetCategoryQuery = require('../queries/assetCategoryQuery');
const departmentQuery = require('../queries/departmentQuery');
const assetTransferQuery = require('../queries/assetTransferQuery');
const assetMaintenanceQuery = require('../queries/assetMaintenanceQuery');
const depreciationQuery = require('../queries/depreciationQuery');

const uploadsDir = path.join(__dirname, '../../public/uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, uploadsDir); },
  filename: (req, file, cb) => { cb(null, Date.now() + path.extname(file.originalname)); },
});
const upload = multer({ storage });
const unlinkAsync = promisify(fs.unlink);

const getAssets = async (req, res) => {
  const [assets, categories, departments] = await Promise.all([
    assetQuery.getAll(),
    assetCategoryQuery.getAll(),
    departmentQuery.getAll(),
  ]);
  const totalAssets = assets.length;
  const inUseCount = assets.filter((a) => a.status === 'active').length;
  const underRepairCount = assets.filter((a) => a.status === 'maintenance').length;
  res.render('asset', {
    title: req.t('asset.title'),
    assets,
    categories,
    departments,
    formData: {},
    totalAssets,
    inUseCount,
    underRepairCount,
  });
};

const getAssetDetail = async (req, res) => {
  const asset = await assetQuery.getById(req.params.id);
  if (!asset) return res.redirect('/assets');
  const transfers = await assetTransferQuery.getByAssetId(req.params.id);
  const maintenanceList = await assetMaintenanceQuery.getByAssetId(req.params.id);
  const depreciationList = await depreciationQuery.getByAssetId(req.params.id);

  const events = [];
  (transfers || []).forEach((t) => {
    events.push({
      type: 'transfer',
      date: t.transferred_at,
      title: 'Location Transfer',
      description: `Asset moved from ${t.from_dept_name || 'N/A'} to ${t.to_dept_name || 'N/A'}.`,
      details: [
        { label: 'From → To', value: `${t.from_dept_name || '-'} → ${t.to_dept_name || '-'}` },
        { label: 'Approved by', value: t.transferred_by || '-' },
      ],
      reason: t.reason,
    });
  });
  (maintenanceList || []).forEach((m) => {
    events.push({
      type: 'maintenance',
      date: m.maintenance_date,
      title: 'Maintenance',
      description: m.description || 'Maintenance record',
      details: [
        { label: 'Cost', value: m.cost ? `$${Number(m.cost).toLocaleString()}` : '-' },
        { label: 'Performed by', value: m.performed_by || '-' },
      ],
      cost: m.cost,
    });
  });
  (depreciationList || []).forEach((d) => {
    events.push({
      type: 'depreciation',
      date: d.period_end || d.period_start,
      title: 'Scheduled Depreciation',
      description: 'Quarterly depreciation run (Straight Line Method).',
      details: [
        { label: 'Amount', value: d.amount ? `$${Number(d.amount).toLocaleString()}` : '-' },
      ],
      amount: d.amount,
    });
  });
  if (asset.acquisition_date) {
    events.push({
      type: 'acquisition',
      date: asset.acquisition_date,
      title: 'Asset Acquisition',
      description: 'Asset acquired and added to inventory.',
      details: [
        { label: 'Cost', value: asset.purchase_price ? `$${Number(asset.purchase_price).toLocaleString()}` : '-' },
      ],
    });
  }
  events.sort((a, b) => new Date(b.date) - new Date(a.date));

  res.render('assetDetail', {
    asset,
    title: req.t('assetDetail.title'),
    transfers,
    maintenanceList,
    depreciationList,
    assetHistoryEvents: events,
    moment,
  });
};

const addAsset = [
  upload.single('image'),
  body('asset_code').trim().notEmpty().withMessage('asset.assetCodeRequired'),
  body('asset_code').custom(async (value) => {
    const dup = await assetQuery.getByAssetCode(value);
    if (dup) throw new Error('asset.addFailCodeExists');
    return true;
  }),
  body('name').trim().notEmpty().withMessage('asset.nameRequired'),
  body('image').custom((value, { req }) => {
    if (req.file && req.file.size > 1048576) throw new Error('asset.imageTooBig');
    return true;
  }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file?.filename) {
        const imgPath = path.join(uploadsDir, req.file.filename);
        if (fs.existsSync(imgPath)) await unlinkAsync(imgPath);
      }
      const assets = await assetQuery.getAll();
      const categories = await assetCategoryQuery.getAll();
      const departments = await departmentQuery.getAll();
      const totalAssets = assets.length;
      const inUseCount = assets.filter((a) => a.status === 'active').length;
      const underRepairCount = assets.filter((a) => a.status === 'maintenance').length;
      return res.render('asset', {
        title: req.t('asset.title'),
        errors: errors.array().map((e) => ({ ...e, msg: req.t(e.msg) || e.msg })),
        assets,
        categories,
        departments,
        formData: req.body,
        totalAssets,
        inUseCount,
        underRepairCount,
      });
    }
    const {
      asset_code, name, serial_number, category_id, purchase_price, acquisition_date,
      department_id, custodian, location, warranty_expiry, status,
    } = req.body;
    const image = req.file?.filename || null;
    await assetQuery.add({
      assetCode: asset_code,
      name,
      serialNumber: serial_number,
      categoryId: category_id || null,
      purchasePrice: purchase_price || 0,
      acquisitionDate: acquisition_date || null,
      departmentId: department_id || null,
      custodian: custodian || null,
      location: location || null,
      warrantyExpiry: warranty_expiry || null,
      status: status || 'active',
      image,
      notes: req.body.notes || null,
      createdBy: req.session.user?.email,
    });
    const writeImgPath = path.join(uploadsDir, `${asset_code}.png`);
    QRCode.toFile(writeImgPath, asset_code, (err) => { if (err) console.error(err); });
    res.redirect('/assets');
  },
];

const updateAsset = [
  upload.single('image'),
  body('asset_code').trim().notEmpty().withMessage('asset.assetCodeRequired'),
  body('asset_code').custom(async (value, { req }) => {
    const dup = await assetQuery.getByAssetCode(value);
    if (dup && dup.id !== parseInt(req.params.id, 10)) throw new Error('asset.editFailCodeExists');
    return true;
  }),
  body('name').trim().notEmpty().withMessage('asset.nameRequired'),
  body('image').custom((value, { req }) => {
    if (req.file && req.file.size > 1048576) throw new Error('asset.imageTooBig');
    return true;
  }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file?.filename) {
        const imgPath = path.join(uploadsDir, req.file.filename);
        if (fs.existsSync(imgPath)) await unlinkAsync(imgPath);
      }
      const assets = await assetQuery.getAll();
      const categories = await assetCategoryQuery.getAll();
      const departments = await departmentQuery.getAll();
      const totalAssets = assets.length;
      const inUseCount = assets.filter((a) => a.status === 'active').length;
      const underRepairCount = assets.filter((a) => a.status === 'maintenance').length;
      return res.render('asset', {
        title: req.t('asset.title'),
        errors: errors.array().map((e) => ({ ...e, msg: req.t(e.msg) || e.msg })),
        assets,
        categories,
        departments,
        formData: req.body,
        totalAssets,
        inUseCount,
        underRepairCount,
      });
    }
    const {
      asset_code, name, serial_number, category_id, purchase_price, acquisition_date,
      department_id, custodian, location, warranty_expiry, status,
    } = req.body;
    const image = req.file?.filename || req.body.existing_image || null;
    await assetQuery.update(req.params.id, {
      assetCode: asset_code,
      name,
      serialNumber: serial_number,
      categoryId: category_id || null,
      purchasePrice: purchase_price || 0,
      acquisitionDate: acquisition_date || null,
      departmentId: department_id || null,
      custodian: custodian || null,
      location: location || null,
      warrantyExpiry: warranty_expiry || null,
      status: status || 'active',
      image,
      notes: req.body.notes || null,
    });
    if (asset_code !== req.body.old_asset_code) {
      const oldPath = path.join(uploadsDir, `${req.body.old_asset_code}.png`);
      if (fs.existsSync(oldPath)) await unlinkAsync(oldPath);
      const writeImgPath = path.join(uploadsDir, `${asset_code}.png`);
      QRCode.toFile(writeImgPath, asset_code, (err) => { if (err) console.error(err); });
    }
    res.redirect('/assets');
  },
];

const disposeAsset = async (req, res) => {
  const { disposal_date, disposal_reason, disposal_value } = req.body;
  await assetQuery.dispose(req.params.id, disposal_date || null, disposal_reason || null, disposal_value || null);
  res.redirect('/assets');
};

const deleteAsset = async (req, res) => {
  const asset = await assetQuery.getById(req.params.id);
  if (asset) {
    if (asset.image) {
      const imgPath = path.join(uploadsDir, asset.image);
      if (fs.existsSync(imgPath)) await unlinkAsync(imgPath);
    }
    const qrPath = path.join(uploadsDir, `${asset.asset_code}.png`);
    if (fs.existsSync(qrPath)) await unlinkAsync(qrPath);
  }
  await assetQuery.remove(req.params.id);
  res.redirect('/assets');
};

module.exports = {
  getAssets,
  getAssetDetail,
  addAsset,
  updateAsset,
  disposeAsset,
  deleteAsset,
};
