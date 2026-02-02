const user = require('../queries/usersQuery');
const assetQuery = require('../queries/assetQuery');
const depreciationQuery = require('../queries/depreciationQuery');

const getIndex = async (req, res) => {
  if (req.session.user && req.session.user.role === 'superadmin') {
    const [
      totalAssets,
      totalValue,
      totalDepreciation,
      totalUsers,
      byDepartment,
      byCategory,
      warrantyExpiring,
      newAssetsThisMonth,
      newAssetsValueThisMonth,
      retiredYTD,
      depreciationTrends,
      recentActivity,
    ] = await Promise.all([
      assetQuery.getTotalCount(),
      assetQuery.getTotalValue(),
      depreciationQuery.getTotalDepreciation(),
      user.totalUsers(),
      assetQuery.getCountByDepartment(),
      assetQuery.getCountByCategory(),
      assetQuery.getWarrantyExpiringCount(30),
      assetQuery.getNewAssetsThisMonth(),
      assetQuery.getNewAssetsValueThisMonth(),
      assetQuery.getRetiredAssetsYTD(),
      depreciationQuery.getDepreciationTrends(12),
      assetQuery.getRecentActivity(10),
    ]);
    const totalValueNum = parseFloat(totalValue) || 0;
    const yoyTrend = totalValueNum > 0 && newAssetsValueThisMonth > 0
      ? `+${Math.round((parseFloat(newAssetsValueThisMonth) / totalValueNum) * 100)}% new`
      : null;
    res.render('index', {
      user: req.session.user.email,
      title: req.t('dashboard.title'),
      totalAssets,
      totalValue,
      totalDepreciation,
      totalUsers,
      byDepartment,
      byCategory,
      warrantyExpiring,
      newAssetsThisMonth,
      retiredYTD,
      depreciationTrends,
      recentActivity,
      yoyTrend: yoyTrend || '+0%',
      chartData: {
        depreciationTrends,
        byCategory,
        byDepartment,
      },
    });
  } else if (req.session.user && req.session.user.role === 'user') {
    const [
      totalAssets,
      totalValue,
      totalDepreciation,
      totalUsers,
      byDepartment,
      byCategory,
      warrantyExpiring,
      newAssetsThisMonth,
      newAssetsValueThisMonth,
      retiredYTD,
      depreciationTrends,
      recentActivity,
    ] = await Promise.all([
      assetQuery.getTotalCount(),
      assetQuery.getTotalValue(),
      depreciationQuery.getTotalDepreciation(),
      user.totalUsers(),
      assetQuery.getCountByDepartment(),
      assetQuery.getCountByCategory(),
      assetQuery.getWarrantyExpiringCount(30),
      assetQuery.getNewAssetsThisMonth(),
      assetQuery.getNewAssetsValueThisMonth(),
      assetQuery.getRetiredAssetsYTD(),
      depreciationQuery.getDepreciationTrends(12),
      assetQuery.getRecentActivity(10),
    ]);
    const totalValueNum = parseFloat(totalValue) || 0;
    const yoyTrend = totalValueNum > 0 && newAssetsValueThisMonth > 0
      ? `+${Math.round((parseFloat(newAssetsValueThisMonth) / totalValueNum) * 100)}% new`
      : null;
    res.render('index', {
      us: req.session.user.email,
      title: req.t('dashboard.title'),
      totalAssets,
      totalValue,
      totalDepreciation,
      totalUsers,
      byDepartment,
      byCategory,
      warrantyExpiring,
      newAssetsThisMonth,
      retiredYTD,
      depreciationTrends,
      recentActivity,
      yoyTrend: yoyTrend || '+0%',
      chartData: {
        depreciationTrends,
        byCategory,
        byDepartment,
      },
    });
  } else {
    res.render('login', { title: req.t('login.title') });
  }
};

module.exports = getIndex;
