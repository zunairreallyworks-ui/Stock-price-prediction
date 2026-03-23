// === Function to update the slider display dynamically ===
function updateValue() {
  const value = document.getElementById("trainSlider").value;
  document.getElementById("sliderValue").innerText = `${value}% training / ${
    100 - value
  }% prediction`;
}

// === Function to save the selected split ratio and stock symbol into local storage ===
function persistSelections() {
  const split = document.getElementById("trainSlider").value;
  const symbol = document.getElementById("symbolSelector").value;
  localStorage.setItem("rnn_selected_symbol", symbol); // Save selected stock symbol
  localStorage.setItem("rnn_selected_split", split);   // Save selected training split
}

// === Function to restore selections from local storage on page load ===
function restoreSelections() {
  const savedSymbol = localStorage.getItem("rnn_selected_symbol") || "AAPL";
  const savedSplit = localStorage.getItem("rnn_selected_split") || "80";

  document.getElementById("symbolSelector").value = savedSymbol;
  document.getElementById("trainSlider").value = savedSplit;
  document.getElementById(
    "sliderValue"
  ).innerText = `${savedSplit}% training / ${100 - savedSplit}% prediction`;

  return savedSymbol; // Return restored symbol
}

// === Function to send training data to the server and retrain the model ===
function sendTrainingSplit() {
  persistSelections(); // Save selections first
  const split = document.getElementById("trainSlider").value;
  const symbol = document.getElementById("symbolSelector").value;

  Chart.getChart("rnnChart")?.destroy(); // Remove existing chart if it exists

  // POST request to retrain the RNN model
  fetch("/train-rnn", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ split, symbol }),
  })
    .then((res) => res.json())
    .then((data) => {
      updateChart(data); // Update the chart with new predictions
    })
    .catch((err) => {
      console.error("Training error:", err);
      alert("Something went wrong while training.");
    });
}

// === Function to create or update the RNN prediction chart ===
function updateChart(data) {
  Chart.getChart("rnnChart")?.destroy(); // Destroy previous chart

  const ctx = document.getElementById("rnnChart").getContext("2d");

  window.rnnChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.Date, // x-axis labels (dates)
      datasets: [
        {
          label: "Actual Price",
          data: data.Date.map((d, i) => ({ x: d, y: data.Actual[i] })),
          borderColor: "rgba(75, 192, 192, 1)", // Teal line for actual price
          pointRadius: 2,
          borderWidth: 2,
          tension: 0.3, // Smooth curves
        },
        {
          label: "Predicted Price",
          data: data.Date.map((d, i) => ({ x: d, y: data.Predicted[i] })),
          borderColor: "rgba(255, 99, 132, 1)", // Red line for predicted price
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
            mode: "x", // Only zoom horizontally
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

  // Update MAE, RMSE, R² values in the info boxes
  document.getElementById("mae").innerText = data.mae;
  document.getElementById("rmse").innerText = data.rmse;
  document.getElementById("r2").innerText = data.r2;
}

// === Function to load saved RNN prediction chart and scores ===
function loadRNNChart(symbol) {
  const timestamp = Date.now(); // Timestamp to force refresh (cache-busting)

  // Fetch saved predictions
  fetch(`/api/rnn-predictions/${symbol}?t=${timestamp}`, {
    cache: "no-store",
  })
    .then((res) => res.json())
    .then(updateChart)
    .catch((err) => {
      console.error("Chart fetch error:", err);
      alert("Failed to load chart.");
    });

  // Fetch saved evaluation scores
  fetch(`/api/rnn-scores/${symbol}?t=${timestamp}`, {
    cache: "no-store",
  })
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("mae").innerText = data.mae;
      document.getElementById("rmse").innerText = data.rmse;
      document.getElementById("r2").innerText = data.r2;
    });
}

// === Setup page behavior once the DOM is fully loaded ===
document.addEventListener("DOMContentLoaded", () => {
  const symbol = restoreSelections(); // Restore previously selected stock and split
  loadRNNChart(symbol); // Load chart and metrics

  // Set event listeners for retraining when user changes options
  document
    .getElementById("trainSlider")
    .addEventListener("change", sendTrainingSplit);
  document
    .getElementById("symbolSelector")
    .addEventListener("change", sendTrainingSplit);
});
