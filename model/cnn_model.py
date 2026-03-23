from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv1D, Dense, Flatten
from tensorflow.keras.optimizers import Adam
from .utils import load_and_prepare_data
from .trainer import save_results

def train_model(split_percent=80, symbol="AAPL", sequence_length=60):
    """
    Train a 1D Convolutional Neural Network (CNN) for stock price prediction.
    """

    # Step 1: Load and preprocess data
    df, scaler, X, y = load_and_prepare_data(symbol=symbol, sequence_length=sequence_length)

    # Step 2: Ensure correct shape for Conv1D
    if X.ndim != 3:
        X = X.reshape((X.shape[0], X.shape[1], 1))

    # Step 3: Split into train/test
    split_index = int(len(X) * (split_percent / 100))
    X_train, X_test = X[:split_index], X[split_index:]
    y_train, y_test = y[:split_index], y[split_index:]

    # Step 4: Build model
    model = Sequential([
        Conv1D(filters=64, kernel_size=3, activation='relu', input_shape=(X.shape[1], 1)),
        Flatten(),
        Dense(50, activation='relu'),
        Dense(1)
    ])

    # Step 5: Compile
    model.compile(optimizer=Adam(learning_rate=0.001), loss='mean_squared_error')

    # Step 6: Train only on training set
    model.fit(X_train, y_train, epochs=5, batch_size=32, verbose=0)

    # Step 7: Predict only on test set
    predictions = model.predict(X_test, verbose=0)

    # Step 8: Save only test results
    save_results(df, y_test, predictions, scaler, f"{symbol.lower()}_cnn")