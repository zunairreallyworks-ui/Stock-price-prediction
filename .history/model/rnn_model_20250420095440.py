from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import SimpleRNN, Dense
from .utils import load_and_prepare_data
from .trainer import save_results

def train_model(split_percent=80, symbol="AAPL", sequence_length=60):
    """
    Trains an RNN model on a given stock symbol with a sliding window.

    Args:
        split_percent (int): % of data used for training.
        symbol (str): Stock symbol (e.g., "AAPL", "NVDA").
        sequence_length (int): Size of time window for sequence input.
    """

    # Load & prepare data
    df, scaler, X, y = load_and_prepare_data(symbol=symbol, sequence_length=sequence_length)

    # Split into train/test
    split_index = int(len(X) * (split_percent / 100))
    X_train, X_test = X[:split_index], X[split_index:]
    y_train, y_test = y[:split_index], y[split_index:]

    # Build RNN model
    model = Sequential([
        SimpleRNN(50, return_sequences=True, input_shape=(X.shape[1], 1)),
        SimpleRNN(50),
        Dense(1)
    ])
    model.compile(optimizer='adam', loss='mean_squared_error')

    # Train
    model.fit(X_train, y_train, epochs=5, batch_size=32, verbose=0)

    # Predict on full dataset (for visualization)
    full_predictions = model.predict(X)
    full_df = df.iloc[-len(y):]
    save_results(full_df, y, full_predictions, scaler, f"{symbol.lower()}_rnn")

    # Predict on test set (for evaluation)
    test_predictions = model.predict(X_test)
    test_df = df.iloc[-len(y_test):]
    save_results(test_df, y_test, test_predictions, scaler, f"{symbol.lower()}_rnn_test")
