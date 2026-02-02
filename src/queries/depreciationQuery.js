const pool = require('../config/database');

const getByAssetId = async (assetId) => {
  const result = await pool.query(
    'SELECT * FROM public.depreciation_records WHERE asset_id = $1 ORDER BY period_end DESC',
    [assetId],
  );
  return result.rows;
};

const getAll = async () => {
  const result = await pool.query(`
    SELECT d.*, a.asset_code, a.name as asset_name
    FROM public.depreciation_records d
    JOIN public.assets a ON d.asset_id = a.id
    ORDER BY d.period_end DESC
  `);
  return result.rows;
};

const add = async (assetId, periodStart, periodEnd, amount, calculationRunId = null) => {
  await pool.query(
    `INSERT INTO public.depreciation_records(asset_id, calculation_run_id, period_start, period_end, amount)
     VALUES ($1, $2, $3, $4, $5)`,
    [assetId, calculationRunId, periodStart, periodEnd, amount],
  );
};

const getTotalDepreciation = async () => {
  const result = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM public.depreciation_records');
  return result.rows[0].total;
};

// Get depreciation amount by month for the last N months (for trends chart)
const getDepreciationTrends = async (months = 12) => {
  const result = await pool.query(
    `SELECT to_char(period_end, 'YYYY-MM') as month,
            COALESCE(SUM(amount), 0)::numeric as amount
     FROM public.depreciation_records
     WHERE period_end >= (CURRENT_DATE - ($1::text || ' months')::interval)
     GROUP BY to_char(period_end, 'YYYY-MM')
     ORDER BY month ASC`,
    [months],
  );
  return result.rows;
};

// Get assets eligible for depreciation (active, with category, acquisition_date, purchase_price > 0)
const getAssetsForDepreciation = async (periodEnd) => {
  const result = await pool.query(`
    SELECT a.id, a.asset_code, a.name, a.purchase_price, a.acquisition_date, a.status,
           c.useful_life_years, c.depreciation_method,
           COALESCE(c.residual_value, 0) as residual_value
    FROM public.assets a
    JOIN public.asset_categories c ON a.category_id = c.id
    WHERE a.status IN ('active', 'maintenance', 'transferred')
      AND a.purchase_price > 0
      AND a.acquisition_date IS NOT NULL
      AND a.acquisition_date <= $1::date
  `, [periodEnd]);
  return result.rows;
};

