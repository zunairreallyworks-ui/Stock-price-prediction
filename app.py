# === Updated app.py ===
from flask import Flask, render_template, jsonify, request
import pandas as pd
from model import (
    lstm_model,
    cnn_model,
    linear_regression_model,
    svm_model,
    random_forest_model,
)

# Initialize Flask app
app = Flask(__name__)

# === PAGE ROUTES ===

# Homepage route (defaults to deep learning)
@app.route("/")
def home():
    return render_template("deep-learning.html")

# Routes for different model pages
@app.route("/deep-learning")
def deep_learning_page():
    return render_template("deep-learning.html")

@app.route("/ml")
def ml_page():
    return render_template("ml.html")

@app.route("/lstm")
def lstm_page():
    return render_template("lstm.html")

@app.route("/cnn")
def cnn_page():
    return render_template("cnn.html")



@app.route("/linear-regression")
def linear_regression_page():
    return render_template("linear-regression.html")

@app.route("/random-forest")
def random_forest_page():
    return render_template("random-forest.html")

@app.route("/svm")
def svm_page():
    return render_template("svm.html")

# === TRAINING ENDPOINTS ===

# API endpoint to trigger training for a given model
@app.route("/train-<model>", methods=["POST"])
def train_model(model):
    # Read JSON data from request
    data = request.get_json()
    split = int(data.get("split", 80))  # Default split 80%
    symbol = data.get("symbol", "AAPL") # Default stock symbol AAPL

    # Mapping of model names to their respective functions
    model_mapping = {
        "lstm": lstm_model,
        "cnn": cnn_model,
        "lr": linear_regression_model,
        "svm": svm_model,
        "random-forest": random_forest_model,
    }

    if model in model_mapping:
        # Train the selected model
        model_mapping[model].train_model(split, symbol)

        # Determine the correct filename for prediction and scores
        filename_prefix = f"{symbol.lower()}_{model}"
        if model == "random-forest":
            filename_prefix = f"{symbol.lower()}_rf"
        elif model == "svm":
            filename_prefix = f"{symbol.lower()}_svm"

        # Load prediction results
        df = pd.read_csv(f"static/{filename_prefix}_predictions.csv")

        # Load evaluation scores (MAE, RMSE, R²)
        with open(f"static/{filename_prefix}_scores.txt") as f:
            parts = f.read().strip().split(",")
            mae = parts[0]
            rmse = parts[1]
            r2 = parts[2] if len(parts) > 2 else "N/A"

        # Return data as JSON
        return jsonify({
            "Date": df["Date"].tolist(),
            "Actual": df["Actual"].tolist(),
            "Predicted": df["Predicted"].tolist(),
            "mae": mae,
            "rmse": rmse,
            "r2": r2
        })

    # Error if invalid model
    return jsonify({"status": "error", "message": "Invalid model name"}), 400


# === PREDICTION & SCORE API ENDPOINTS ===

# Helper function to create endpoints dynamically for each model
def register_model_api_endpoints(model):
    # Endpoint to fetch predictions
    def get_predictions(symbol):
        df = pd.read_csv(f"static/{symbol.lower()}_{model}_predictions.csv")
        return jsonify(df.to_dict(orient="list"))

    # Endpoint to fetch evaluation scores
    def get_scores(symbol):
        try:
            with open(f"static/{symbol.lower()}_{model}_scores.txt") as f:
                parts = f.read().strip().split(",")
                mae = parts[0]
                rmse = parts[1]
                r2 = parts[2] if len(parts) > 2 else "N/A"
            return jsonify({"mae": mae, "rmse": rmse, "r2": r2})
        except:
            # If file not found, return N/A
            return jsonify({"mae": "N/A", "rmse": "N/A", "r2": "N/A"})

    # Register the prediction and score routes for the model
    app.add_url_rule(
        f"/api/{model}-predictions/<symbol>",
        endpoint=f"{model}_predictions",
        view_func=get_predictions
    )
    app.add_url_rule(
        f"/api/{model}-scores/<symbol>",
        endpoint=f"{model}_scores",
        view_func=get_scores
    )

# Function to register all models with API endpoints
def register_all():
    for model in ["lstm", "cnn", "lr", "svm", "dtree", "rf"]:
        register_model_api_endpoints(model)

# Register endpoints
register_all()

# === DEFAULT API ENDPOINTS ===

# Default CNN predictions (no symbol needed)
@app.route("/api/cnn-predictions")
def get_default_cnn():
    df = pd.read_csv("static/cnn_predictions.csv")
    return jsonify(df.to_dict(orient="list"))

# Default LSTM predictions (no symbol needed)
@app.route("/api/predictions")
def get_default_lstm():
    df = pd.read_csv("static/lstm_predictions.csv")
    return jsonify({
        "Date": df["Date"].tolist(),
        "Actual": df["Actual"].tolist(),
        "Predicted": df["Predicted"].tolist(),
    })

# Default CNN evaluation scores
@app.route("/api/cnn-scores")
def get_default_cnn_scores():
    try:
        with open("static/cnn_scores.txt") as f:
            mae, rmse = f.read().strip().split(",")
        return jsonify({"mae": mae, "rmse": rmse})
    except:
        return jsonify({"mae": "N/A", "rmse": "N/A"})

# Default LSTM evaluation scores
@app.route("/api/lstm-scores")
def get_default_lstm_scores():
    try:
        with open("static/lstm_scores.txt") as f:
            mae, rmse = f.read().strip().split(",")
        return jsonify({"mae": mae, "rmse": rmse})
    except:
        return jsonify({"mae": "N/A", "rmse": "N/A"})

# === RUN APP ===

if __name__ == "__main__":
    # Run the Flask app on port 8000, accessible from all devices
    app.run(host="0.0.0.0", port=8000, debug=True)
