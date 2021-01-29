import Chart from 'chart.js';
import moment from 'moment';

const paddingBelowLegendPlugin = {
  id: 'paddingBelowLegend',
  beforeInit: function(chart) {
    chart.legend.afterFit = function() {
      this.height = this.height + 10;
    };
  }
};

const verticalLinePlugin = {
  getLinePosition: function (chart, pointIndex) {
    const meta = chart.getDatasetMeta(3);
    const data = meta.data;
    return data[pointIndex]._model.x;
  },
  renderVerticalLine: function (chartInstance, pointIndex) {
    const lineLeftOffset = this.getLinePosition(chartInstance, pointIndex);
    const scale = chartInstance.scales['y-axis-0'];
    const context = chartInstance.chart.ctx;
    context.beginPath();
    context.strokeStyle = '#888888';
    context.setLineDash([5, 5]);
    context.moveTo(lineLeftOffset, scale.top);
    context.lineTo(lineLeftOffset, scale.bottom);
    context.stroke();
    context.setLineDash([0, 0]);
    context.closePath();
  },

  afterDatasetsDraw: function (chart) {
    if (chart.config.lineAtIndex) {
      chart.config.lineAtIndex.forEach(pointIndex => this.renderVerticalLine(chart, pointIndex));
    }
  }
};

const getColor = data => {
  let color;
  switch(data.deliveryConfidence) {
  case 0:
    color = '#C21D03';
    break;
  case 1:
    color = '#FF7631';
    break;
  case 2:
    color = '#FFDD00';
    break;
  case 3:
    color = '#00B661';
    break;
  }

  if (data.complete == "Yes") {
    color = '#41628D';
  }

  return color;
};

const chartData = data => {
  const timeFormat = 'DD/MM/YYYY';

  const todaysDate = moment();
  const minmumChartEndDate = moment('31/03/2021', timeFormat);
  const endOfTransitionPeriodDate = moment('31/12/2020', timeFormat);
  const targetDate = moment(data.date, timeFormat);
  const latestPossibleDateForDelivery = moment(data.latestPossibleDateForDelivery, timeFormat);

  const allDates = [
    todaysDate,
    minmumChartEndDate,
    endOfTransitionPeriodDate,
    targetDate,
    latestPossibleDateForDelivery
  ];
  const minDate = moment.min(allDates);
  const maxDate = moment.max(allDates);

  const currentDateColor = '#888888';
  const color = getColor(data);

  return {
    type: 'line',
    data: {
      datasets: [{
        label: 'Today\'s Date',
        data: [{
          label: 'Today\'s Date',
          x: todaysDate.format(timeFormat),
          y: 2.5
        }],
        pointRadius: 10,
        pointHoverRadius: 10
      },{
        label: 'Target Delivery Date',
        data: [{
          label: 'Target Delivery Date',
          x: targetDate.format(timeFormat),
          y: 2
        }],
        pointRadius: 10,
        pointHoverRadius: 10
      },{
        label: 'Latest Delivery Date',
        data: [{
          label: 'Latest Delivery Date',
          x: latestPossibleDateForDelivery.format(timeFormat),
          y: 3
        }],
        pointRadius: 10,
        pointHoverRadius: 10
      },{
        label: 'End of Transition Period',
        data: [{
          x: endOfTransitionPeriodDate.format(timeFormat)
        }],
        borderDash: [5, 10]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      title: {
        display: false
      },
      scales: {
        xAxes: [{
          type: 'time',
          time: {
            parser: timeFormat,
            tooltipFormat: timeFormat,
            unit: 'day',
            unitStepSize: 5
          },
          ticks: {
            min: minDate.subtract('5', 'd'),
            max: maxDate.add('5', 'd'),
          },
          gridLines: {
            drawBorder: false,
          }
        }],
        yAxes: [{
          gridLines: {
            display: false
          },
          ticks: {
            display: false,
            min: 0,
            max: 5
          }
        }]
      },
      legend: {
        labels: {
          usePointStyle: true
        }
      },
      elements: {
        point: {
          borderColor: function(ctx) {
            if(ctx.datasetIndex === 0) {
              return currentDateColor;
            } else if (ctx.datasetIndex === 1) {
              return color;
            } else if (ctx.datasetIndex === 2) {
              return color;
            }
          },
          backgroundColor: function(ctx) {
            if(ctx.datasetIndex === 0) {
              return currentDateColor;
            } else if (ctx.datasetIndex === 1) {
              return 'rgba(0,0,0,0)';
            } else if (ctx.datasetIndex === 2) {
              return color;
            }
          },
          pointStyle: function(ctx) {
            if(ctx.datasetIndex === 0) {
              return 'circle';
            } else if (ctx.datasetIndex === 1) {
              return 'rectRot';
            } else if (ctx.datasetIndex === 2) {
              return 'rectRot';
            } else {
              var yourImage = new Image()
              yourImage.src = '/assets/images/dashed-vertical-line.png';
              return yourImage;
            }
          }
        }
      },
      tooltips: {
        custom: function(tooltip) {
          if (!tooltip) return;
          tooltip.displayColors = false;
        },
        callbacks: {
          label: function(tooltipItem, data) {
            const label = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].label;
            return `${label}: ${tooltipItem.xLabel}`;
          },
          title: function() {
            return;
          }
        }
      }
    },
    lineAtIndex: [0]
  };
};

export default (elementId, data) =>  {
  const ctx = document.getElementById(elementId);
  if(!ctx) {
    return;
  }

  Chart.plugins.register(verticalLinePlugin);
  Chart.plugins.register(paddingBelowLegendPlugin);
  new Chart(ctx, chartData(data));
};
