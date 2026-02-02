const pool = require('../config/database');

const getAssetsListing = async (filters = {}) => {
  const { department_id, category_id, status } = filters;
  let query = `
    SELECT a.*, c.name as category_name, c.code as category_code,
           d.name as department_name, d.code as department_code
    FROM public.assets a
    LEFT JOIN public.asset_categories c ON a.category_id = c.id
    LEFT JOIN public.departments d ON a.department_id = d.id
    WHERE 1=1
  `;
  const values = [];
  let i = 1;
  if (department_id) {
    query += ` AND a.department_id = $${i}`;
    values.push(department_id);
    i++;
  }
  if (category_id) {
    query += ` AND a.category_id = $${i}`;
    values.push(category_id);
    i++;
  }
  if (status) {
    query += ` AND a.status = $${i}`;
    values.push(status);
  }
  query += ' ORDER BY a.asset_code';
  const result = await pool.query(query, values);
  return result.rows;
};

// Unified asset transactions: acquisition, transfer, maintenance, disposal
const getAssetTransactionListing = async (filters = {}) => {
  const { date_from, date_to } = filters;
  const transactions = [];

  // Acquisitions (asset creation)
  let acqQuery = `
    SELECT a.id as asset_id, a.asset_code, a.name as asset_name,
           a.created_at as trans_date, a.purchase_price as amount,
           'acquisition' as trans_type, 'Asset acquired' as description
    FROM public.assets a
    WHERE a.created_at IS NOT NULL
  `;
  const acqValues = [];
  let idx = 1;
  if (date_from) {
    acqQuery += ` AND a.created_at::date >= $${idx}`;
    acqValues.push(date_from);
    idx++;
  }
  if (date_to) {
    acqQuery += ` AND a.created_at::date <= $${idx}`;
    acqValues.push(date_to);
  }
  acqQuery += ' ORDER BY a.created_at DESC';
  const acq = await pool.query(acqQuery, acqValues);
  acq.rows.forEach((r) => {
    transactions.push({
      trans_date: r.trans_date,
      asset_code: r.asset_code,
      asset_name: r.asset_name,
      trans_type: r.trans_type,
      description: r.description,
      amount: r.amount,
    });
  });

  // Transfers
  let trQuery = `
    SELECT t.transferred_at as trans_date, a.asset_code, a.name as asset_name,
           'transfer' as trans_type,
           'Transfer: ' || COALESCE(fd.name, '-') || ' to ' || COALESCE(td.name, '-') as description,
           NULL as amount
    FROM public.asset_transfers t
    JOIN public.assets a ON t.asset_id = a.id
    LEFT JOIN public.departments fd ON t.from_dept_id = fd.id
    LEFT JOIN public.departments td ON t.to_dept_id = td.id
    WHERE 1=1
  `;
  const trValues = [];
  idx = 1;
  if (date_from) {
    trQuery += ` AND t.transferred_at::date >= $${idx}`;
    trValues.push(date_from);
    idx++;
  }
  if (date_to) {
    trQuery += ` AND t.transferred_at::date <= $${idx}`;
    trValues.push(date_to);
  }
  const tr = await pool.query(trQuery, trValues);
  tr.rows.forEach((r) => transactions.push(r));

  // Maintenance
  let maintQuery = `
    SELECT m.maintenance_date::timestamp as trans_date, a.asset_code, a.name as asset_name,
           'maintenance' as trans_type, COALESCE(m.description, 'Maintenance') as description,
           m.cost as amount
    FROM public.asset_maintenance m
    JOIN public.assets a ON m.asset_id = a.id
    WHERE 1=1
  `;
  const maintValues = [];
  idx = 1;
  if (date_from) {
    maintQuery += ` AND m.maintenance_date >= $${idx}`;
    maintValues.push(date_from);
    idx++;
  }
  if (date_to) {
    maintQuery += ` AND m.maintenance_date <= $${idx}`;
    maintValues.push(date_to);
  }
  const maint = await pool.query(maintQuery, maintValues);
  maint.rows.forEach((r) => transactions.push(r));

  // Disposals (assets with status=disposed)
  try {
    let dispQuery = `
      SELECT COALESCE(a.disposal_date::timestamp, a.created_at) as trans_date,
             a.asset_code, a.name as asset_name,
             'disposal' as trans_type,
             COALESCE(a.disposal_reason, 'Asset disposed') as description,
             a.disposal_value as amount
      FROM public.assets a
      WHERE a.status = 'disposed'
    `;
    const dispValues = [];
    idx = 1;
    if (date_from) {
      dispQuery += ` AND COALESCE(a.disposal_date, a.created_at::date) >= $${idx}`;
      dispValues.push(date_from);
      idx++;
    }
    if (date_to) {
      dispQuery += ` AND COALESCE(a.disposal_date, a.created_at::date) <= $${idx}`;
      dispValues.push(date_to);
    }
    const disp = await pool.query(dispQuery, dispValues);
    disp.rows.forEach((r) => transactions.push(r));
  } catch (e) {
    // disposal_date might not exist in older schemas
  }

  transactions.sort((a, b) => new Date(b.trans_date) - new Date(a.trans_date));
  return transactions;
};

