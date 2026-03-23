fetch("/api/transformer-predictions")
  .then((res) => res.json())
  .then((data) => {
    const ctx = document.getElementById("transformerChart").getContext("2d");

    new Chart(ctx, {
      type: "line",
      data: {
        labels: data.Date,
        datasets: [
          {
            label: "Actual Price",
            data: data.Actual,
            borderColor: "rgba(75, 192, 192, 1)",
            fill: false,
          },
          {
            label: "Predicted Price",
            data: data.Predicted,
            borderColor: "rgba(255, 99, 132, 1)",
            fill: false,
          },
        ],
      },
      options: {
        scales: {
          x: {
            ticks: {
              callback: function (value, index) {
                return index % 2 === 0 ? this.getLabelForValue(value) : "";
              },
              font: {
                size: 14,
                weight: "bold",
              },
              color: "black",
            },
            title: {
              display: true,
              text: "Date",
              color: "black",
            },
          },
          y: {
            ticks: {
              color: "black",
            },
            title: {
              display: true,
              text: "Stock Price",
              color: "black",
            },
          },
        },
      },
    });
  });

fetch("/api/transformer-scores")
  .then((res) => res.json())
  .then((data) => {
    document.getElementById("mae").innerText = data.mae;
    document.getElementById("rmse").innerText = data.rmse;
  });
