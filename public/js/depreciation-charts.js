/**
 * Depreciation Page Charts - Book value projection and related charts
 */
(function () {
  'use strict';

  function initBookValueProjectionChart(containerId, years, netBookValues, originalCosts) {
    var el = document.getElementById(containerId);
    if (!el || typeof ApexCharts === 'undefined') return;

    var options = {
      series: [
        { name: 'Net Book Value', data: netBookValues },
        { name: 'Original Cost', data: originalCosts }
      ],
      chart: {
        type: 'line',
        height: 320,
        zoom: { enabled: false },
        toolbar: { show: false }
      },
      stroke: { curve: 'smooth', width: 2 },
      colors: ['#3498db', '#95a5a6'],
      xaxis: {
        categories: years,
        labels: { style: { fontSize: '12px' } }
      },
      yaxis: {
        labels: {
          formatter: function (val) {
            if (val >= 1000000) return '$' + (val / 1000000).toFixed(1) + 'M';
            if (val >= 1000) return '$' + (val / 1000).toFixed(0) + 'k';
            return '$' + val;
          }
        }
      },
      grid: {
        borderColor: '#e9ecef',
        strokeDashArray: 4
      },
      legend: {
        position: 'top'
      },
      tooltip: {
        y: { formatter: function (val) { return '$' + Number(val).toLocaleString(); } }
      }
    };

    var chart = new ApexCharts(el, options);
    chart.render();
    return chart;
  }

  window.initDepreciationCharts = function (config) {
    if (!config || !config.bookValueProjection) return;
    var c = config.bookValueProjection;
    initBookValueProjectionChart(
      c.containerId || 'bookValueProjectionChart',
      c.years || [],
      c.netBookValues || [],
      c.originalCosts || []
    );
  };
})();
