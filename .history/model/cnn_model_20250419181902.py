from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv1D, Dense, Flatten
from tensorflow.keras.optimizers import Adam
from .utils import load_and_prepare_data
from .trainer import save_results

def train_model(split_percent=80, symbol="AAPL", sequence_length=60):
    """
    Train a 1D Convolutional Neural Network for stock price prediction.

    Args:
        split_percent (int): Percentage of data used for training.
        symbol (str): Stock symbol to load data for.
        sequence_length (int): Number of time steps in each input sequence.
    """
    # ✅ Load data for the selected symbol
    df, scaler, X, y = load_and_prepare_data(symbol=symbol, sequence_length=sequence_length)

    # ✅ Ensure shape for Conv1D
    if X.ndim != 3:
        X = X.reshape((X.shape[0], X.shape[1], 1))

    # ✅ Train/Test split
    split_index = int(len(X) * (split_percent / 100))
    X_train, X_test = X[:split_index], X[split_index:]
    y_train, y_test = y[:split_index], y[split_index:]

    # ✅ Define CNN model
    model = Sequential([
        Conv1D(filters=64, kernel_size=3, activation='relu', input_shape=(X.shape[1], 1)),
        Flatten(),
        Dense(50, activation='relu'),
        Dense(1)
    ])
    model.compile(optimizer=Adam(learning_rate=0.001), loss='mean_squared_error')

    # ✅ Train the model
    model.fit(X_train, y_train, epochs=5, batch_size=32, verbose=0)

    # ✅ Predict on all data
    predictions = model.predict(X)

    # ✅ Save output uniquely per stock
    save_results(df, y, predictions, scaler, f"{symbol.lower()}_cnn")
