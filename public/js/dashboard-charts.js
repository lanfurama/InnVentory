/**
 * Dashboard Charts - ApexCharts for dashboard (depreciation trends, asset distribution)
 */
(function () {
  'use strict';

  function initDepreciationTrendsChart(containerId, categories, seriesData) {
    var el = document.getElementById(containerId);
    if (!el || typeof ApexCharts === 'undefined') return;

    var options = {
      series: [{ name: 'Projected Value', data: seriesData }],
      chart: {
        type: 'line',
        height: 280,
        zoom: { enabled: false },
        toolbar: { show: false }
      },
      noData: {
        text: 'No data',
        align: 'center',
        verticalAlign: 'middle'
      },
      stroke: { curve: 'smooth', width: 2 },
      colors: ['#3498db'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.1
        }
      },
      xaxis: {
        categories: categories,
        labels: { style: { fontSize: '12px' } }
      },
      yaxis: {
        labels: {
          formatter: function (val) {
            return val >= 1000000 ? (val / 1000000).toFixed(1) + 'M' : (val / 1000).toFixed(0) + 'k';
          }
        }
      },
      grid: {
        borderColor: '#e9ecef',
        strokeDashArray: 4
      },
      tooltip: {
        y: { formatter: function (val) { return '$' + Number(val).toLocaleString(); } }
      }
    };

    var chart = new ApexCharts(el, options);
    chart.render();
    return chart;
  }

  function initAssetDistributionChart(containerId, seriesData, labels) {
    var el = document.getElementById(containerId);
    if (!el || typeof ApexCharts === 'undefined') return;

    if (!seriesData || seriesData.length === 0) {
      seriesData = [1];
      labels = ['No data'];
    }
    var total = seriesData.reduce(function (a, b) { return a + b; }, 0);

    var options = {
      series: seriesData,
      chart: {
        type: 'donut',
        height: 280
      },
      noData: {
        text: 'No data',
        align: 'center',
        verticalAlign: 'middle'
      },
      labels: labels,
      colors: ['#3498db', '#27ae60', '#f39c12', '#e74c3c', '#9b59b6'],
      legend: {
        position: 'bottom',
        fontSize: '14px'
      },
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              name: { show: true },
              value: {
                show: true,
                formatter: function (val) { return total.toLocaleString(); }
              },
              total: {
                show: true,
                label: 'Total Assets',
                formatter: function () { return total.toLocaleString(); }
              }
            }
          }
        }
      },
      dataLabels: { enabled: true }
    };

    var chart = new ApexCharts(el, options);
    chart.render();
    return chart;
  }

  window.initDashboardCharts = function (config) {
    if (!config) return;
    if (config.depreciationTrends && config.depreciationTrends.categories && config.depreciationTrends.series) {
      initDepreciationTrendsChart(
        config.depreciationTrends.containerId || 'depreciationTrendsChart',
        config.depreciationTrends.categories,
        config.depreciationTrends.series
      );
    }
    if (config.assetDistribution && config.assetDistribution.series && config.assetDistribution.labels) {
      initAssetDistributionChart(
        config.assetDistribution.containerId || 'assetDistributionChart',
        config.assetDistribution.series,
        config.assetDistribution.labels
      );
    }
  };
})();
