const { promisify } = require('util');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const moment = require('moment');
const QRCode = require('qrcode');
const multer = require('multer');
const path = require('path');

const stockQuery = require('../queries/stockQuery');
const stockInQuery = require('../queries/stockInQuery');
const stockOutQuery = require('../queries/stockOutQuery');

const uploadsDir = path.join(__dirname, '../../public/uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, uploadsDir); },
  filename: (req, file, cb) => { cb(null, Date.now() + path.extname(file.originalname)); },
});
const upload = multer({ storage });
const unlinkAsync = promisify(fs.unlink);

const getStock = async (req, res) => {
  const items = await stockQuery.getItems();
  res.render('stock', { title: req.t('stock.title'), items });
};

const getItemDetail = async (req, res) => {
  const item = await stockQuery.getItemById(req.params.id);
  const stockInList = await stockInQuery.getStockInByItemId(req.params.id);
  const stockOutList = await stockOutQuery.getStockOutByItemId(req.params.id);
  res.render('itemDetail', {
    item,
    title: req.t('itemDetail.title'),
    stockInList,
    stockOutList,
    moment,
  });
};

const addItem = [
  upload.single('image'),
  body('kodebarang').custom(async (value) => {
    const dup = await stockQuery.checkCodeExists(value.toLowerCase());
    if (dup) throw new Error('stock.addFailCodeExists');
    return true;
  }),
  body('namabarang').custom(async (value) => {
    const duplicate = await stockQuery.checkNameExists(value.toLowerCase());
    if (duplicate) throw new Error('stock.addFailNameExists');
    return true;
  }),
  body('image').custom(async (value, { req }) => {
    if (req.file.size > 1048576) throw new Error('stock.imageTooBig');
    return true;
  }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const img = req.file.filename;
      const imgPath = path.join(uploadsDir, img);
      if (fs.existsSync(imgPath)) await unlinkAsync(imgPath);
      const items = await stockQuery.getItems();
      return res.render('stock', {
        title: req.t('stock.title'),
        errors: errors.array().map((e) => ({ ...e, msg: req.t(e.msg) })),
        items,
      });
    }
    const { namabarang, deskripsi, stock, kodebarang } = req.body;
    const image = req.file.filename;
    const penginput = req.session.user.email;
    await stockQuery.addItem(namabarang, deskripsi, stock, image, penginput, kodebarang);
    const writeImgPath = path.join(uploadsDir, `${kodebarang}.png`);
    QRCode.toFile(writeImgPath, kodebarang, (err) => { if (err) console.error(err); });
    res.redirect('/stock');
  },
];

const updateItem = [
  upload.single('image'),
  body('kodebarang').custom(async (value, { req }) => {
    const dup = await stockQuery.findByCode(value.toLowerCase());
    if (value !== req.body.oldKode && dup) throw new Error('stock.editFailCodeExists');
    return true;
  }),
  body('namabarang').custom(async (value, { req }) => {
    const duplicate = await stockQuery.findByName(value.toLowerCase());
    if (value !== req.body.oldNama && duplicate) throw new Error('stock.editFailNameExists');
    return true;
  }),
  body('image').custom(async (value, { req }) => {
    if (req.file && req.file.size > 1048576) throw new Error('stock.imageTooBig');
    return true;
  }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file && req.file.filename) {
        const imgPath = path.join(uploadsDir, req.file.filename);
        if (fs.existsSync(imgPath)) await unlinkAsync(imgPath);
      }
      const items = await stockQuery.getItems();
      return res.render('stock', {
        title: req.t('stock.title'),
        errors: errors.array().map((e) => ({ ...e, msg: req.t(e.msg) })),
        items,
      });
    }
    const { namabarang, deskripsi, stock, kodebarang, oldKode, idbarang, image: bodyImage } = req.body;
    const image = req.file && req.file.filename ? req.file.filename : bodyImage;
    await stockQuery.updateItem(namabarang, deskripsi, stock, image, kodebarang, idbarang);
    if (req.file && req.file.filename && req.body.image) {
      const imgPath = path.join(uploadsDir, req.body.image);
      if (fs.existsSync(imgPath)) await unlinkAsync(imgPath);
    }
    if (kodebarang !== oldKode) {
      const oldImgPath = path.join(uploadsDir, `${oldKode}.png`);
      if (fs.existsSync(oldImgPath)) await unlinkAsync(oldImgPath);
      const writeImgPath = path.join(uploadsDir, `${kodebarang}.png`);
      QRCode.toFile(writeImgPath, kodebarang, (err) => { if (err) console.error(err); });
    }
    res.redirect('/stock');
  },
];

const deleteItem = async (req, res) => {
  const image = await stockQuery.getItemImage(req.params.id);
  const kode = await stockQuery.getItemCode(req.params.id);
  await stockQuery.deleteItem(req.params.id);
  const imgPath = path.join(uploadsDir, image);
  if (fs.existsSync(imgPath)) await unlinkAsync(imgPath);
  const writeImgPath = path.join(uploadsDir, `${kode}.png`);
  if (fs.existsSync(writeImgPath)) await unlinkAsync(writeImgPath);
  res.redirect('/stock');
};

module.exports = {
  getStock,
  getItemDetail,
  addItem,
  updateItem,
  deleteItem,
};
