const pool = require('../config/database');

const getAll = async () => {
  const result = await pool.query('SELECT * FROM public.asset_categories ORDER BY name');
  return result.rows;
};

const getById = async (id) => {
  const result = await pool.query('SELECT * FROM public.asset_categories WHERE id = $1', [id]);
  return result.rows[0];
};

const getByCode = async (code) => {
  const result = await pool.query('SELECT * FROM public.asset_categories WHERE LOWER(code) = $1', [code.toLowerCase()]);
  return result.rows[0];
};

const add = async (name, code, usefulLifeYears = 5, depreciationMethod = 'straight_line', residualValue = 0) => {
  await pool.query(
    'INSERT INTO public.asset_categories(name, code, useful_life_years, depreciation_method, residual_value) VALUES ($1, $2, $3, $4, $5)',
    [name, code, usefulLifeYears, depreciationMethod, residualValue || 0],
  );
};

const update = async (id, name, code, usefulLifeYears, depreciationMethod, residualValue = 0) => {
  await pool.query(
    'UPDATE public.asset_categories SET name = $1, code = $2, useful_life_years = $3, depreciation_method = $4, residual_value = $5 WHERE id = $6',
    [name, code, usefulLifeYears, depreciationMethod, residualValue || 0, id],
  );
};

const remove = async (id) => {
  await pool.query('DELETE FROM public.asset_categories WHERE id = $1', [id]);
};

const checkCodeExists = async (code, excludeId = null) => {
  let query = "SELECT id FROM public.asset_categories WHERE LOWER(code) = $1";
  const values = [code.toLowerCase()];
  if (excludeId) {
    query += ' AND id != $2';
    values.push(excludeId);
  }
  const result = await pool.query(query, values);
  return result.rows[0];
};

module.exports = {
  getAll,
  getById,
  getByCode,
  add,
  update,
  remove,
  checkCodeExists,
};
