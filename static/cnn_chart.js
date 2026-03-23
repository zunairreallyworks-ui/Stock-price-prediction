// === Function to update the slider value display dynamically ===
function updateValue() {
  const value = document.getElementById("trainSlider").value;
  document.getElementById("sliderValue").innerText = `${value}% training / ${
    100 - value
  }% prediction`;
}

// === Function to save user's selections (split and symbol) to local storage ===
function persistSelections() {
  const split = document.getElementById("trainSlider").value;
  const symbol = document.getElementById("symbolSelector").value;
  localStorage.setItem("cnn_selected_symbol", symbol);
  localStorage.setItem("cnn_selected_split", split);
}

// === Function to restore saved selections when page reloads ===
function restoreSelections() {
  const savedSymbol = localStorage.getItem("cnn_selected_symbol") || "AAPL";
  const savedSplit = localStorage.getItem("cnn_selected_split") || "80";

  document.getElementById("symbolSelector").value = savedSymbol;
  document.getElementById("trainSlider").value = savedSplit;
  document.getElementById(
    "sliderValue"
  ).innerText = `${savedSplit}% training / ${100 - savedSplit}% prediction`;

  return savedSymbol;
}

// === Function to send training request for the CNN model ===
function sendTrainingSplit() {
  persistSelections(); // Save user selections

  const split = document.getElementById("trainSlider").value;
  const symbol = document.getElementById("symbolSelector").value;

  Chart.getChart("cnnChart")?.destroy(); // Destroy any existing chart

  // POST request to train CNN model
  fetch("/train-cnn", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ split, symbol }),
  })
    .then((res) => res.json())
    .then((data) => {
      updateChart(data); // Update chart with new prediction results
    })
    .catch((err) => {
      console.error("Training error:", err);
      alert("Something went wrong while training.");
    });

  // Fetch updated evaluation scores
  fetch(`/api/cnn-scores/${symbol}`)
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("mae").innerText = data.mae;
      document.getElementById("rmse").innerText = data.rmse;
      document.getElementById("r2").innerText = data.r2;
    });
}

// === Function to create or update CNN prediction chart ===
function updateChart(data) {
  Chart.getChart("cnnChart")?.destroy(); // Clear any existing chart

  const ctx = document.getElementById("cnnChart").getContext("2d");

  window.cnnChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.Date, // x-axis labels are dates
      datasets: [
        {
          label: "Actual Price",
          data: data.Date.map((d, i) => ({ x: d, y: data.Actual[i] })),
          borderColor: "rgba(75, 192, 192, 1)", // Teal for actual prices
          pointRadius: 2,
          borderWidth: 2,
          tension: 0.3,
        },
        {
          label: "Predicted Price",
          data: data.Date.map((d, i) => ({ x: d, y: data.Predicted[i] })),
          borderColor: "rgba(255, 99, 132, 1)", // Red for predicted prices
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
            mode: "x",
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

  // Update displayed evaluation metrics (MAE, RMSE, R²)
  document.getElementById("mae").innerText = data.mae;
  document.getElementById("rmse").innerText = data.rmse;
  document.getElementById("r2").innerText = data.r2;
}

// === Function to load previous CNN prediction and evaluation scores ===
function loadCNNChart(symbol) {
  const timestamp = Date.now(); // Cache buster

  // Fetch saved CNN predictions
  fetch(`/api/cnn-predictions/${symbol}?t=${timestamp}`, { cache: "no-store" })
    .then((res) => res.json())
    .then(updateChart)
    .catch((err) => {
      console.error("Chart fetch error:", err);
      alert("Failed to load chart.");
    });

  // Fetch saved evaluation metrics
  fetch(`/api/cnn-scores/${symbol}?t=${timestamp}`, { cache: "no-store" })
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("mae").innerText = data.mae;
      document.getElementById("rmse").innerText = data.rmse;
      document.getElementById("r2").innerText = data.r2;
    });
}

// === Setup event listeners after page fully loads ===
document.addEventListener("DOMContentLoaded", () => {
  const symbol = restoreSelections(); // Restore previously selected symbol
  loadCNNChart(symbol); // Load chart and scores

  // Add listeners to slider and stock selector
  document
    .getElementById("trainSlider")
    .addEventListener("change", sendTrainingSplit);
  document
    .getElementById("symbolSelector")
    .addEventListener("change", sendTrainingSplit);
});
