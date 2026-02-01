const pool = require('../config/database');

const getStockInById = async (id) => {
  const result = await pool.query({
    text: 'SELECT * FROM public.masuk WHERE idmasuk = $1',
    values: [id],
  });
  return result.rows[0];
};

const getStockInQty = async (id) => {
  const result = await pool.query({
    text: 'SELECT * FROM public.masuk WHERE idmasuk = $1',
    values: [id],
  });
  return result.rows[0].qty;
};

const addStockIn = async (
  idbarang,
  keterangan,
  qty,
  namabarangMasuk,
  penginput,
  kodebarangMasuk,
) => {
  await pool.query({
    text: 'INSERT INTO public.masuk(idbarang, keterangan, qty, namabarang_m, penginput, kodebarang_m) VALUES ($1, $2, $3, $4, $5, $6)',
    values: [idbarang, keterangan, qty, namabarangMasuk, penginput, kodebarangMasuk],
  });
};

const updateStockIn = async (keterangan, qty, idmasuk) => {
  await pool.query({
    text: 'UPDATE public.masuk SET keterangan = $1, qty = $2 WHERE idmasuk = $3',
    values: [keterangan, qty, idmasuk],
  });
};

const deleteStockInByItemId = async (id) => {
  await pool.query({
    text: 'DELETE FROM public.masuk WHERE idbarang = $1',
    values: [id],
  });
};

const deleteStockIn = async (idmasuk) => {
  await pool.query({
    text: 'DELETE FROM public.masuk WHERE idmasuk = $1',
    values: [idmasuk],
  });
};

const getAllStockIn = async () => {
  const result = await pool.query({
    text: 'SELECT * FROM public.masuk ORDER by idmasuk DESC',
    values: [],
  });
  return result.rows;
};

const getStockInByItemId = async (id) => {
  const result = await pool.query({
    text: 'SELECT * FROM public.masuk WHERE idbarang = $1',
    values: [id],
  });
  return result.rows;
};

const getTotalStockInQty = async () => {
  const result = await pool.query({
    text: 'SELECT SUM(qty) FROM masuk',
    values: [],
  });
  return result.rows[0].sum;
};

module.exports = {
  getStockInById,
  getStockInQty,
  addStockIn,
  updateStockIn,
  deleteStockInByItemId,
  deleteStockIn,
  getAllStockIn,
  getStockInByItemId,
  getTotalStockInQty,
};
