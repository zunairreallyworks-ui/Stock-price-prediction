import pandas as pd
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

def save_results(df, actual, predicted, scaler, model_name):
    """
    Saves model predictions and evaluation metrics to files.

    Args:
        df (DataFrame): Original DataFrame used for modeling (with Date index).
        actual (ndarray): Ground truth target values (scaled).
        predicted (ndarray): Model's predicted values (scaled).
        scaler (MinMaxScaler): Scaler used for inverse transformation.
        model_name (str): Prefix for output filenames (e.g., 'aapl_rnn').
    """

    # Step 1: Ensure DataFrame has a datetime index
    if not isinstance(df.index, pd.DatetimeIndex):
        df.index = pd.date_range(start="2020-01-01", periods=len(df), freq="D")

    # Step 2: Force arrays into correct shape
    actual = np.array(actual).reshape(-1, 1)
    predicted = np.array(predicted).reshape(-1, 1)

    # Step 3: Make sure lengths match
    if len(actual) != len(predicted):
        raise ValueError(
            f"Length mismatch: actual={len(actual)}, predicted={len(predicted)}"
        )

    # Step 4: Inverse-transform back to original prices
    actual_prices = scaler.inverse_transform(actual).flatten()
    predicted_prices = scaler.inverse_transform(predicted).flatten()

    # Step 5: Align dates with test-period predictions
    date_index = df.index[-len(actual_prices):]

    # Step 6: Save predictions to CSV
    result_df = pd.DataFrame({
        "Date": date_index.strftime("%Y-%m-%d"),
        "Actual": actual_prices,
        "Predicted": predicted_prices,
    })
    result_df.to_csv(f"static/{model_name}_predictions.csv", index=False)

    # Step 7: Calculate evaluation metrics
    mae = mean_absolute_error(actual_prices, predicted_prices)
    rmse = np.sqrt(mean_squared_error(actual_prices, predicted_prices))
    r2 = r2_score(actual_prices, predicted_prices)

    # Step 8: Save scores
    with open(f"static/{model_name}_scores.txt", "w") as f:
        f.write(f"{mae:.4f},{rmse:.4f},{r2:.4f}")

    # Step 9: Print summary
    print(f"[{model_name.upper()}] Model trained | MAE: {mae:.4f}, RMSE: {rmse:.4f}, R²: {r2:.4f}")