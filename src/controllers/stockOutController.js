const moment = require('moment');
const stockQuery = require('../queries/stockQuery');
const stockOutQuery = require('../queries/stockOutQuery');

const getStockOut = async (req, res) => {
  const stockOutList = await stockOutQuery.getAllStockOut();
  const items = await stockQuery.getItems();
  res.render('stockOut', {
    title: req.t('stockOut.title'),
    stockOutList,
    moment,
    items,
    includeQrScanner: true,
  });
};

const addStockOut = async (req, res) => {
  const idbarang = req.body.barang;
  const { penerima, qty } = req.body;
  const namabarangKeluar = await stockQuery.getItemName(idbarang);
  const penginput = req.session.user.email;
  const kodebarangKeluar = await stockQuery.getItemCode(idbarang);
  const stock = await stockQuery.getStockQty(idbarang);
  const newStock = parseInt(stock, 10) - parseInt(qty, 10);
  if (newStock < 0) {
    const stockOutList = await stockOutQuery.getAllStockOut();
    const items = await stockQuery.getItems();
    return res.render('stockOut', {
      title: req.t('stockOut.title'),
      stockOutList,
      moment,
      error: req.t('stockOut.addFailInsufficientStock'),
      items,
      includeQrScanner: true,
    });
  }
  await stockQuery.updateStockQty(newStock, idbarang);
  await stockOutQuery.addStockOut(
    idbarang,
    penerima,
    qty,
    namabarangKeluar,
    penginput,
    kodebarangKeluar,
  );
  res.redirect('/stock-out');
};

const updateStockOut = async (req, res) => {
  const { idbarang, penerima, qty, idkeluar } = req.body;
  const stockk = await stockQuery.getStockQty(idbarang);
  if (stockk !== 'undefined') {
    const currentQtyy = await stockOutQuery.getStockOutQty(idkeluar);
    const qtyy = parseInt(qty, 10);
    const currentQty = parseInt(currentQtyy, 10);
    if (qtyy > currentQty) {
      const selisih = qtyy - currentQty;
      const kurangin = stockk - selisih;
      if (kurangin < 0) {
        const stockOutList = await stockOutQuery.getAllStockOut();
        const items = await stockQuery.getItems();
        return res.render('stockOut', {
          title: req.t('stockOut.title'),
          stockOutList,
          moment,
          error: req.t('stockOut.editFailNegativeStock'),
          items,
          includeQrScanner: true,
        });
      }
      await stockQuery.updateStockQty(kurangin, idbarang);
      await stockOutQuery.updateStockOut(penerima, qty, idkeluar);
      return res.redirect('/stock-out');
    }
    const selisih = currentQty - qtyy;
    const tambahin = stockk + selisih;
    await stockQuery.updateStockQty(tambahin, idbarang);
    await stockOutQuery.updateStockOut(penerima, qty, idkeluar);
    return res.redirect('/stock-out');
  }
  await stockOutQuery.updateStockOut(penerima, qty, idkeluar);
  res.redirect('/stock-out');
};

const deleteStockOut = async (req, res) => {
  const { idbarang, qty, idkeluar } = req.body;
  const stockk = await stockQuery.getStockQty(idbarang);
  if (stockk !== 'undefined') {
    const qtyy = parseInt(qty, 10);
    const stock = parseInt(stockk, 10);
    const selisih = stock + qtyy;
    await stockQuery.updateStockQty(selisih, idbarang);
    await stockOutQuery.deleteStockOut(idkeluar);
    return res.redirect('/stock-out');
  }
  await stockOutQuery.deleteStockOut(idkeluar);
  res.redirect('/stock-out');
};

module.exports = {
  getStockOut,
  addStockOut,
  updateStockOut,
  deleteStockOut,
};
