import pandas as pd
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error

def save_results(df, actual, predicted, scaler, model_name):
    """
    Saves RNN/CNN/LSTM results into a predictions CSV and scores TXT file.

    Args:
        df (DataFrame): Original DataFrame used for modeling (with Date index).
        actual (ndarray): Ground truth target values (scaled).
        predicted (ndarray): Model's predicted values (scaled).
        scaler (MinMaxScaler): Scaler to inverse-transform the data.
        model_name (str): Prefix for output filenames (e.g., 'aapl_rnn').
    """

    # ✅ Ensure the index is datetime (fallback if not)
    if not isinstance(df.index, pd.DatetimeIndex):
        df.index = pd.date_range(start="2020-01-01", periods=len(df), freq="D")

    # ✅ Inverse transform predictions and ground truth
    actual_prices = scaler.inverse_transform(actual.reshape(-1, 1)).flatten()
    predicted_prices = scaler.inverse_transform(predicted.reshape(-1, 1)).flatten()

    # ✅ Use the last N dates matching y/prediction length
    date_index = df.index[-len(actual):]

    # ✅ Create and save the predictions DataFrame
    result_df = pd.DataFrame({
        'Date': date_index.strftime('%Y-%m-%d'),
        'Actual': actual_prices,
        'Predicted': predicted_prices,
    })

    result_df.to_csv(f"static/{model_name}_predictions.csv", index=False)

    # ✅ Calculate and save metrics
    mae = mean_absolute_error(actual_prices, predicted_prices)
    rmse = np.sqrt(mean_squared_error(actual_prices, predicted_prices))

    with open(f"static/{model_name}_scores.txt", "w") as f:
        f.write(f"{mae:.4f},{rmse:.4f}")

    print(f"[{model_name.upper()}] Model trained | MAE: {mae:.4f}, RMSE: {rmse:.4f}")
