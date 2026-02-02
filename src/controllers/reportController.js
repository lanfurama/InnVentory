const reportQuery = require('../queries/reportQuery');
const assetQuery = require('../queries/assetQuery');
const assetCategoryQuery = require('../queries/assetCategoryQuery');
const departmentQuery = require('../queries/departmentQuery');
const depreciationQuery = require('../queries/depreciationQuery');

const getReportsOverview = async (req, res) => {
  const [
    totalValue,
    totalDepreciation,
    totalAssets,
    byCategory,
    depreciationTrends,
    newAssetsThisMonth,
    retiredYTD,
  ] = await Promise.all([
    assetQuery.getTotalValue(),
    depreciationQuery.getTotalDepreciation(),
    assetQuery.getTotalCount(),
    assetQuery.getCountByCategory(),
    depreciationQuery.getDepreciationTrends(12),
    assetQuery.getNewAssetsThisMonth(),
    assetQuery.getRetiredAssetsYTD(),
  ]);
  const totalValueNum = parseFloat(totalValue) || 0;
  const totalDepNum = parseFloat(totalDepreciation) || 0;
  res.render('reports/index', {
    title: req.t('reports.overview') || 'Financial Reporting & Analytics',
    totalValue: totalValueNum,
    totalDepreciation: totalDepNum,
    totalAssets: parseInt(totalAssets, 10) || 0,
    byCategory: byCategory || [],
    depreciationTrends: depreciationTrends || [],
    newAssetsThisMonth: parseInt(newAssetsThisMonth, 10) || 0,
    retiredYTD: parseInt(retiredYTD, 10) || 0,
    departments: await departmentQuery.getAll(),
    categories: await assetCategoryQuery.getAll(),
    filters: req.query,
  });
};

const getAssetsListing = async (req, res) => {
  const [assets, departments, categories] = await Promise.all([
    reportQuery.getAssetsListing(req.query),
    departmentQuery.getAll(),
    assetCategoryQuery.getAll(),
  ]);
  res.render('reports/assetsListing', {
    title: req.t('reports.assetsListing') || 'Assets Listing',
    assets,
    departments,
    categories,
    filters: req.query,
  });
};

const getTransactionListing = async (req, res) => {
  const transactions = await reportQuery.getAssetTransactionListing(req.query);
  res.render('reports/transactionListing', {
    title: req.t('reports.transactionListing') || 'Asset Transaction Listing',
    transactions,
    filters: req.query,
  });
};

const getDepreciationStatement = async (req, res) => {
  const records = await reportQuery.getDepreciationStatement(req.query);
  res.render('reports/depreciationStatement', {
    title: req.t('reports.depreciationStatement') || 'Depreciation Statement',
    records,
    filters: req.query,
  });
};

const getAssetsLedger = async (req, res) => {
  const ledgers = await reportQuery.getAssetsLedger(req.query);
  const assets = await assetQuery.getAll();
  res.render('reports/assetsLedger', {
    title: req.t('reports.assetsLedger') || 'Assets Ledger',
    ledgers,
    assets,
    filters: req.query,
  });
};

module.exports = {
  getReportsOverview,
  getAssetsListing,
  getTransactionListing,
  getDepreciationStatement,
  getAssetsLedger,
};
