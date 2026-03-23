// === Function to update the slider value display ===
function updateValue() {
  const value = document.getElementById("trainSlider").value;
  document.getElementById("sliderValue").innerText = `${value}% training / ${
    100 - value
  }% prediction`;
}

// === Function to save selected split and stock symbol to local storage ===
function persistSelections() {
  const split = document.getElementById("trainSlider").value;
  const symbol = document.getElementById("symbolSelector").value;
  localStorage.setItem("svm_selected_symbol", symbol);
  localStorage.setItem("svm_selected_split", split);
}

// === Function to restore selections from local storage when page reloads ===
function restoreSelections() {
  const savedSymbol = localStorage.getItem("svm_selected_symbol") || "AAPL";
  const savedSplit = localStorage.getItem("svm_selected_split") || "80";

  document.getElementById("symbolSelector").value = savedSymbol;
  document.getElementById("trainSlider").value = savedSplit;
  document.getElementById(
    "sliderValue"
  ).innerText = `${savedSplit}% training / ${100 - savedSplit}% prediction`;

  return savedSymbol;
}

// === Function to send training request to the server with selected parameters ===
function sendTrainingSplit() {
  persistSelections(); // Save user selections
  const split = document.getElementById("trainSlider").value;
  const symbol = document.getElementById("symbolSelector").value;

  Chart.getChart("svmChart")?.destroy(); // Destroy existing chart if exists

  // POST request to retrain the SVM model
  fetch("/train-svm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ split, symbol }),
  })
    .then((res) => res.json())
    .then((data) => {
      updateChart(data); // Update chart with new predictions and scores
    })
    .catch((err) => {
      console.error("Training error:", err);
      alert("Something went wrong while training.");
    });
}

// === Function to create or update the SVM prediction chart ===
function updateChart(data) {
  Chart.getChart("svmChart")?.destroy(); // Clear previous chart

  const ctx = document.getElementById("svmChart").getContext("2d");

  window.svmChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.Date, // x-axis dates
      datasets: [
        {
          label: "Actual Price",
          data: data.Date.map((d, i) => ({ x: d, y: data.Actual[i] })),
          borderColor: "rgba(75, 192, 192, 1)", // Teal line for actual prices
          pointRadius: 2,
          borderWidth: 2,
          tension: 0.3,
        },
        {
          label: "Predicted Price",
          data: data.Date.map((d, i) => ({ x: d, y: data.Predicted[i] })),
          borderColor: "rgba(255, 99, 132, 1)", // Red line for predicted prices
          pointRadius: 2,
          borderWidth: 2,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: {
          type: "time",
          time: {
            unit: "month",
            tooltipFormat: "MMM yyyy",
            displayFormats: { month: "yyyy-MM" },
          },
          title: { display: true, text: "Date", color: "#ffffff" },
          ticks: { color: "#ffffff" },
          grid: { color: "rgba(255, 255, 255, 0.1)" },
        },
        y: {
          title: { display: true, text: "Stock Price", color: "#ffffff" },
          ticks: { color: "#ffffff" },
          grid: { color: "rgba(255, 255, 255, 0.1)" },
        },
      },
      plugins: {
        legend: {
          labels: {
            color: "#ffffff",
            font: { size: 14 },
          },
        },
        zoom: {
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: "x", // Horizontal zoom only
          },
          pan: {
            enabled: true,
            mode: "x",
          },
          limits: {
            x: { min: "original", max: "original" },
            y: { min: "original", max: "original" },
          },
        },
      },
    },
  });

  // Update displayed metrics: MAE, RMSE, R²
  document.getElementById("mae").innerText = data.mae;
  document.getElementById("rmse").innerText = data.rmse;
  document.getElementById("r2").innerText = data.r2;
}

// === Function to load previous SVM predictions and evaluation scores ===
function loadChart(symbol) {
  const timestamp = Date.now(); // Cache buster

  // Fetch predictions
  fetch(`/api/svm-predictions/${symbol}?t=${timestamp}`, { cache: "no-store" })
    .then((res) => res.json())
    .then(updateChart)
    .catch((err) => {
      console.error("Chart fetch error:", err);
      alert("Failed to load chart.");
    });

  // Fetch evaluation metrics
  fetch(`/api/svm-scores/${symbol}?t=${timestamp}`, { cache: "no-store" })
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("mae").innerText = data.mae;
      document.getElementById("rmse").innerText = data.rmse;
      document.getElementById("r2").innerText = data.r2;
    });
}

// === Setup page behavior after DOM is fully loaded ===
document.addEventListener("DOMContentLoaded", () => {
  const symbol = restoreSelections(); // Restore previous selections
  loadChart(symbol); // Load chart and scores

  // Add live updating behavior to slider and stock selector
  document
    .getElementById("trainSlider")
    .addEventListener("change", () => updateValue());
  document
    .getElementById("symbolSelector")
    .addEventListener("change", () => updateValue());
});
