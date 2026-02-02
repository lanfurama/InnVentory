const pool = require('../config/database');

const getAll = async () => {
  const result = await pool.query(`
    SELECT m.*, a.asset_code, a.name as asset_name
    FROM public.asset_maintenance m
    JOIN public.assets a ON m.asset_id = a.id
    ORDER BY m.maintenance_date DESC
  `);
  return result.rows;
};

const getById = async (id) => {
  const result = await pool.query(`
    SELECT m.*, a.asset_code, a.name as asset_name
    FROM public.asset_maintenance m
    JOIN public.assets a ON m.asset_id = a.id
    WHERE m.id = $1
  `, [id]);
  return result.rows[0];
};

const getByAssetId = async (assetId) => {
  const result = await pool.query(
    'SELECT * FROM public.asset_maintenance WHERE asset_id = $1 ORDER BY maintenance_date DESC',
    [assetId],
  );
  return result.rows;
};

const add = async (assetId, maintenanceDate, description, cost, performedBy) => {
  await pool.query(
    `INSERT INTO public.asset_maintenance(asset_id, maintenance_date, description, cost, performed_by)
     VALUES ($1, $2, $3, $4, $5)`,
    [assetId, maintenanceDate, description || null, cost || 0, performedBy || null],
  );
};

const update = async (id, maintenanceDate, description, cost, performedBy) => {
  await pool.query(
    `UPDATE public.asset_maintenance SET maintenance_date = $1, description = $2, cost = $3, performed_by = $4
     WHERE id = $5`,
    [maintenanceDate, description || null, cost || 0, performedBy || null, id],
  );
};

const remove = async (id) => {
  await pool.query('DELETE FROM public.asset_maintenance WHERE id = $1', [id]);
};

module.exports = {
  getAll,
  getById,
  getByAssetId,
  add,
  update,
  remove,
};
