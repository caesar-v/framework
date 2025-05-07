/**
 * Analytics Module
 * Handles loading and processing analytics data and generating charts
 */

// To use charts, we need to include the Chart.js library in our HTML
// This should be included before this module is loaded

/**
 * Load analytics data for the specified date range
 * @param {string} dateRange - Date range to load data for (today, week, month, all)
 * @returns {Object} Object containing analytics data
 */
export function loadAnalytics(dateRange = 'week') {
  try {
    // Try to get data from GameAPI if available
    if (window.gameAPI && window.gameAPI.getAnalytics) {
      return window.gameAPI.getAnalytics(dateRange);
    }
    
    // Fall back to mock data for demo purposes
    return getMockAnalyticsData(dateRange);
  } catch (error) {
    console.error('Error loading analytics data:', error);
    return getMockAnalyticsData(dateRange);
  }
}

/**
 * Generate charts using the provided analytics data
 * @param {Object} analyticsData - Analytics data to generate charts from
 */
export function generateCharts(analyticsData) {
  try {
    // Make sure we have Chart.js available
    if (typeof Chart === 'undefined') {
      console.error('Chart.js not loaded. Please include Chart.js in your HTML.');
      loadChartJsLibrary();
      return;
    }
    
    // Generate popularity chart
    generatePopularityChart(analyticsData.popularity);
    
    // Generate win/loss chart
    generateWinLossChart(analyticsData.winLoss);
    
    // Generate bet size chart
    generateBetSizeChart(analyticsData.betSize);
    
    // Generate session length chart
    generateSessionLengthChart(analyticsData.sessionLength);
  } catch (error) {
    console.error('Error generating charts:', error);
  }
}

/**
 * Generate game popularity chart
 * @param {Object} popularityData - Game popularity data
 */
