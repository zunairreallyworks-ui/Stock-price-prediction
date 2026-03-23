# === Updated app.py ===
from flask import Flask, render_template, jsonify, request
import pandas as pd
from model import (
    lstm_model,
    rnn_model,
    cnn_model,
    linear_regression_model,
    svm_model,
    decision_tree_model,
    random_forest_model,
)

app = Flask(__name__)

# === PAGES ===
@app.route("/")
def home():
    return render_template("deep-learning.html")

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

@app.route("/rnn")
def rnn_page():
    return render_template("rnn.html")

@app.route("/linear-regression")
def linear_regression_page():
    return render_template("linear-regression.html")

@app.route("/decision-tree")
def decision_tree_page():
    return render_template("decision-tree.html")

@app.route("/random-forest")
def random_forest_page():
    return render_template("random-forest.html")

@app.route("/svm")
def svm_page():
    return render_template("svm.html")

# === TRAINING ENDPOINTS ===
@app.route("/train-<model>", methods=["POST"])
def train_model(model):
    data = request.get_json()
    split = int(data.get("split", 80))
    symbol = data.get("symbol", "AAPL")

    model_mapping = {
    "lstm": lstm_model,
    "rnn": rnn_model,
    "cnn": cnn_model,
    "lr": linear_regression_model,
    "svm": svm_model,
    "dtree": decision_tree_model,
    "rf": random_forest_model,
}


    if model in model_mapping:
        model_mapping[model].train_model(split, symbol)

        df = pd.read_csv(f"static/{symbol.lower()}_{model}_predictions.csv")
        with open(f"static/{symbol.lower()}_{model}_scores.txt") as f:
            mae, rmse = f.read().strip().split(",")

        return jsonify({
            "Date": df["Date"].tolist(),
            "Actual": df["Actual"].tolist(),
            "Predicted": df["Predicted"].tolist(),
            "mae": mae,
            "rmse": rmse
        })

    return jsonify({"status": "error", "message": "Invalid model name"}), 400

# === PREDICTION & SCORE ENDPOINTS ===
def register_model_api_endpoints(model):
    def get_predictions(symbol):
        df = pd.read_csv(f"static/{symbol.lower()}_{model}_predictions.csv")
        return jsonify(df.to_dict(orient="list"))

    def get_scores(symbol):
        try:
            with open(f"static/{symbol.lower()}_{model}_scores.txt") as f:
                mae, rmse = f.read().strip().split(",")
            return jsonify({"mae": mae, "rmse": rmse})
        except:
            return jsonify({"mae": "N/A", "rmse": "N/A"})

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

def register_all():
    for model in ["lstm", "rnn", "cnn", "lr", "svm", "dtree", "rf"]:
        register_model_api_endpoints(model)

register_all()

@app.route("/api/cnn-predictions")
def get_default_cnn():
    df = pd.read_csv("static/cnn_predictions.csv")
    return jsonify(df.to_dict(orient="list"))

@app.route("/api/predictions")
def get_default_lstm():
    df = pd.read_csv("static/lstm_predictions.csv")
    return jsonify({
        "Date": df["Date"].tolist(),
        "Actual": df["Actual"].tolist(),
        "Predicted": df["Predicted"].tolist(),
    })

@app.route("/api/cnn-scores")
def get_default_cnn_scores():
    try:
        with open("static/cnn_scores.txt") as f:
            mae, rmse = f.read().strip().split(",")
        return jsonify({"mae": mae, "rmse": rmse})
    except:
        return jsonify({"mae": "N/A", "rmse": "N/A"})

@app.route("/api/lstm-scores")
def get_default_lstm_scores():
    try:
        with open("static/lstm_scores.txt") as f:
            mae, rmse = f.read().strip().split(",")
        return jsonify({"mae": mae, "rmse": rmse})
    except:
        return jsonify({"mae": "N/A", "rmse": "N/A"})

if __name__ == "__main__":
    app.run(debug=True)
