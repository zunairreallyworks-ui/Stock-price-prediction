import yfinance as yf
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
import os

def load_and_prepare_data(symbol="AAPL", sequence_length=60):
    """
    Load stock data, preprocess it, and create sequences for time series forecasting.

    Args:
        symbol (str): Stock symbol (e.g., "AAPL", "NVDA", "SP500").
        sequence_length (int): Number of previous time steps to use for each prediction.

    Returns:
        df (DataFrame): Cleaned stock price dataframe indexed by Date.
        scaler (MinMaxScaler): Scaler used to normalize the Close prices.
        X (ndarray): Input sequences with shape (samples, timesteps, features).
        y (ndarray): Target outputs with shape (samples,).
    """

    SYMBOL_MAP = {
        "SP500": "^GSPC",
        "AAPL": "AAPL",
        "NVDA": "NVDA",
    }

    symbol = symbol.upper()
    yahoo_symbol = SYMBOL_MAP.get(symbol, symbol)
    file_path = f"data/{symbol.lower()}.csv"

    os.makedirs("data", exist_ok=True)

    def download_and_save():
        print(f"[INFO] Downloading fresh data for {symbol} (Yahoo symbol: {yahoo_symbol})...")
        df_dl = yf.Ticker(yahoo_symbol).history(period="5y")

        if df_dl.empty:
            raise ValueError(f"[ERROR] Downloaded data for {symbol} is empty.")

        df_save = df_dl.reset_index()[["Date", "Close"]].copy()
        df_save["Date"] = pd.to_datetime(df_save["Date"], errors="coerce")
        df_save["Close"] = pd.to_numeric(df_save["Close"], errors="coerce")
        df_save.dropna(subset=["Date", "Close"], inplace=True)
        df_save.sort_values("Date", inplace=True)
        df_save.to_csv(file_path, index=False)
        return df_save

    try:
        if not os.path.isfile(file_path) or os.path.getsize(file_path) == 0:
            raise FileNotFoundError("CSV file missing or empty.")

        df = pd.read_csv(file_path)

        if df.empty or "Date" not in df.columns or "Close" not in df.columns:
            raise ValueError("Invalid CSV structure.")
    except (FileNotFoundError, ValueError) as e:
        print(f"[WARNING] {e} Downloading fresh data...")
        df = download_and_save()

    df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
    df["Close"] = pd.to_numeric(df["Close"], errors="coerce")
    df.dropna(subset=["Date", "Close"], inplace=True)
    df.sort_values("Date", inplace=True)
    df.drop_duplicates(subset=["Date"], keep="last", inplace=True)
    df.set_index("Date", inplace=True)

    if len(df) < sequence_length + 1:
        raise ValueError(f"[ERROR] Not enough data for {symbol} after cleaning.")

    scaler = MinMaxScaler()
    scaled = scaler.fit_transform(df[["Close"]])

    X, y = [], []
    for i in range(sequence_length, len(scaled)):
        X.append(scaled[i - sequence_length:i, 0])
        y.append(scaled[i, 0])

    X = np.array(X, dtype=np.float32).reshape(-1, sequence_length, 1)
    y = np.array(y, dtype=np.float32)

    return df, scaler, X, y