function generatePopularityChart(popularityData) {
  const ctx = document.getElementById('popularity-chart');
  if (!ctx) return;
  
  // Destroy existing chart if any
  const existingChart = Chart.getChart(ctx);
  if (existingChart) {
    existingChart.destroy();
  }
  
  // Create new chart
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: popularityData.labels,
      datasets: [{
        data: popularityData.data,
        backgroundColor: [
          'rgba(44, 123, 229, 0.7)',
          'rgba(0, 217, 126, 0.7)',
          'rgba(246, 195, 67, 0.7)',
          'rgba(57, 175, 209, 0.7)',
          'rgba(230, 55, 87, 0.7)'
        ],
        borderColor: [
          'rgba(44, 123, 229, 1)',
          'rgba(0, 217, 126, 1)',
          'rgba(246, 195, 67, 1)',
          'rgba(57, 175, 209, 1)',
          'rgba(230, 55, 87, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

/**
 * Generate win/loss chart
 * @param {Object} winLossData - Win/loss data
 */
function generateWinLossChart(winLossData) {
  const ctx = document.getElementById('winloss-chart');
  if (!ctx) return;
  
  // Destroy existing chart if any
  const existingChart = Chart.getChart(ctx);
  if (existingChart) {
    existingChart.destroy();
  }
  
  // Create new chart
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: winLossData.labels,
      datasets: [
        {
          label: 'Wins',
          data: winLossData.wins,
          backgroundColor: 'rgba(0, 217, 126, 0.7)',
          borderColor: 'rgba(0, 217, 126, 1)',
          borderWidth: 1
        },
        {
          label: 'Losses',
          data: winLossData.losses,
          backgroundColor: 'rgba(230, 55, 87, 0.7)',
          borderColor: 'rgba(230, 55, 87, 1)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      },
      plugins: {
        legend: {
          position: 'top'
        }
      }
    }
  });
}

/**
 * Generate bet size chart
 * @param {Object} betSizeData - Bet size data
 */
function generateBetSizeChart(betSizeData) {
  const ctx = document.getElementById('bet-size-chart');
  if (!ctx) return;
  
  // Destroy existing chart if any
  const existingChart = Chart.getChart(ctx);
  if (existingChart) {
    existingChart.destroy();
  }
  
  // Create new chart
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: betSizeData.labels,
      datasets: [
        {
          label: 'Average Bet Size',
          data: betSizeData.data,
          backgroundColor: 'rgba(57, 175, 209, 0.2)',
          borderColor: 'rgba(57, 175, 209, 1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      },
      plugins: {
        legend: {
          position: 'top'
        }
      }
    }
  });
}

/**
 * Generate session length chart
 * @param {Object} sessionLengthData - Session length data
 */
function generateSessionLengthChart(sessionLengthData) {
  const ctx = document.getElementById('session-length-chart');
  if (!ctx) return;
  
  // Destroy existing chart if any
  const existingChart = Chart.getChart(ctx);
  if (existingChart) {
    existingChart.destroy();
  }
  
  // Create new chart
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: sessionLengthData.labels,
      datasets: [
        {
          label: 'Average Session Length (min)',
          data: sessionLengthData.data,
          backgroundColor: 'rgba(246, 195, 67, 0.2)',
          borderColor: 'rgba(246, 195, 67, 1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      },
      plugins: {
        legend: {
          position: 'top'
        }
      }
    }
  });
}

/**
 * Load Chart.js library dynamically
 */
function loadChartJsLibrary() {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
  script.onload = () => {
    console.log('Chart.js loaded successfully');
    
    // Retry generating charts once the library is loaded
    generateCharts(loadAnalytics());
  };
  script.onerror = () => {
    console.error('Failed to load Chart.js library');
  };
  document.head.appendChild(script);
}

/**
 * Get mock analytics data for demo purposes
 * @param {string} dateRange - Date range to get data for
 * @returns {Object} Object containing mock analytics data
 */
function getMockAnalyticsData(dateRange) {
  // Multiplier to scale data based on the date range
  let multiplier = 1;
  let dataPoints = 7;
  let dateLabels = [];
  
  // Determine how many data points and scale based on date range
  switch (dateRange) {
    case 'today':
      multiplier = 0.2;
      dataPoints = 24;
      // Generate hourly labels for today
      for (let i = 0; i < dataPoints; i++) {
        const hour = i % 12 || 12;
        const ampm = i < 12 ? 'AM' : 'PM';
        dateLabels.push(`${hour}${ampm}`);
      }
      break;
      
    case 'week':
      multiplier = 1;
      dataPoints = 7;
      // Generate daily labels for last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dateLabels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
      }
      break;
      
    case 'month':
      multiplier = 4;
      dataPoints = 30;
      // Generate daily labels for last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dateLabels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      }
      break;
      
    case 'all':
      multiplier = 12;
      dataPoints = 12;
      // Generate monthly labels for last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        dateLabels.push(date.toLocaleDateString('en-US', { month: 'short' }));
      }
      break;
  }
  
  // Mock game popularity data
  const popularityData = {
    labels: ['Dice Game', 'Card Game', 'Slot Machine', 'Other'],
    data: [125 * multiplier, 87 * multiplier, 45 * multiplier, 23 * multiplier]
  };
  
  // Mock win/loss data
  const winLossData = {
    labels: dateLabels,
    wins: Array(dataPoints).fill().map(() => Math.round(Math.random() * 25 * multiplier)),
    losses: Array(dataPoints).fill().map(() => Math.round(Math.random() * 35 * multiplier))
  };
  
  // Mock bet size data
  const betSizeData = {
    labels: dateLabels,
    data: Array(dataPoints).fill().map(() => Math.round((10 + Math.random() * 20) * multiplier))
  };
  
  // Mock session length data
  const sessionLengthData = {
    labels: dateLabels,
    data: Array(dataPoints).fill().map(() => Math.round((3 + Math.random() * 12) * multiplier) / multiplier)
  };
  
  // Mock game stats
  const gameStats = [
    {
      name: 'Dice Game',
      sessions: Math.round(125 * multiplier),
      totalBets: Math.round(450 * multiplier),
      winRate: 0.42,
      avgBet: 10.5,
      totalWon: Math.round(980 * multiplier),
      totalLost: Math.round(1250 * multiplier)
    },
    {
      name: 'Card Game',
      sessions: Math.round(87 * multiplier),
      totalBets: Math.round(350 * multiplier),
      winRate: 0.37,
      avgBet: 25.2,
      totalWon: Math.round(1600 * multiplier),
      totalLost: Math.round(2175 * multiplier)
    },
    {
      name: 'Slot Machine',
      sessions: Math.round(45 * multiplier),
      totalBets: Math.round(200 * multiplier),
      winRate: 0.32,
      avgBet: 8.7,
      totalWon: Math.round(560 * multiplier),
      totalLost: Math.round(870 * multiplier)
    }
  ];
  
  return {
    popularity: popularityData,
    winLoss: winLossData,
    betSize: betSizeData,
    sessionLength: sessionLengthData,
    gameStats: gameStats
  };
}