const pool = require('../config/database');

const getAll = async () => {
  const result = await pool.query(`
    SELECT a.*, c.name as category_name, c.code as category_code,
           d.name as department_name, d.code as department_code
    FROM public.assets a
    LEFT JOIN public.asset_categories c ON a.category_id = c.id
    LEFT JOIN public.departments d ON a.department_id = d.id
    ORDER BY a.asset_code
  `);
  return result.rows;
};

const getByDepartmentId = async (departmentId) => {
  const result = await pool.query(`
    SELECT a.*, c.name as category_name, c.code as category_code,
           d.name as department_name, d.code as department_code
    FROM public.assets a
    LEFT JOIN public.asset_categories c ON a.category_id = c.id
    LEFT JOIN public.departments d ON a.department_id = d.id
    WHERE a.department_id = $1 AND a.status != 'disposed'
    ORDER BY a.asset_code
  `, [departmentId]);
  return result.rows;
};

const getById = async (id) => {
  const result = await pool.query(`
    SELECT a.*, c.name as category_name, c.code as category_code,
           d.name as department_name, d.code as department_code
    FROM public.assets a
    LEFT JOIN public.asset_categories c ON a.category_id = c.id
    LEFT JOIN public.departments d ON a.department_id = d.id
    WHERE a.id = $1
  `, [id]);
  return result.rows[0];
};

const getByAssetCode = async (assetCode) => {
  const result = await pool.query('SELECT * FROM public.assets WHERE LOWER(asset_code) = $1', [assetCode.toLowerCase()]);
  return result.rows[0];
};

const add = async (data) => {
  const {
    assetCode, name, serialNumber, categoryId, purchasePrice, acquisitionDate,
    departmentId, custodian, location, warrantyExpiry, status, image, notes, createdBy,
  } = data;
  await pool.query(
    `INSERT INTO public.assets(asset_code, name, serial_number, category_id, purchase_price,
      acquisition_date, department_id, custodian, location, warranty_expiry, status, image, notes, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
    [assetCode, name, serialNumber || null, categoryId || null, purchasePrice || 0, acquisitionDate || null,
      departmentId || null, custodian || null, location || null, warrantyExpiry || null,
      status || 'active', image || null, notes || null, createdBy || null],
  );
};

const update = async (id, data) => {
  const {
    assetCode, name, serialNumber, categoryId, purchasePrice, acquisitionDate,
    departmentId, custodian, location, warrantyExpiry, status, image, notes,
  } = data;
  await pool.query(
    `UPDATE public.assets SET asset_code = $1, name = $2, serial_number = $3, category_id = $4,
      purchase_price = $5, acquisition_date = $6, department_id = $7, custodian = $8,
      location = $9, warranty_expiry = $10, status = $11, image = $12, notes = $13
     WHERE id = $14`,
    [assetCode, name, serialNumber || null, categoryId || null, purchasePrice || 0, acquisitionDate || null,
      departmentId || null, custodian || null, location || null, warrantyExpiry || null,
      status || 'active', image || null, notes || null, id],
  );
};

const remove = async (id) => {
  await pool.query('DELETE FROM public.assets WHERE id = $1', [id]);
};

const dispose = async (id, disposalDate, disposalReason, disposalValue) => {
  await pool.query(
    `UPDATE public.assets SET status = 'disposed', disposal_date = $2, disposal_reason = $3, disposal_value = $4
     WHERE id = $1`,
    [id, disposalDate || null, disposalReason || null, disposalValue || null],
  );
};

const getImage = async (id) => {
  const result = await pool.query('SELECT image FROM public.assets WHERE id = $1', [id]);
  return result.rows[0]?.image;
};

const getTotalCount = async () => {
  const result = await pool.query('SELECT COUNT(*) as count FROM public.assets');
  return result.rows[0].count;
};

const getTotalValue = async () => {
  const result = await pool.query('SELECT COALESCE(SUM(purchase_price), 0) as total FROM public.assets WHERE status != \'disposed\'');
  return result.rows[0].total;
};

const getCountByDepartment = async () => {
  const result = await pool.query(`
    SELECT d.id, d.name, d.code, COUNT(a.id) as count
    FROM public.departments d
    LEFT JOIN public.assets a ON a.department_id = d.id AND a.status != 'disposed'
    GROUP BY d.id, d.name, d.code
    ORDER BY count DESC
  `);
  return result.rows;
};

const getCountByCategory = async () => {
  const result = await pool.query(`
    SELECT c.name, c.code, COUNT(a.id) as count
    FROM public.asset_categories c
    LEFT JOIN public.assets a ON a.category_id = c.id AND a.status != 'disposed'
    GROUP BY c.id, c.name, c.code
    ORDER BY count DESC
  `);
  return result.rows;
};

const getWarrantyExpiringCount = async (days = 30) => {
  const result = await pool.query(
    `SELECT COUNT(*) as count FROM public.assets
     WHERE warranty_expiry IS NOT NULL
       AND warranty_expiry BETWEEN CURRENT_DATE AND CURRENT_DATE + $1::integer`,
    [days],
  );
  return result.rows[0].count;
};

const getNewAssetsThisMonth = async () => {
  const result = await pool.query(`
    SELECT COUNT(*) as count FROM public.assets
    WHERE date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)
  `);
  return result.rows[0].count;
};

const getNewAssetsValueThisMonth = async () => {
  const result = await pool.query(`
    SELECT COALESCE(SUM(purchase_price), 0) as total FROM public.assets
    WHERE date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)
  `);
  return result.rows[0].total;
};

const getRetiredAssetsYTD = async () => {
  const result = await pool.query(`
    SELECT COUNT(*) as count FROM public.assets
    WHERE status = 'disposed'
      AND disposal_date >= date_trunc('year', CURRENT_DATE)::date
  `);
  return result.rows[0].count;
};

const getRecentActivity = async (limit = 10) => {
  const result = await pool.query(
    `SELECT * FROM (
      SELECT a.id, a.asset_code, a.name, 'Assignment' as event_type,
             t.transferred_by as user_name, t.transferred_at as event_date, a.status
      FROM public.asset_transfers t
      JOIN public.assets a ON t.asset_id = a.id
      UNION ALL
      SELECT a.id, a.asset_code, a.name, 'Maintenance Request',
             m.performed_by, m.created_at as event_date, a.status
      FROM public.asset_maintenance m
      JOIN public.assets a ON m.asset_id = a.id
      UNION ALL
      SELECT id, asset_code, name, 'Disposal', NULL::text,
             (disposal_date::date + time '00:00:00')::timestamp with time zone as event_date, 'disposed'
      FROM public.assets
      WHERE disposal_date IS NOT NULL
    ) AS combined
    ORDER BY event_date DESC NULLS LAST
    LIMIT $1`,
    [limit],
  );
  return result.rows;
};

module.exports = {
  getAll,
  getById,
  getByAssetCode,
  getByDepartmentId,
  add,
  update,
  remove,
  dispose,
  getImage,
  getTotalCount,
  getTotalValue,
  getCountByDepartment,
  getCountByCategory,
  getWarrantyExpiringCount,
  getNewAssetsThisMonth,
  getNewAssetsValueThisMonth,
  getRetiredAssetsYTD,
  getRecentActivity,
};
