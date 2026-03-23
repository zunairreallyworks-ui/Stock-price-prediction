from sklearn.linear_model import LinearRegression
from .utils import load_and_prepare_data
from .trainer import save_results

def train_model(split_percent=80, symbol="AAPL", sequence_length=60):
    print(f"[Linear Regression] Re-training model on {symbol} with split {split_percent}%")

    # Load data
    df, scaler, X, y = load_and_prepare_data(symbol=symbol, sequence_length=sequence_length)

    # Flatten for Linear Regression
    X_flat = X.reshape((X.shape[0], X.shape[1]))

    # Train/test split
    split_index = int(len(X_flat) * (split_percent / 100))
    X_train, y_train = X_flat[:split_index], y[:split_index]

    # Train model on selected portion
    model = LinearRegression()
    model.fit(X_train, y_train)

    # Predict on full dataset for visual consistency
    predictions = model.predict(X_flat)

    # Only keep the last `len(y)` dates
    recent_df = df.iloc[-len(y):]

    # Save to CSV and TXT
    save_results(recent_df, y, predictions, scaler, f"{symbol.lower()}_lr")
