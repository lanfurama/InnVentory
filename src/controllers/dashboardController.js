const user = require('../queries/usersQuery');
const stockQuery = require('../queries/stockQuery');
const stockInQuery = require('../queries/stockInQuery');
const stockOutQuery = require('../queries/stockOutQuery');

const getIndex = async (req, res) => {
  if (req.session.user && req.session.user.role === 'superadmin') {
    const totalStock = await stockQuery.getTotalStockQty();
    const totalQtyBM = await stockInQuery.getTotalStockInQty();
    const totalQtyBK = await stockOutQuery.getTotalStockOutQty();
    const totalUsers = await user.totalUsers();
    res.render('index', {
      user: req.session.user.email,
      title: req.t('dashboard.title'),
      totalStock,
      totalQtyBM,
      totalQtyBK,
      totalUsers,
    });
  } else if (req.session.user && req.session.user.role === 'user') {
    const totalStock = await stockQuery.getTotalStockQty();
    const totalQtyBM = await stockInQuery.getTotalStockInQty();
    const totalQtyBK = await stockOutQuery.getTotalStockOutQty();
    const totalUsers = await user.totalUsers();
    res.render('index', {
      us: req.session.user.email,
      title: req.t('dashboard.title'),
      totalStock,
      totalQtyBM,
      totalQtyBK,
      totalUsers,
    });
  } else {
    res.render('login', { title: req.t('login.title') });
  }
};

module.exports = getIndex;
