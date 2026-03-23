function updateValue() {
  const value = document.getElementById("trainSlider").value;
  document.getElementById("sliderValue").innerText = `${value}% training / ${
    100 - value
  }% prediction`;
}

function persistSelections() {
  const split = document.getElementById("trainSlider").value;
  const symbol = document.getElementById("symbolSelector").value;
  localStorage.setItem("lstm_selected_symbol", symbol);
  localStorage.setItem("lstm_selected_split", split);
}

function restoreSelections() {
  const symbol = localStorage.getItem("lstm_selected_symbol") || "AAPL";
  const split = localStorage.getItem("lstm_selected_split") || "80";

  document.getElementById("symbolSelector").value = symbol;
  document.getElementById("trainSlider").value = split;
  document.getElementById("sliderValue").innerText = `${split}% training / ${
    100 - split
  }% prediction`;

  return symbol;
}

function sendTrainingSplit() {
  persistSelections();

  const split = document.getElementById("trainSlider").value;
  const symbol = document.getElementById("symbolSelector").value;

  Chart.getChart("lstmChart")?.destroy();

  fetch("/train-lstm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ split, symbol }),
  })
    .then((res) => res.json())
    .then((data) => {
      updateChart(data);
    })
    .catch((err) => {
      console.error("Training error:", err);
      alert("Something went wrong while training.");
    });

  fetch(`/api/lstm-scores/${symbol}`)
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("mae").innerText = data.mae || "N/A";
      document.getElementById("rmse").innerText = data.rmse || "N/A";
      document.getElementById("r2").innerText = data.r2;
    });
}

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
          borderColor: "rgba(75, 192, 192, 1)",
          pointRadius: 2,
          borderWidth: 2,
          tension: 0.3,
        },
        {
          label: "Predicted Price",
          data: data.Date.map((d, i) => ({ x: d, y: data.Predicted[i] })),
          borderColor: "rgba(255, 99, 132, 1)",
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
      },
    },
  });
}

function loadLSTMChart(symbol) {
  const timestamp = Date.now();

  fetch(`/api/lstm-predictions/${symbol}?t=${timestamp}`, { cache: "no-store" })
    .then((res) => res.json())
    .then(updateChart)
    .catch((err) => {
      console.error("Chart fetch error:", err);
      alert("Failed to load chart.");
    });

  fetch(`/api/lstm-scores/${symbol}?t=${timestamp}`, { cache: "no-store" })
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("mae").innerText = data.mae || "N/A";
      document.getElementById("rmse").innerText = data.rmse || "N/A";
    });
}

document.addEventListener("DOMContentLoaded", () => {
  const symbol = restoreSelections();
  loadLSTMChart(symbol);

  document
    .getElementById("trainSlider")
    .addEventListener("change", sendTrainingSplit);
  document
    .getElementById("symbolSelector")
    .addEventListener("change", sendTrainingSplit);
});
