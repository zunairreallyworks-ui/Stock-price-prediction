import yfinance as yf
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
import os

def load_and_prepare_data(symbol="AAPL", sequence_length=60):
    file_path = f"data/{symbol.lower()}.csv"

    # Create data directory if needed
    if not os.path.exists("data"):
        os.makedirs("data")

    def download_and_save():
        print(f"[INFO] Downloading fresh data for {symbol}...")
        # Using Ticker().history() instead of download() for simpler column structure
        df_dl = yf.Ticker(symbol).history(period="5y")
        if df_dl.empty:
            raise ValueError(f"[ERROR] Downloaded data for {symbol} is empty.")
        
        # Reset index and select columns
        df_save = df_dl.reset_index()[['Date', 'Close']]
        
        # Save to CSV
        df_save.to_csv(file_path, index=False)
        return df_dl

    # Try to load existing CSV, if bad → redownload
    try:
        if not os.path.isfile(file_path) or os.path.getsize(file_path) == 0:
            raise FileNotFoundError
        df = pd.read_csv(file_path)
        if "Date" not in df.columns or "Close" not in df.columns or df.empty:
            raise ValueError("Invalid CSV structure.")
    except (FileNotFoundError, ValueError) as e:
        print(f"[WARNING] {e}. Downloading fresh data...")
        df = download_and_save()

    # Parse Date and set index
    df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
    df.set_index('Date', inplace=True)

    # Keep only Close column
    if 'Close' not in df.columns:
        raise ValueError(f"[ERROR] 'Close' column missing in data for {symbol}.")
    df['Close'] = pd.to_numeric(df['Close'], errors='coerce')
    df.dropna(subset=['Close'], inplace=True)

    # Ensure we have enough rows after cleaning
    if len(df) < sequence_length + 1:
        raise ValueError(f"[ERROR] Not enough data for {symbol} after cleaning.")

    # Normalize
    scaler = MinMaxScaler()
    scaled = scaler.fit_transform(df[['Close']])

    # Sliding window
    X, y = [], []
    for i in range(sequence_length, len(scaled)):
        X.append(scaled[i-sequence_length:i, 0])
        y.append(scaled[i, 0])
    X = np.array(X).reshape(-1, sequence_length, 1)
    y = np.array(y)

    return df, scaler, X, y