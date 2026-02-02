const pool = require('../config/database');

const getAll = async () => {
  const result = await pool.query('SELECT * FROM public.departments ORDER BY name');
  return result.rows;
};

const getById = async (id) => {
  const result = await pool.query('SELECT * FROM public.departments WHERE id = $1', [id]);
  return result.rows[0];
};

const getByCode = async (code) => {
  const result = await pool.query('SELECT * FROM public.departments WHERE LOWER(code) = $1', [code.toLowerCase()]);
  return result.rows[0];
};

const add = async (name, code) => {
  await pool.query('INSERT INTO public.departments(name, code) VALUES ($1, $2)', [name, code]);
};

const update = async (id, name, code) => {
  await pool.query('UPDATE public.departments SET name = $1, code = $2 WHERE id = $3', [name, code, id]);
};

const remove = async (id) => {
  await pool.query('DELETE FROM public.departments WHERE id = $1', [id]);
};

const checkCodeExists = async (code, excludeId = null) => {
  let query = "SELECT id FROM public.departments WHERE LOWER(code) = $1";
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
