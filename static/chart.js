// === Function to update slider value display dynamically ===
function updateValue() {
  const value = document.getElementById("trainSlider").value;
  document.getElementById("sliderValue").innerText = `${value}% training / ${
    100 - value
  }% prediction`;
}

// === Function to save selected stock and training split into local storage ===
function persistSelections() {
  const split = document.getElementById("trainSlider").value;
  const symbol = document.getElementById("symbolSelector").value;
  localStorage.setItem("lstm_selected_symbol", symbol);
  localStorage.setItem("lstm_selected_split", split);
}

// === Function to restore selections when page loads ===
function restoreSelections() {
  const symbol = localStorage.getItem("lstm_selected_symbol") || "AAPL";
  const split = localStorage.getItem("lstm_selected_split") || "80";

  document.getElementById("symbolSelector").value = symbol;
  document.getElementById("trainSlider").value = split;
  document.getElementById("sliderValue").innerText = `${split}% training / ${
    100 - split
  }% prediction`;

  return symbol; // Return symbol to load chart for it
}

// === Function to send training request for LSTM model ===
function sendTrainingSplit() {
  persistSelections(); // Save user selections

  const split = document.getElementById("trainSlider").value;
  const symbol = document.getElementById("symbolSelector").value;

  Chart.getChart("lstmChart")?.destroy(); // Destroy existing chart if any

  // Send POST request to train LSTM model
  fetch("/train-lstm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ split, symbol }),
  })
    .then((res) => res.json())
    .then((data) => {
      updateChart(data); // Update chart with new prediction data
    })
    .catch((err) => {
      console.error("Training error:", err);
      alert("Something went wrong while training.");
    });

  // Fetch updated evaluation scores
  fetch(`/api/lstm-scores/${symbol}`)
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("mae").innerText = data.mae || "N/A";
      document.getElementById("rmse").innerText = data.rmse || "N/A";
      document.getElementById("r2").innerText = data.r2 || "N/A";
    });
}

// === Function to create or update LSTM chart ===
function updateChart(data) {
  const ctx = document.getElementById("lstmChart").getContext("2d");

  window.lstmChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.Date,
      datasets: [
        {
          label: "Actual Price",
          data: data.Date.map((d, i) => ({ x: d, y: data.Actual[i] })),
          borderColor: "rgba(75, 192, 192, 1)", // Teal line
          pointRadius: 2,
          borderWidth: 2,
          tension: 0.3,
        },
        {
          label: "Predicted Price",
          data: data.Date.map((d, i) => ({ x: d, y: data.Predicted[i] })),
          borderColor: "rgba(255, 99, 132, 1)", // Red line
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
            displayFormats: { month: "MMM yyyy" },
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
}

// === Function to load existing LSTM predictions and evaluation scores ===
function loadLSTMChart(symbol) {
  const timestamp = Date.now(); // Cache buster

  // Fetch saved predictions
  fetch(`/api/lstm-predictions/${symbol}?t=${timestamp}`, { cache: "no-store" })
    .then((res) => res.json())
    .then(updateChart)
    .catch((err) => {
      console.error("Chart fetch error:", err);
      alert("Failed to load chart.");
    });

  // Fetch saved evaluation scores
  fetch(`/api/lstm-scores/${symbol}?t=${timestamp}`, { cache: "no-store" })
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("mae").innerText = data.mae || "N/A";
      document.getElementById("rmse").innerText = data.rmse || "N/A";
      document.getElementById("r2").innerText = data.r2 || "N/A";
    });
}

// === Setup page once DOM is fully loaded ===
document.addEventListener("DOMContentLoaded", () => {
  const symbol = restoreSelections(); // Restore previously selected stock
  loadLSTMChart(symbol); // Load chart and scores

  // Set listeners to retrain when user changes options
  document
    .getElementById("trainSlider")
    .addEventListener("change", sendTrainingSplit);
  document
    .getElementById("symbolSelector")
    .addEventListener("change", sendTrainingSplit);
});
