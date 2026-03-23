function updateValue() {
  const value = document.getElementById("trainSlider").value;
  document.getElementById("sliderValue").innerText = `${value}% training / ${
    100 - value
  }% prediction`;
}

function persistSelections() {
  const split = document.getElementById("trainSlider").value;
  const symbol = document.getElementById("symbolSelector").value;
  localStorage.setItem("lr_selected_symbol", symbol);
  localStorage.setItem("lr_selected_split", split);
}

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

function sendTrainingSplit() {
  alert("d");
  persistSelections();
  const split = document.getElementById("trainSlider").value;
  const symbol = document.getElementById("symbolSelector").value;

  Chart.getChart("lrChart")?.destroy();

  fetch("/train-lr", {
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

  fetch(`/api/lr-scores/${symbol}`)
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("mae").innerText = data.mae;
      document.getElementById("rmse").innerText = data.rmse;
    });
}

function updateChart(data) {
  Chart.getChart("lrChart")?.destroy();

  const ctx = document.getElementById("lrChart").getContext("2d");

  window.lrChart = new Chart(ctx, {
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
      },
    },
  });

  document.getElementById("mae").innerText = data.mae;
  document.getElementById("rmse").innerText = data.rmse;
}

function loadChart(symbol) {
  const timestamp = Date.now();

  fetch(`/api/lr-predictions/${symbol}?t=${timestamp}`, { cache: "no-store" })
    .then((res) => res.json())
    .then(updateChart)
    .catch((err) => {
      console.error("Chart fetch error:", err);
      alert("Failed to load chart.");
    });

  fetch(`/api/lr-scores/${symbol}?t=${timestamp}`, { cache: "no-store" })
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("mae").innerText = data.mae;
      document.getElementById("rmse").innerText = data.rmse;
    });
}

document.addEventListener("DOMContentLoaded", () => {
  const symbol = restoreSelections();
  loadChart(symbol);

  document
    .getElementById("trainSlider")
    .addEventListener("change", sendTrainingSplit);
  document
    .getElementById("symbolSelector")
    .addEventListener("change", sendTrainingSplit);
});
