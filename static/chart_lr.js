// === Function to update slider display dynamically ===
function updateValue() {
  const value = document.getElementById("trainSlider").value;
  document.getElementById("sliderValue").innerText = `${value}% training / ${
    100 - value
  }% prediction`;
}

// === Function to save user's selections to local storage ===
function persistSelections() {
  const split = document.getElementById("trainSlider").value;
  const symbol = document.getElementById("symbolSelector").value;
  localStorage.setItem("lr_selected_symbol", symbol);
  localStorage.setItem("lr_selected_split", split);
}

// === Function to restore user's selections when page reloads ===
function restoreSelections() {
  const savedSymbol = localStorage.getItem("lr_selected_symbol") || "AAPL";
  const savedSplit = localStorage.getItem("lr_selected_split") || "80";

  document.getElementById("symbolSelector").value = savedSymbol;
  document.getElementById("trainSlider").value = savedSplit;
  document.getElementById(
    "sliderValue"
  ).innerText = `${savedSplit}% training / ${100 - savedSplit}% prediction`;

  return savedSymbol;
}

// === Function to send the selected training split and symbol to the server ===
function sendTrainingSplit() {
  persistSelections(); // Save user choices
  const split = document.getElementById("trainSlider").value;
  const symbol = document.getElementById("symbolSelector").value;

  // Destroy old chart before updating
  Chart.getChart("lrChart")?.destroy();

  // Send POST request to train the selected model
  fetch("/train-lr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ split, symbol }),
  })
    .then((res) => res.json())
    .then((data) => {
      updateChart(data); // Update chart with new data
    })
    .catch((err) => {
      console.error("Training error:", err);
      alert("Something went wrong while training.");
    });

  // Fetch evaluation scores after training
  fetch(`/api/lr-scores/${symbol}`)
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("mae").innerText = data.mae;
      document.getElementById("rmse").innerText = data.rmse;
      document.getElementById("r2").innerText = data.r2;
    });
}

// === Function to update or redraw the chart with new prediction results ===
function updateChart(data) {
  Chart.getChart("lrChart")?.destroy(); // Remove existing chart

  const ctx = document.getElementById("lrChart").getContext("2d");

  // Create new line chart with Actual vs Predicted data
  window.lrChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.Date, // x-axis dates
      datasets: [
        {
          label: "Actual Price",
          data: data.Date.map((d, i) => ({ x: d, y: data.Actual[i] })),
          borderColor: "rgba(75, 192, 192, 1)", // Teal color
          pointRadius: 2,
          borderWidth: 2,
          tension: 0.3, // Smooth line
        },
        {
          label: "Predicted Price",
          data: data.Date.map((d, i) => ({ x: d, y: data.Predicted[i] })),
          borderColor: "rgba(255, 99, 132, 1)", // Red color
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

  // Update displayed evaluation metrics
  document.getElementById("mae").innerText = data.mae;
  document.getElementById("rmse").innerText = data.rmse;
  document.getElementById("r2").innerText = data.r2;
}

// === Function to load existing chart and scores on page load ===
function loadChart(symbol) {
  const timestamp = Date.now(); // Cache-busting with timestamp

  // Fetch saved predictions
  fetch(`/api/lr-predictions/${symbol}?t=${timestamp}`, {
    cache: "no-store",
  })
    .then((res) => res.json())
    .then(updateChart)
    .catch((err) => {
      console.error("Chart fetch error:", err);
      alert("Failed to load chart.");
    });

  // Fetch saved evaluation scores
  fetch(`/api/lr-scores/${symbol}?t=${timestamp}`, {
    cache: "no-store",
  })
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("mae").innerText = data.mae;
      document.getElementById("rmse").innerText = data.rmse;
      document.getElementById("r2").innerText = data.r2;
    });
}

// === Set up page on DOMContentLoaded (page fully loaded) ===
document.addEventListener("DOMContentLoaded", () => {
  const symbol = restoreSelections(); // Restore previously selected stock symbol
  loadChart(symbol); // Load chart with restored symbol

  // These are commented out, could be re-enabled if you want instant retraining
  // document
  //   .getElementById("trainSlider")
  //   .addEventListener("change", sendTrainingSplit);
  // document
  //   .getElementById("symbolSelector")
  //   .addEventListener("change", sendTrainingSplit);
});
