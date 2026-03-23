from sklearn.svm import SVR
from model.utils import load_and_prepare_data
from model.trainer import save_results

def train_model(split_percent=80, symbol="AAPL", sequence_length=60):
    print(f"[SVM] Re-training model on {symbol} with split {split_percent}%")

    # Load and prepare data
    df, scaler, X, y = load_and_prepare_data(symbol=symbol, sequence_length=sequence_length)

    # Flatten for SVR (2D required)
    X = X.reshape((X.shape[0], X.shape[1]))

    # Split into train/test
    split_index = int(len(X) * (split_percent / 100))
    X_train, X_test = X[:split_index], X[split_index:]
    y_train, y_test = y[:split_index], y[split_index:]

    # Subset the DataFrame to match test set length
    df_test = df.iloc[-len(y_test):]

    # Train model
    model = SVR(C=100, gamma=0.1, epsilon=0.01)
    model.fit(X_train, y_train)

    # Predict on test data only
    predictions = model.predict(X_test)

    # Save test predictions + evaluation
    save_results(df_test, y_test, predictions, scaler, f"{symbol.lower()}_svm")

    print(f"[{symbol.upper()}_SVM] Model trained | MAE: evaluating...")

if __name__ == "__main__":
    train_model(80, symbol="AAPL")
