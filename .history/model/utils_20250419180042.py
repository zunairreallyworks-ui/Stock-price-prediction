import yfinance as yf
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
import os

def load_and_prepare_data(symbol="AAPL", sequence_length=60):
    # Map user-friendly symbols to Yahoo Finance tickers
    SYMBOL_MAP = {
        "SP500": "^GSPC",
        "AAPL": "AAPL",
        "NVDA": "NVDA"
    }

    yahoo_symbol = SYMBOL_MAP.get(symbol.upper(), symbol.upper())
    file_path = f"data/{symbol.lower()}.csv"

    # Ensure data folder exists
    os.makedirs("data", exist_ok=True)

    def download_and_save():
        print(f"[INFO] Downloading fresh data for {symbol} (Yahoo symbol: {yahoo_symbol})...")
        df_dl = yf.Ticker(yahoo_symbol).history(period="5y")
        if df_dl.empty:
            raise ValueError(f"[ERROR] Downloaded data for {symbol} is empty.")

        df_save = df_dl.reset_index()[['Date', 'Close']]
        df_save.to_csv(file_path, index=False)
        return df_save

    try:
        if not os.path.isfile(file_path) or os.path.getsize(file_path) == 0:
            raise FileNotFoundError
        df = pd.read_csv(file_path)
        if "Date" not in df.columns or "Close" not in df.columns or df.empty:
            raise ValueError("Invalid CSV structure.")
    except (FileNotFoundError, ValueError) as e:
        print(f"[WARNING] {e}. Downloading fresh data...")
        df = download_and_save()

    # Date parsing and indexing
    df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
    df.set_index('Date', inplace=True)

    if 'Close' not in df.columns:
        raise ValueError(f"[ERROR] 'Close' column missing in data for {symbol}.")

    df['Close'] = pd.to_numeric(df['Close'], errors='coerce')
    df.dropna(subset=['Close'], inplace=True)

    if len(df) < sequence_length + 1:
        raise ValueError(f"[ERROR] Not enough data for {symbol} after cleaning.")

    # Normalize
    scaler = MinMaxScaler()
    scaled = scaler.fit_transform(df[['Close']])

    # Create sequences
    X, y = [], []
    for i in range(sequence_length, len(scaled)):
        X.append(scaled[i-sequence_length:i, 0])
        y.append(scaled[i, 0])
    X = np.array(X).reshape(-1, sequence_length, 1)
    y = np.array(y)

    return df, scaler, X, y
