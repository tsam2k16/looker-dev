// Include required libraries
const dscc = require('@google/dscc');

// Dynamically load Chart.js (using v3.x)
function loadChartJs() {
  return new Promise((resolve, reject) => {
    if (window.Chart) {
      resolve(window.Chart);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
    script.onload = () => resolve(window.Chart);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Helper function to convert color codes from hex to rgba
function hexToRGB(hex, alpha) {
  if (!hex) return undefined;
  
  var r = parseInt(hex.slice(1, 3), 16),
      g = parseInt(hex.slice(3, 5), 16),
      b = parseInt(hex.slice(5, 7), 16);

  if (alpha) {
    return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
  } else {
    return "rgb(" + r + ", " + g + ", " + b + ")";
  }
}

// Function to format large numbers
function formatNumber(value, metricType) {
  if (typeof value !== 'number') return value;
  
  let formattedValue = value;
  
  // Format based on size
  if (Math.abs(value) >= 1000) {
    formattedValue = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  
  // Add currency symbol if needed
  if (metricType === "CURRENCY_USD") {
    return "$" + formattedValue;
  }
  
  return formattedValue;
}

// Create and draw the radar chart
async function drawViz(data) {
  // Load Chart.js first
  await loadChartJs();
  
  // Create container element if it doesn't exist
  let chartContainer = document.getElementById('chartContainer');
  if (!chartContainer) {
    chartContainer = document.createElement('div');
    chartContainer.id = 'chartContainer';
    chartContainer.style.width = '100%';
    chartContainer.style.height = '100%';
    document.body.appendChild(chartContainer);
  } else {
    // Clear the container
    chartContainer.innerHTML = '';
  }

  // Create canvas for the chart
  const canvasEl = document.createElement('canvas');
  canvasEl.id = 'chartCanvas';
  canvasEl.width = dscc.getWidth() - 20;
  canvasEl.height = dscc.getHeight() - 20;
  chartContainer.appendChild(canvasEl);

  const ctx = canvasEl.getContext('2d');

  // Get data and style properties
  const dataTable = data.tables.DEFAULT;
  const styleConfig = data.style;
  
  // Extract style options
  const lineWidth = styleConfig.width ? styleConfig.width.value : 3;
  const fillArea = styleConfig.fill ? styleConfig.fill.value : true;
  const opacity = styleConfig.opacity ? styleConfig.opacity.value : 0.1;
  
  const legend = styleConfig.legend ? !styleConfig.legend.value : true;
  const legendPosition = styleConfig.legendPosition ? styleConfig.legendPosition.value : 'top';
  
  const yLabels = styleConfig.ylabels ? !styleConfig.ylabels.value : true;
  const yLines = styleConfig.ylines ? !styleConfig.ylines.value : true;
  const yMin = styleConfig.ymin && styleConfig.ymin.value ? parseFloat(styleConfig.ymin.value) : undefined;
  const yMax = styleConfig.ymax && styleConfig.ymax.value ? parseFloat(styleConfig.ymax.value) : undefined;
  const yTicks = styleConfig.yticks && styleConfig.yticks.value ? parseInt(styleConfig.yticks.value) : undefined;
  const pointLabels = styleConfig.pointLabels ? !styleConfig.pointLabels.value : true;
  const gridlines = styleConfig.gridlines ? !styleConfig.gridlines.value : true;
  const circular = styleConfig.circular ? styleConfig.circular.value : false;
  const tooltips = styleConfig.tooltips ? !styleConfig.tooltips.value : true;
  
  // Get custom colors
  const lineColors = [];
  for (let i = 0; i < 4; i++) {
    const colorId = 'color' + (i + 1);
    if (styleConfig[colorId] && styleConfig[colorId].value) {
      lineColors[i] = styleConfig[colorId].value.color;
    }
  }
  
  // Prepare chart data
  // Get field (metric) names
  const metricFields = data.fields.value.map(field => field.name);
  const metricTypes = data.fields.value.map(field => field.type);
  
  // Get unique categories from the data
  const categories = [...new Set(dataTable.map(row => row.breakdown))];
  
  // Prepare datasets
  const datasets = categories.map((category, i) => {
    // Filter data for this category
    const categoryData = dataTable.filter(row => row.breakdown === category);
    
    // Get the theme color or use custom color if provided
    const themeColor = lineColors[i] || data.theme.themeSeriesColor[i % 20].color;
    const fillColor = hexToRGB(themeColor, opacity);
    
    return {
      label: category,
      data: categoryData.map(row => row.value),
      borderColor: themeColor,
      backgroundColor: fillColor,
      borderWidth: lineWidth,
      fill: fillArea
    };
  });
  
  // Set Chart.js defaults - UPDATED FOR v3.x
  Chart.defaults.color = data.theme.themeFontColor.color;
  Chart.defaults.font.family = data.theme.themeFontFamily;
  Chart.defaults.elements.point.radius = 2;
  Chart.defaults.elements.point.hitRadius = 10;
  Chart.defaults.elements.point.hoverRadius = 5;
  Chart.defaults.elements.line.fill = false;
  
  // Create the radar chart - UPDATED FOR v3.x
  const myRadarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: metricFields,
      datasets: datasets
    },
    options: {
      plugins: {
        legend: {
          display: legend,
          position: legendPosition
        },
        tooltip: {
          enabled: tooltips,
          intersect: false,
          mode: 'index',
          displayColors: true,
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.raw;
              const formattedValue = formatNumber(value, metricTypes[context.dataIndex]);
              return `${label}: ${formattedValue}`;
            }
          }
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          min: yMin,
          max: yMax,
          ticks: {
            maxTicksLimit: yTicks,
            display: yLabels,
            callback: function(value) {
              // Format tick values
              return formatNumber(value, metricTypes[0]);
            }
          },
          angleLines: {
            display: yLines
          },
          grid: {
            display: gridlines,
            circular: circular
          },
          pointLabels: {
            display: pointLabels,
            font: {
              size: 12
            },
            callback: function(label) {
              // Handle long labels - split into multiple lines if needed
              if (label.length > 15) {
                const words = label.split(' ');
                let lines = [];
                let currentLine = '';
                
                words.forEach(word => {
                  if (currentLine.length + word.length < 15) {
                    currentLine += (currentLine.length ? ' ' : '') + word;
                  } else {
                    lines.push(currentLine);
                    currentLine = word;
                  }
                });
                
                if (currentLine) {
                  lines.push(currentLine);
                }
                
                return lines;
              }
              return label;
            }
          }
        }
      },
      animation: {
        duration: 500 // shorter animation time
      },
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

// Subscribe to the data and render the visualization
dscc.subscribeToData(drawViz, {transform: dscc.objectTransform});