const getDepreciationStatement = async (filters = {}) => {
  const { date_from, date_to } = filters;
  let query = `
    SELECT d.*, a.asset_code, a.name as asset_name, a.purchase_price,
           c.name as category_name
    FROM public.depreciation_records d
    JOIN public.assets a ON d.asset_id = a.id
    LEFT JOIN public.asset_categories c ON a.category_id = c.id
    WHERE 1=1
  `;
  const values = [];
  let i = 1;
  if (date_from) {
    query += ` AND d.period_end >= $${i}`;
    values.push(date_from);
    i++;
  }
  if (date_to) {
    query += ` AND d.period_end <= $${i}`;
    values.push(date_to);
  }
  query += ' ORDER BY a.asset_code, d.period_start';
  const result = await pool.query(query, values);
  return result.rows;
};

const getAssetsLedger = async (filters = {}) => {
  const { asset_id, date_from, date_to } = filters;
  const ledgers = [];

  const assetsQuery = asset_id
    ? 'SELECT id, asset_code, name FROM public.assets WHERE id = $1'
    : 'SELECT id, asset_code, name FROM public.assets ORDER BY asset_code';
  const assetsResult = await pool.query(assetsQuery, asset_id ? [asset_id] : []);
  const assets = assetsResult.rows;

  for (const asset of assets) {
    const opening = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM public.depreciation_records
       WHERE asset_id = $1 AND period_end < $2::date`,
      [asset.id, date_from || '1900-01-01'],
    );
    const periodDep = await pool.query(
      `SELECT period_start, period_end, amount
       FROM public.depreciation_records
       WHERE asset_id = $1
         AND ($2::date IS NULL OR period_end >= $2)
         AND ($3::date IS NULL OR period_start <= $3)
       ORDER BY period_start`,
      [asset.id, date_from || null, date_to || null],
    );
    const closingDate = date_to || '9999-12-31';
    const closing = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM public.depreciation_records
       WHERE asset_id = $1 AND period_end <= $2::date`,
      [asset.id, closingDate],
    );

    const a = await pool.query(
      'SELECT purchase_price FROM public.assets WHERE id = $1',
      [asset.id],
    );
    const purchasePrice = parseFloat(a.rows[0]?.purchase_price) || 0;
    const openingBalance = purchasePrice - parseFloat(opening.rows[0]?.total || 0);
    const closingBalance = purchasePrice - parseFloat(closing.rows[0]?.total || 0);

    ledgers.push({
      asset,
      openingBalance,
      periodRecords: periodDep.rows,
      closingBalance,
    });
  }
  return ledgers;
};

module.exports = {
  getAssetsListing,
  getAssetTransactionListing,
  getDepreciationStatement,
  getAssetsLedger,
};
