// Include required libraries
const dscc = require('@google/dscc');

// Dynamically load Chart.js
function loadChartJs() {
  return new Promise((resolve, reject) => {
    if (window.Chart) {
      resolve(window.Chart);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@2.9.4/dist/Chart.min.js';
    script.onload = () => resolve(window.Chart);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Helper function to convert color codes from hex to rgba
function hexToRGB(hex, alpha) {
  // Existing code...
}

// Function to format large numbers
function formatNumber(value, metricType) {
  // Existing code...
}

// Create and draw the radar chart
async function drawViz(data) {
  // Load Chart.js first
  await loadChartJs();
  
  // The rest of your drawViz function remains the same
  // Create container element if it doesn't exist
  // ...existing code...
}

// Subscribe to the data and render the visualization
dscc.subscribeToData(drawViz, {transform: dscc.objectTransform});
