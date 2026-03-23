from sklearn.linear_model import LinearRegression
from .utils import load_and_prepare_data
from .trainer import save_results

def train_model(split_percent=80, symbol="AAPL", sequence_length=60):
    print(f"[Linear Regression] Re-training model on {symbol} with split {split_percent}%")

    # Load and prepare data
    df, scaler, X, y = load_and_prepare_data(symbol=symbol, sequence_length=sequence_length)

    # Flatten X for Linear Regression
    X_flat = X.reshape((X.shape[0], X.shape[1]))

    # Split into train and test
    split_index = int(len(X_flat) * (split_percent / 100))
    X_train, X_test = X_flat[:split_index], X_flat[split_index:]
    y_train, y_test = y[:split_index], y[split_index:]

    # Train the model
    model = LinearRegression()
    model.fit(X_train, y_train)

    # Predict on test data only
    predictions = model.predict(X_test)

    # Only save the test portion to results
    save_results(df, y_test, predictions, scaler, f"{symbol.lower()}_lr")
