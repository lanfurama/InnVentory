const depreciationQuery = require('../queries/depreciationQuery');
const assetQuery = require('../queries/assetQuery');

// Simple book value projection: total value minus linear depreciation over 10 years
const getBookValueProjection = async (years = 10) => {
  const totalValue = parseFloat(await assetQuery.getTotalValue()) || 0;
  const totalDepreciation = parseFloat(await depreciationQuery.getTotalDepreciation()) || 0;
  const currentBookValue = Math.max(0, totalValue - totalDepreciation);
  const annualDepreciation = years > 0 ? currentBookValue / years : 0;
  const currentYear = new Date().getFullYear();
  const result = { years: [], netBookValues: [], originalCosts: [] };
  for (let i = 0; i <= years; i++) {
    const y = currentYear + i;
    result.years.push(y);
    result.originalCosts.push(totalValue);
    result.netBookValues.push(Math.max(0, currentBookValue - annualDepreciation * i));
  }
  return result;
};

const getDepreciationPage = async (req, res) => {
  const [calculationRuns, totalValue, totalDepreciation, bookValueProjection] = await Promise.all([
    depreciationQuery.getCalculationRuns(),
    assetQuery.getTotalValue(),
    depreciationQuery.getTotalDepreciation(),
    getBookValueProjection(10),
  ]);
  const totalValueNum = parseFloat(totalValue) || 0;
  const totalDepNum = parseFloat(totalDepreciation) || 0;
  const estExpenseFY = totalDepNum;
  res.render('depreciation', {
    title: req.t('depreciation.title'),
    calculationRuns,
    formData: {},
    success: req.query.success === '1',
    totalValue: totalValueNum,
    totalDepreciation: totalDepNum,
    estExpenseFY,
    bookValueProjection,
  });
};

const calculateDepreciation = async (req, res) => {
  const { period_start, period_end, reference_number, revaluate } = req.body;
  const createdBy = req.session.user?.email || null;

  if (!period_start || !period_end) {
    const [calculationRuns, bookValueProjection] = await Promise.all([
      depreciationQuery.getCalculationRuns(),
      getBookValueProjection(10),
    ]);
    const totalValueNum = parseFloat(await assetQuery.getTotalValue()) || 0;
    const totalDepNum = parseFloat(await depreciationQuery.getTotalDepreciation()) || 0;
    return res.render('depreciation', {
      title: req.t('depreciation.title'),
      calculationRuns,
      formData: req.body,
      errors: [{ msg: req.t('depreciation.dateRequired') || 'Starting date and end date are required.' }],
      totalValue: totalValueNum,
      totalDepreciation: totalDepNum,
      estExpenseFY: totalDepNum,
      bookValueProjection,
    });
  }

  const start = new Date(period_start);
  const end = new Date(period_end);
  if (start > end) {
    const [calculationRuns, bookValueProjection] = await Promise.all([
      depreciationQuery.getCalculationRuns(),
      getBookValueProjection(10),
    ]);
    const totalValueNum = parseFloat(await assetQuery.getTotalValue()) || 0;
    const totalDepNum = parseFloat(await depreciationQuery.getTotalDepreciation()) || 0;
    return res.render('depreciation', {
      title: req.t('depreciation.title'),
      calculationRuns,
      formData: req.body,
      errors: [{ msg: req.t('depreciation.dateRangeInvalid') || 'Start date must be before end date.' }],
      totalValue: totalValueNum,
      totalDepreciation: totalDepNum,
      estExpenseFY: totalDepNum,
      bookValueProjection,
    });
  }

  try {
    const result = await depreciationQuery.runCalculation(
      period_start,
      period_end,
      reference_number || null,
      !!revaluate,
      createdBy,
    );
    res.redirect(`/depreciation?success=1&records=${result.recordsCreated}&assets=${result.assetsProcessed}`);
  } catch (err) {
    console.error(err);
    const [calculationRuns, bookValueProjection] = await Promise.all([
      depreciationQuery.getCalculationRuns(),
      getBookValueProjection(10),
    ]);
    const totalValueNum = parseFloat(await assetQuery.getTotalValue()) || 0;
    const totalDepNum = parseFloat(await depreciationQuery.getTotalDepreciation()) || 0;
    res.render('depreciation', {
      title: req.t('depreciation.title'),
      calculationRuns,
      formData: req.body,
      errors: [{ msg: err.message || req.t('depreciation.calcFailed') || 'Depreciation calculation failed.' }],
      totalValue: totalValueNum,
      totalDepreciation: totalDepNum,
      estExpenseFY: totalDepNum,
      bookValueProjection,
    });
  }
};

const showCalculationRun = async (req, res) => {
  const run = await depreciationQuery.getCalculationRunById(req.params.id);
  if (!run) return res.redirect('/depreciation');

  const records = await depreciationQuery.getRecordsByCalculationRun(req.params.id);
  res.render('depreciationShow', {
    title: req.t('depreciation.showTitle') || 'Depreciation Calculation',
    run,
    records,
  });
};

const removeCalculationRun = async (req, res) => {
  await depreciationQuery.removeCalculationRun(req.params.id);
  res.redirect('/depreciation');
};

module.exports = {
  getDepreciationPage,
  calculateDepreciation,
  showCalculationRun,
  removeCalculationRun,
};
