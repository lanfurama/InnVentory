const pool = require('../config/database');

const getAll = async () => {
  const result = await pool.query(`
    SELECT t.*, a.asset_code, a.name as asset_name,
           fd.name as from_dept_name, td.name as to_dept_name
    FROM public.asset_transfers t
    JOIN public.assets a ON t.asset_id = a.id
    LEFT JOIN public.departments fd ON t.from_dept_id = fd.id
    LEFT JOIN public.departments td ON t.to_dept_id = td.id
    ORDER BY t.transferred_at DESC
  `);
  return result.rows;
};

const getById = async (id) => {
  const result = await pool.query(`
    SELECT t.*, a.asset_code, a.name as asset_name,
           fd.name as from_dept_name, td.name as to_dept_name
    FROM public.asset_transfers t
    JOIN public.assets a ON t.asset_id = a.id
    LEFT JOIN public.departments fd ON t.from_dept_id = fd.id
    LEFT JOIN public.departments td ON t.to_dept_id = td.id
    WHERE t.id = $1
  `, [id]);
  return result.rows[0];
};

const getByAssetId = async (assetId) => {
  const result = await pool.query(`
    SELECT t.*, fd.name as from_dept_name, td.name as to_dept_name
    FROM public.asset_transfers t
    LEFT JOIN public.departments fd ON t.from_dept_id = fd.id
    LEFT JOIN public.departments td ON t.to_dept_id = td.id
    WHERE t.asset_id = $1
    ORDER BY t.transferred_at DESC
  `, [assetId]);
  return result.rows;
};

const add = async (assetId, fromDeptId, toDeptId, reason, transferredBy) => {
  await pool.query(
    `INSERT INTO public.asset_transfers(asset_id, from_dept_id, to_dept_id, reason, transferred_by)
     VALUES ($1, $2, $3, $4, $5)`,
    [assetId, fromDeptId || null, toDeptId || null, reason || null, transferredBy || null],
  );
};

const remove = async (id) => {
  await pool.query('DELETE FROM public.asset_transfers WHERE id = $1', [id]);
};

module.exports = {
  getAll,
  getById,
  getByAssetId,
  add,
  remove,
};
