function updateValue() {
  const value = document.getElementById("trainSlider").value;
  document.getElementById("sliderValue").innerText = `${value}% training / ${
    100 - value
  }% prediction`;
}

function sendTrainingSplit() {
  const split = document.getElementById("trainSlider").value;
  const symbol = document.getElementById("symbolSelector")?.value || "AAPL";

  fetch("/train-lstm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ split: split, symbol: symbol }),
  })
    .then((res) => res.json())
    .then(() => {
      alert(`LSTM trained with ${split}% data for ${symbol}`);
      loadLSTMChart(symbol);
    });
}

function loadLSTMChart(symbol = "AAPL") {
  fetch(`/api/lstm-predictions/${symbol}`)
    .then((res) => res.json())
    .then((data) => {
      const ctx = document.getElementById("lstmChart").getContext("2d");

      if (window.lstmChart) {
        window.lstmChart.destroy();
      }

      window.lstmChart = new Chart(ctx, {
        type: "line",
        data: {
          labels: data.Date,
          datasets: [
            {
              label: "Actual Price",
              data: data.Date.map((date, i) => ({
                x: date,
                y: data.Actual[i],
              })),
              borderColor: "rgba(75, 192, 192, 1)",
              pointRadius: 2,
              borderWidth: 2,
              fill: false,
              tension: 0.3,
            },
            {
              label: "Predicted Price",
              data: data.Date.map((date, i) => ({
                x: date,
                y: data.Predicted[i],
              })),
              borderColor: "rgba(255, 99, 132, 1)",
              pointRadius: 2,
              borderWidth: 2,
              fill: false,
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
                displayFormats: {
                  month: "yyyy-MM",
                },
              },
              title: {
                display: true,
                text: "Date",
                color: "#ffffff",
              },
              ticks: {
                color: "#ffffff",
                maxRotation: 45,
                minRotation: 45,
              },
              grid: {
                color: "rgba(255, 255, 255, 0.1)",
              },
            },
            y: {
              title: {
                display: true,
                text: "Stock Price",
                color: "#ffffff",
              },
              ticks: {
                color: "#ffffff",
              },
              grid: {
                color: "rgba(255, 255, 255, 0.1)",
              },
            },
          },
          plugins: {
            legend: {
              labels: {
                color: "#ffffff",
                font: {
                  size: 14,
                },
              },
            },
            zoom: {
              pan: {
                enabled: true,
                mode: "x",
              },
              zoom: {
                wheel: { enabled: true },
                pinch: { enabled: true },
                mode: "x",
              },
            },
          },
        },
      });
    });

  fetch(`/api/lstm-scores/${symbol}`)
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("mae").innerText = data.mae;
      document.getElementById("rmse").innerText = data.rmse;
    });
}

document.addEventListener("DOMContentLoaded", () => {
  loadLSTMChart("AAPL");
});
