function updateValue() {
  const value = document.getElementById("trainSlider").value;
  document.getElementById("sliderValue").innerText = `${value}% training / ${
    100 - value
  }% prediction`;
}

function sendTrainingSplit() {
  const split = document.getElementById("trainSlider").value;
  const symbol = document.getElementById("symbolSelector").value;

  fetch("/train-lstm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ split, symbol }),
  })
    .then((res) => res.json())
    .then(() => {
      alert(`LSTM trained with ${split}% data on ${symbol}`);
      loadChart(symbol);
    })
    .catch((err) => {
      console.error("Training error:", err);
      alert("Training failed!");
    });
}

function loadChart(symbol = "AAPL") {
  fetch(`/api/lstm-predictions/${symbol}`)
    .then((res) => res.json())
    .then((data) => {
      const ctx = document.getElementById("lstmChart").getContext("2d");
      if (window.lstmChart) window.lstmChart.destroy();

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
    });

  fetch(`/api/lstm-scores/${symbol}`)
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("mae").innerText = data.mae;
      document.getElementById("rmse").innerText = data.rmse;
    });
}

document.addEventListener("DOMContentLoaded", () => {
  loadChart("AAPL");
});
