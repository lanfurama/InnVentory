const pool = require('../config/database');

const getItems = async () => {
  const query = {
    text: 'SELECT * FROM public.stock ORDER BY idbarang',
    values: [],
  };
  const result = await pool.query(query);
  return result.rows;
};

const checkCodeExists = async (kodebarang) => {
  const query = {
    text: 'SELECT kodebarang FROM public.stock WHERE LOWER(kodebarang) = $1',
    values: [kodebarang],
  };
  const result = await pool.query(query);
  if (!result.rowCount) return undefined;
  return result.rows[0].kodebarang;
};

const checkNameExists = async (namabarang) => {
  const query = {
    text: 'SELECT namabarang FROM public.stock WHERE LOWER(namabarang) = $1',
    values: [namabarang],
  };
  const result = await pool.query(query);
  if (!result.rowCount) return undefined;
  return result.rows[0].namabarang;
};

const addItem = async (namabarang, deskripsi, stock, image, penginput, kodebarang) => {
  const query = {
    text: 'INSERT INTO public.stock(namabarang, deskripsi, stock, image, penginput, kodebarang) VALUES ($1, $2, $3, $4, $5, $6)',
    values: [namabarang, deskripsi, stock, image, penginput, kodebarang],
  };
  await pool.query(query);
};

const getItemImage = async (id) => {
  const result = await pool.query({
    text: 'SELECT image FROM public.stock WHERE idbarang = $1',
    values: [id],
  });
  return result.rows[0].image;
};

const deleteItem = async (id) => {
  await pool.query({
    text: 'DELETE FROM public.stock WHERE idbarang = $1',
    values: [id],
  });
};

const getItemById = async (id) => {
  const result = await pool.query({
    text: 'SELECT * FROM public.stock WHERE idbarang = $1',
    values: [id],
  });
  return result.rows[0];
};

const updateItem = async (namabarang, deskripsi, stock, image, kodebarang, idbarang) => {
  await pool.query({
    text: 'UPDATE public.stock SET namabarang = $1, deskripsi = $2, stock = $3, image = $4, kodebarang = $5 WHERE idbarang = $6',
    values: [namabarang, deskripsi, stock, image, kodebarang, idbarang],
  });
};

const getStockQty = async (id) => {
  const result = await pool.query({
    text: 'SELECT * FROM public.stock WHERE idbarang = $1',
    values: [id],
  });
  if (!result.rowCount) return 'undefined';
  return result.rows[0].stock;
};

const updateStockQty = async (newStock, idbarang) => {
  await pool.query({
    text: 'UPDATE public.stock SET stock = $1 WHERE idbarang = $2',
    values: [newStock, idbarang],
  });
};

const findByCode = async (kodebarang) => {
  const result = await pool.query({
    text: 'SELECT * FROM public.stock WHERE LOWER(kodebarang) = $1',
    values: [kodebarang],
  });
  return result.rows[0];
};

const findByName = async (namabarang) => {
  const result = await pool.query({
    text: 'SELECT * FROM public.stock WHERE LOWER(namabarang) = $1',
    values: [namabarang],
  });
  return result.rows[0];
};

const getItemCode = async (id) => {
  const result = await pool.query({
    text: 'SELECT kodebarang FROM public.stock WHERE idbarang = $1',
    values: [id],
  });
  return result.rows[0].kodebarang;
};

const getItemName = async (id) => {
  const result = await pool.query({
    text: 'SELECT namabarang FROM public.stock WHERE idbarang = $1',
    values: [id],
  });
  return result.rows[0].namabarang;
};

const getTotalStockQty = async () => {
  const result = await pool.query({
    text: 'SELECT SUM(stock) FROM stock',
    values: [],
  });
  return result.rows[0].sum;
};

module.exports = {
  getItems,
  checkCodeExists,
  checkNameExists,
  addItem,
  getItemImage,
  deleteItem,
  getItemById,
  updateItem,
  getStockQty,
  updateStockQty,
  findByCode,
  findByName,
  getItemCode,
  getItemName,
  getTotalStockQty,
};
