import pandas as pd 
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

def save_results(df, actual, predicted, scaler, model_name):
    """
    Saves model results into a predictions CSV and scores TXT file,
    including MAE, RMSE, and R² score.

    Args:
        df (DataFrame): Original DataFrame used for modeling (with Date index).
        actual (ndarray): Ground truth target values (scaled).
        predicted (ndarray): Model's predicted values (scaled).
        scaler (MinMaxScaler): Scaler to inverse-transform the data.
        model_name (str): Prefix for output filenames (e.g., 'aapl_rnn').
    """

    # ✅ Ensure datetime index exists
    if not isinstance(df.index, pd.DatetimeIndex):
        df.index = pd.date_range(start="2020-01-01", periods=len(df), freq="D")

    # ✅ Inverse transform values
    actual_prices = scaler.inverse_transform(actual.reshape(-1, 1)).flatten()
    predicted_prices = scaler.inverse_transform(predicted.reshape(-1, 1)).flatten()

    # ✅ Date range for output
    date_index = df.index[-len(actual):]

    # ✅ Save predictions
    result_df = pd.DataFrame({
        'Date': date_index.strftime('%Y-%m-%d'),
        'Actual': actual_prices,
        'Predicted': predicted_prices,
    })
    result_df.to_csv(f"static/{model_name}_predictions.csv", index=False)

    # ✅ Metrics
    mae = mean_absolute_error(actual_prices, predicted_prices)
    rmse = np.sqrt(mean_squared_error(actual_prices, predicted_prices))
    r2 = r2_score(actual_prices, predicted_prices)

    # ✅ Save scores including R²
    with open(f"static/{model_name}_scores.txt", "w") as f:
        f.write(f"{mae:.4f},{rmse:.4f},{r2:.4f}")

    print(f"[{model_name.upper()}] Model trained | MAE: {mae:.4f}, RMSE: {rmse:.4f}, R²: {r2:.4f}")
