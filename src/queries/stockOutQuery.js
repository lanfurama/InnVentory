const pool = require('../config/database');

const getStockOutById = async (id) => {
  const result = await pool.query({
    text: 'SELECT * FROM public.keluar WHERE idkeluar = $1',
    values: [id],
  });
  return result.rows[0];
};

const getStockOutQty = async (id) => {
  const result = await pool.query({
    text: 'SELECT * FROM public.keluar WHERE idkeluar = $1',
    values: [id],
  });
  return result.rows[0].qty;
};

const addStockOut = async (
  idbarang,
  penerima,
  qty,
  namabarangKeluar,
  penginput,
  kodebarangKeluar,
) => {
  await pool.query({
    text: 'INSERT INTO public.keluar(idbarang, penerima, qty, namabarang_k, penginput, kodebarang_k) VALUES ($1, $2, $3, $4, $5, $6)',
    values: [idbarang, penerima, qty, namabarangKeluar, penginput, kodebarangKeluar],
  });
};

const updateStockOut = async (penerima, qty, idkeluar) => {
  await pool.query({
    text: 'UPDATE public.keluar SET penerima= $1, qty = $2 WHERE idkeluar = $3',
    values: [penerima, qty, idkeluar],
  });
};

const deleteStockOutByItemId = async (id) => {
  await pool.query({
    text: 'DELETE FROM public.keluar WHERE idbarang = $1',
    values: [id],
  });
};

const deleteStockOut = async (idkeluar) => {
  await pool.query({
    text: 'DELETE FROM public.keluar WHERE idkeluar = $1',
    values: [idkeluar],
  });
};

const getAllStockOut = async () => {
  const result = await pool.query({
    text: 'SELECT * FROM public.keluar ORDER BY idkeluar DESC',
    values: [],
  });
  return result.rows;
};

const getStockOutByItemId = async (id) => {
  const result = await pool.query({
    text: 'SELECT * FROM public.keluar WHERE idbarang = $1',
    values: [id],
  });
  return result.rows;
};

const getTotalStockOutQty = async () => {
  const result = await pool.query({
    text: 'SELECT SUM(qty) FROM keluar',
    values: [],
  });
  return result.rows[0].sum;
};

module.exports = {
  getStockOutById,
  getStockOutQty,
  addStockOut,
  updateStockOut,
  deleteStockOutByItemId,
  deleteStockOut,
  getAllStockOut,
  getStockOutByItemId,
  getTotalStockOutQty,
};