// Get total depreciation for an asset before a given date (for declining balance book value)
const getAccumulatedDepreciationBefore = async (assetId, beforeDate) => {
  const result = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) as total
     FROM public.depreciation_records
     WHERE asset_id = $1 AND period_end < $2::date`,
    [assetId, beforeDate],
  );
  return parseFloat(result.rows[0].total);
};

// Get existing period ranges for asset (to avoid duplicates when not revaluating)
const getExistingPeriodsForAsset = async (assetId, periodStart, periodEnd) => {
  const result = await pool.query(
    `SELECT period_start, period_end FROM public.depreciation_records
     WHERE asset_id = $1
       AND (period_start, period_end) OVERLAPS ($2::date, $3::date)`,
    [assetId, periodStart, periodEnd],
  );
  return result.rows;
};

// Calculate depreciation for one asset over a period
// Returns array of { period_start, period_end, amount }
function calculateDepreciationForAsset(asset, periodStart, periodEnd, accumulatedBeforeStart) {
  const results = [];
  const purchasePrice = parseFloat(asset.purchase_price) || 0;
  const residualValue = parseFloat(asset.residual_value) || 0;
  const usefulLifeYears = parseInt(asset.useful_life_years, 10) || 5;
  const method = asset.depreciation_method || 'straight_line';
  const acquisitionDate = new Date(asset.acquisition_date);

  const depStart = new Date(Math.max(periodStart.getTime(), acquisitionDate.getTime()));
  if (depStart > periodEnd) return results;

  if (method === 'straight_line') {
    const depreciable = Math.max(0, purchasePrice - residualValue);
    const totalMonths = usefulLifeYears * 12;
    const monthlyAmount = totalMonths > 0 ? depreciable / totalMonths : 0;

    let current = new Date(depStart.getFullYear(), depStart.getMonth(), 1);
    const endDate = new Date(periodEnd.getFullYear(), periodEnd.getMonth() + 1, 0);
    const maxDepreciationEnd = new Date(acquisitionDate);
    maxDepreciationEnd.setFullYear(maxDepreciationEnd.getFullYear() + usefulLifeYears);

    while (current <= endDate && current < maxDepreciationEnd) {
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
      const periodStartStr = current.toISOString().slice(0, 10);
      const periodEndStr = monthEnd.toISOString().slice(0, 10);
      results.push({ period_start: periodStartStr, period_end: periodEndStr, amount: Math.round(monthlyAmount * 100) / 100 });
      current.setMonth(current.getMonth() + 1);
    }
  } else {
    // Declining balance: rate = 2 / useful_life (double-declining)
    const rate = usefulLifeYears > 0 ? 2 / usefulLifeYears : 0;
    let bookValue = purchasePrice - accumulatedBeforeStart;
    if (bookValue <= residualValue) return results;

    let current = new Date(depStart.getFullYear(), depStart.getMonth(), 1);
    const endDate = new Date(periodEnd.getFullYear(), periodEnd.getMonth() + 1, 0);
    const monthlyRate = rate / 12;

    while (current <= endDate && bookValue > residualValue) {
      const depAmount = Math.min(bookValue * monthlyRate, bookValue - residualValue);
      if (depAmount <= 0) break;

      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
      const periodStartStr = current.toISOString().slice(0, 10);
      const periodEndStr = monthEnd.toISOString().slice(0, 10);
      results.push({ period_start: periodStartStr, period_end: periodEndStr, amount: Math.round(depAmount * 100) / 100 });

      bookValue -= depAmount;
      current.setMonth(current.getMonth() + 1);
    }
  }
  return results;
}

// Delete overlapping depreciation records for an asset in the period (for revaluate)
const deleteOverlappingRecords = async (client, assetId, periodStart, periodEnd) => {
  await client.query(
    `DELETE FROM public.depreciation_records
     WHERE asset_id = $1 AND (period_start, period_end) OVERLAPS ($2::date, $3::date)`,
    [assetId, periodStart, periodEnd],
  );
};

// Create calculation run and run depreciation for all eligible assets
const runCalculation = async (periodStart, periodEnd, referenceNumber, revaluate, createdBy) => {
  const client = await pool.connect();
  try {
    const runResult = await client.query(
      `INSERT INTO public.depreciation_calculation_runs(period_start, period_end, reference_number, revaluate, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [periodStart, periodEnd, referenceNumber || null, !!revaluate, createdBy || null],
    );
    const runId = runResult.rows[0].id;

    const assets = await getAssetsForDepreciation(periodEnd);
    let totalRecords = 0;

    for (const asset of assets) {
      let accumulatedBeforeStart = 0;
      if (revaluate) {
        await deleteOverlappingRecords(client, asset.id, periodStart, periodEnd);
      } else {
        accumulatedBeforeStart = await getAccumulatedDepreciationBefore(asset.id, periodStart);
      }

      const records = calculateDepreciationForAsset(asset, new Date(periodStart), new Date(periodEnd), accumulatedBeforeStart);

      if (!revaluate) {
        const existing = await getExistingPeriodsForAsset(asset.id, periodStart, periodEnd);
        const existingSet = new Set(existing.map((r) => `${r.period_start}_${r.period_end}`));
        for (const rec of records) {
          if (!existingSet.has(`${rec.period_start}_${rec.period_end}`)) {
            await client.query(
              `INSERT INTO public.depreciation_records(asset_id, calculation_run_id, period_start, period_end, amount)
               VALUES ($1, $2, $3, $4, $5)`,
              [asset.id, runId, rec.period_start, rec.period_end, rec.amount],
            );
            totalRecords++;
          }
        }
      } else {
        for (const rec of records) {
          await client.query(
            `INSERT INTO public.depreciation_records(asset_id, calculation_run_id, period_start, period_end, amount)
             VALUES ($1, $2, $3, $4, $5)`,
            [asset.id, runId, rec.period_start, rec.period_end, rec.amount],
          );
          totalRecords++;
        }
      }
    }

    return { runId, recordsCreated: totalRecords, assetsProcessed: assets.length };
  } finally {
    client.release();
  }
};

const getCalculationRuns = async () => {
  const result = await pool.query(`
    SELECT * FROM public.depreciation_calculation_runs
    ORDER BY created_at DESC
  `);
  return result.rows;
};

const getCalculationRunById = async (id) => {
  const result = await pool.query(
    'SELECT * FROM public.depreciation_calculation_runs WHERE id = $1',
    [id],
  );
  return result.rows[0];
};

const getRecordsByCalculationRun = async (runId) => {
  const result = await pool.query(`
    SELECT d.*, a.asset_code, a.name as asset_name
    FROM public.depreciation_records d
    JOIN public.assets a ON d.asset_id = a.id
    WHERE d.calculation_run_id = $1
    ORDER BY a.asset_code, d.period_start
  `, [runId]);
  return result.rows;
};

const removeCalculationRun = async (runId) => {
  await pool.query('DELETE FROM public.depreciation_records WHERE calculation_run_id = $1', [runId]);
  await pool.query('DELETE FROM public.depreciation_calculation_runs WHERE id = $1', [runId]);
};

module.exports = {
  getByAssetId,
  getAll,
  add,
  getTotalDepreciation,
  getDepreciationTrends,
  getAssetsForDepreciation,
  runCalculation,
  getCalculationRuns,
  getCalculationRunById,
  getRecordsByCalculationRun,
  removeCalculationRun,
};
