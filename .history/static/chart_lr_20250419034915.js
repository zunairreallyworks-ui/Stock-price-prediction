function loadLRChart(symbol = "AAPL") {
  fetch(`/api/lr-predictions/${symbol}`)
    .then((res) => res.json())
    .then((data) => {
      const ctx = document.getElementById("lrChart").getContext("2d");

      if (window.lrChartInstance) {
        window.lrChartInstance.destroy();
      }

      window.lrChartInstance = new Chart(ctx, {
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
          },
        },
      });
    });

  fetch(`/api/lr-scores/${symbol}`)
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("mae").innerText = data.mae;
      document.getElementById("rmse").innerText = data.rmse;
    });
}

// Example call (e.g. after clicking a button or loading the page)
document.addEventListener("DOMContentLoaded", () => {
  loadLRChart("AAPL");
});
