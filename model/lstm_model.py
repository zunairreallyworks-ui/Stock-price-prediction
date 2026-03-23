from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
from .utils import load_and_prepare_data
from .trainer import save_results

def train_model(split_percent=80, symbol="AAPL", sequence_length=60):
    """
    Train an LSTM model for stock price prediction.

    Args:
        split_percent (int): Percentage of data used for training.
        symbol (str): Stock symbol to load data for.
        sequence_length (int): Number of time steps in each input sequence.
    """

    # ✅ Step 1: Load and preprocess the stock price data
    df, scaler, X, y = load_and_prepare_data(symbol=symbol, sequence_length=sequence_length)

    # ✅ Step 2: Split into training and testing sets
    split_index = int(len(X) * (split_percent / 100))
    X_train, X_test = X[:split_index], X[split_index:]
    y_train, y_test = y[:split_index], y[split_index:]

    # ✅ Step 3: Build a stacked LSTM model
    model = Sequential([
        LSTM(50, return_sequences=True, input_shape=(X.shape[1], 1)),  # First LSTM layer
        LSTM(50),                                                      # Second LSTM layer
        Dense(1)                                                       # Output layer (predict a single value)
    ])

    # ✅ Step 4: Compile the model using Adam optimizer and MSE loss
    model.compile(optimizer='adam', loss='mean_squared_error')

    # ✅ Step 5: Train the model on the training set
    model.fit(X_train, y_train, epochs=5, batch_size=32, verbose=0)

    # ✅ Step 6: Predict on the full dataset (for visualization)
    predictions = model.predict(X)

    # ✅ Step 7: Save results (predictions, true values, scores)
    save_results(df, y, predictions, scaler, f"{symbol.lower()}_lstm")
