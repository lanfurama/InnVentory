const { promisify } = require('util');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const moment = require('moment');
const QRCode = require('qrcode');
const multer = require('multer');
const path = require('path');

const XLSX = require('xlsx');
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
  const importSuccess = req.session.importSuccess || null;
  const importError = req.session.importError || null;
  if (req.session.importSuccess) delete req.session.importSuccess;
  if (req.session.importError) delete req.session.importError;
  res.render('asset', {
    title: req.t('asset.title'),
    assets,
    categories,
    departments,
    formData: {},
    totalAssets,
    inUseCount,
    underRepairCount,
    importSuccess,
    importError,
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

// Map Excel header (any language) to internal key
const HEADER_MAP = {
  'asset code': 'asset_code', 'asset_code': 'asset_code', 'mã tài sản': 'asset_code', 'code': 'asset_code',
  'name': 'name', 'tên': 'name', 'asset name': 'name',
  'serial number': 'serial_number', 'serial_number': 'serial_number', 'số sê-ri': 'serial_number',
  'category': 'category', 'category code': 'category', 'category_id': 'category', 'danh mục': 'category', 'mã danh mục': 'category',
  'purchase price': 'purchase_price', 'purchase_price': 'purchase_price', 'giá mua': 'purchase_price', 'price': 'purchase_price',
  'acquisition date': 'acquisition_date', 'acquisition_date': 'acquisition_date', 'ngày mua': 'acquisition_date', 'date': 'acquisition_date',
  'department': 'department', 'department code': 'department', 'department_id': 'department', 'phòng ban': 'department', 'mã phòng ban': 'department',
  'custodian': 'custodian', 'người phụ trách': 'custodian', 'assignee': 'custodian',
  'location': 'location', 'vị trí': 'location',
  'warranty expiry': 'warranty_expiry', 'warranty_expiry': 'warranty_expiry', 'hết bảo hành': 'warranty_expiry',
  'status': 'status', 'trạng thái': 'status',
  'notes': 'notes', 'ghi chú': 'notes', 'note': 'notes',
};

const normalizeRow = (row, headerMap) => {
  const out = {};
  Object.keys(row).forEach((key) => {
    const k = String(key).toLowerCase().trim();
    const field = headerMap[k] || HEADER_MAP[k];
    if (field && row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
      out[field] = row[key];
    }
  });
  return out;
};

const parseExcelFile = (buffer) => {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
  return rows;
};

// Multer memory storage for Excel (to use buffer)
const memoryStorage = multer.memoryStorage();
const uploadExcel = multer({ storage: memoryStorage, limits: { fileSize: 5 * 1024 * 1024 } });

const importAssetsWithMemory = [
  uploadExcel.single('excel'),
  async (req, res) => {
    if (!req.file) {
      req.session.importError = req.t('asset.importFileRequired');
      return res.redirect('/assets');
    }
    const [categories, departments] = await Promise.all([
      assetCategoryQuery.getAll(),
      departmentQuery.getAll(),
    ]);
    const categoryByCode = {};
    categories.forEach((c) => { categoryByCode[String(c.code).toLowerCase()] = c.id; });
    const departmentByCode = {};
    departments.forEach((d) => { departmentByCode[String(d.code).toLowerCase()] = d.id; });

    let rows;
    try {
      rows = parseExcelFile(req.file.buffer);
    } catch (err) {
      req.session.importError = req.t('asset.importInvalidFile');
      return res.redirect('/assets');
    }

    if (!rows.length) {
      req.session.importError = req.t('asset.importNoRows');
      return res.redirect('/assets');
    }

    const createdBy = req.session.user?.email || null;
    let imported = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i];
      const row = normalizeRow(raw, {});
      const assetCode = row.asset_code ? String(row.asset_code).trim() : null;
      const name = row.name ? String(row.name).trim() : null;

      if (!assetCode || !name) {
        errors.push(`Dòng ${i + 2}: Thiếu mã tài sản hoặc tên.`);
        continue;
      }

      const existing = await assetQuery.getByAssetCode(assetCode);
      if (existing) {
        errors.push(`Dòng ${i + 2}: Mã tài sản "${assetCode}" đã tồn tại.`);
        continue;
      }

      let categoryId = null;
      if (row.category) {
        const code = String(row.category).trim().toLowerCase();
        categoryId = categoryByCode[code] || null;
      }

      let departmentId = null;
      if (row.department) {
        const code = String(row.department).trim().toLowerCase();
        departmentId = departmentByCode[code] || null;
      }

      let acquisitionDate = row.acquisition_date || null;
      if (acquisitionDate && typeof acquisitionDate === 'string') {
        const d = new Date(acquisitionDate);
        acquisitionDate = Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
      } else if (acquisitionDate && acquisitionDate instanceof Date) {
        acquisitionDate = acquisitionDate.toISOString().slice(0, 10);
      }

      let warrantyExpiry = row.warranty_expiry || null;
      if (warrantyExpiry && typeof warrantyExpiry === 'string') {
        const d = new Date(warrantyExpiry);
        warrantyExpiry = Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
      } else if (warrantyExpiry && warrantyExpiry instanceof Date) {
        warrantyExpiry = warrantyExpiry.toISOString().slice(0, 10);
      }

      const status = (row.status && ['active', 'maintenance', 'disposed'].includes(String(row.status).toLowerCase()))
        ? String(row.status).toLowerCase() : 'active';

      const purchasePrice = row.purchase_price != null ? parseFloat(row.purchase_price) : 0;

      try {
        await assetQuery.add({
          assetCode,
          name,
          serialNumber: row.serial_number ? String(row.serial_number).trim() : null,
          categoryId,
          purchasePrice: Number.isNaN(purchasePrice) ? 0 : purchasePrice,
          acquisitionDate,
          departmentId,
          custodian: row.custodian ? String(row.custodian).trim() : null,
          location: row.location ? String(row.location).trim() : null,
          warrantyExpiry,
          status,
          image: null,
          notes: row.notes ? String(row.notes).trim() : null,
          createdBy,
        });
        const writeImgPath = path.join(uploadsDir, `${assetCode}.png`);
        QRCode.toFile(writeImgPath, assetCode, (err) => { if (err) console.error(err); });
        imported += 1;
      } catch (err) {
        errors.push(`Dòng ${i + 2}: ${err.message || 'Lỗi thêm tài sản.'}`);
      }
    }

    if (imported > 0) {
      req.session.importSuccess = req.t('asset.importSuccessCount', { count: imported });
    }
    if (errors.length > 0) {
      req.session.importError = (req.session.importError || '') + (req.session.importSuccess ? ' ' : '') + errors.slice(0, 10).join(' ');
      if (errors.length > 10) {
        req.session.importError += ` ... và ${errors.length - 10} lỗi khác.`;
      }
    }
    if (imported === 0 && errors.length === 0) {
      req.session.importError = req.t('asset.importNoRows');
    }
    res.redirect('/assets');
  },
];

const downloadImportTemplate = async (req, res) => {
  const wb = XLSX.utils.book_new();
  const headers = [
    'asset_code', 'name', 'serial_number', 'category', 'purchase_price', 'acquisition_date',
    'department', 'custodian', 'location', 'warranty_expiry', 'status', 'notes',
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers, ['VD001', 'Máy tính xách tay', 'SN123', 'IT', 15000000, '2024-01-15', 'PB01', 'Nguyễn Văn A', 'Tầng 2', '2027-01-15', 'active', 'Ghi chú mẫu']]);
  XLSX.utils.book_append_sheet(wb, ws, 'Assets');
  res.setHeader('Content-Disposition', 'attachment; filename=asset_import_template.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.end(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
};

module.exports = {
  getAssets,
  getAssetDetail,
  addAsset,
  updateAsset,
  disposeAsset,
  deleteAsset,
  importAssets: importAssetsWithMemory,
  downloadImportTemplate,
};
