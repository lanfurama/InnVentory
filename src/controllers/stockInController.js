const moment = require('moment');
const stockQuery = require('../queries/stockQuery');
const stockInQuery = require('../queries/stockInQuery');

const getStockIn = async (req, res) => {
  const stockInList = await stockInQuery.getAllStockIn();
  const items = await stockQuery.getItems();
  res.render('stockIn', {
    title: req.t('stockIn.title'),
    stockInList,
    moment,
    items,
    includeQrScanner: true,
  });
};

const addStockIn = async (req, res) => {
  const idbarang = req.body.barang;
  const { keterangan, qty } = req.body;
  const namabarangMasuk = await stockQuery.getItemName(idbarang);
  const penginput = req.session.user.email;
  const kodebarangMasuk = await stockQuery.getItemCode(idbarang);
  const stock = await stockQuery.getStockQty(idbarang);
  const newStock = parseInt(stock, 10) + parseInt(qty, 10);
  await stockQuery.updateStockQty(newStock, idbarang);
  await stockInQuery.addStockIn(
    idbarang,
    keterangan,
    qty,
    namabarangMasuk,
    penginput,
    kodebarangMasuk,
  );
  res.redirect('/stock-in');
};

const updateStockIn = async (req, res) => {
  const { idbarang, keterangan, qty, idmasuk } = req.body;
  const stockk = await stockQuery.getStockQty(idbarang);
  if (stockk !== 'undefined') {
    const currentQtyy = await stockInQuery.getStockInQty(idmasuk);
    const qtyy = parseInt(qty, 10);
    const currentQty = parseInt(currentQtyy, 10);
    if (qtyy > currentQty) {
      const selisih = qtyy - currentQty;
      const tambahin = stockk + selisih;
      await stockQuery.updateStockQty(tambahin, idbarang);
      await stockInQuery.updateStockIn(keterangan, qty, idmasuk);
      return res.redirect('/stock-in');
    }
    const selisih = currentQty - qtyy;
    const kurangin = stockk - selisih;
    if (kurangin < 0) {
      const stockInList = await stockInQuery.getAllStockIn();
      const items = await stockQuery.getItems();
      return res.render('stockIn', {
        title: req.t('stockIn.title'),
        stockInList,
        moment,
        deleteFail: req.t('stockIn.editFailNegativeStock'),
        items,
        includeQrScanner: true,
      });
    }
    await stockQuery.updateStockQty(kurangin, idbarang);
    await stockInQuery.updateStockIn(keterangan, qty, idmasuk);
    return res.redirect('/stock-in');
  }
  await stockInQuery.updateStockIn(keterangan, qty, idmasuk);
  res.redirect('/stock-in');
};

const deleteStockIn = async (req, res) => {
  const { idbarang, qty, idmasuk } = req.body;
  const stockk = await stockQuery.getStockQty(idbarang);
  if (stockk !== 'undefined') {
    const qtyy = parseInt(qty, 10);
    const stock = parseInt(stockk, 10);
    const selisih = stock - qtyy;
    if (selisih < 0) {
      const stockInList = await stockInQuery.getAllStockIn();
      const items = await stockQuery.getItems();
      return res.render('stockIn', {
        title: req.t('stockIn.title'),
        stockInList,
        moment,
        deleteFail: req.t('stockIn.deleteFailNegativeStock'),
        items,
        includeQrScanner: true,
      });
    }
    await stockQuery.updateStockQty(selisih, idbarang);
    await stockInQuery.deleteStockIn(idmasuk);
    return res.redirect('/stock-in');
  }
  await stockInQuery.deleteStockIn(idmasuk);
  res.redirect('/stock-in');
};

module.exports = {
  getStockIn,
  addStockIn,
  updateStockIn,
  deleteStockIn,
};
