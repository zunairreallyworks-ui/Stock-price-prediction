from sklearn.svm import SVR
from model.utils import load_and_prepare_data
from model.trainer import save_results

def train_model(split_percent=80, symbol="AAPL", sequence_length=60):
    """
    Train a Support Vector Regression (SVR) model for stock price prediction.

    Args:
        split_percent (int): Percentage of data used for training.
        symbol (str): Stock symbol to load data for (e.g., "AAPL", "GOOG").
        sequence_length (int): Size of the time window for sequence input.
    """

    # Step 1: Load and preprocess the stock price data
    df, scaler, X, y = load_and_prepare_data(symbol=symbol, sequence_length=sequence_length)

    # Step 2: Flatten input data to 2D (samples, features) as required by SVR
    X = X.reshape((X.shape[0], X.shape[1]))

    # Step 3: Split into training and testing datasets
    split_index = int(len(X) * (split_percent / 100))
    X_train, X_test = X[:split_index], X[split_index:]
    y_train, y_test = y[:split_index], y[split_index:]

    # Step 4: Initialize and train the SVR model
    model = SVR(C=100, gamma=0.1, epsilon=0.01)
    model.fit(X_train, y_train)

    # Step 5: Predict on test data only
    predictions = model.predict(X_test)

    # Step 6: Save predictions, true values, and evaluation metrics
    save_results(df, y_test, predictions, scaler, f"{symbol.lower()}_svm")

    # Step 7: Print a success message
    print(f"[SVM] Model trained for {symbol} | Split: {split_percent}%")

# Allow quick testing if run directly
if __name__ == "__main__":
    train_model(80, symbol="AAPL")