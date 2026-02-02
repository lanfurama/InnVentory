/**
 * Asset Page Charts - Optional charts for asset inventory page
 */
(function () {
  'use strict';

  function initAssetSummaryChart(containerId, seriesData, labels) {
    var el = document.getElementById(containerId);
    if (!el || typeof ApexCharts === 'undefined') return;

    var options = {
      series: seriesData,
      chart: { type: 'donut', height: 200 },
      labels: labels,
      colors: ['#1976d2', '#27ae60', '#f39c12'],
      legend: { position: 'bottom' },
      plotOptions: {
        pie: {
          donut: {
            size: '60%',
            labels: {
              show: true,
              total: { show: true }
            }
          }
        }
      }
    };

    var chart = new ApexCharts(el, options);
    chart.render();
    return chart;
  }

  window.initAssetCharts = function (config) {
    if (!config || !config.summary) return;
    initAssetSummaryChart(
      config.summary.containerId || 'assetSummaryChart',
      config.summary.series || [],
      config.summary.labels || []
    );
  };
})();
