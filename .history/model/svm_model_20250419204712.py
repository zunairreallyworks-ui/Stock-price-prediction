from sklearn.svm import SVR
from model.utils import load_and_prepare_data
from model.trainer import save_results

def train_model(split_percent=80, symbol="AAPL", sequence_length=60):
    # Load & prepare data
    df, scaler, X, y = load_and_prepare_data(symbol=symbol, sequence_length=sequence_length)

    # Flatten for SVR (2D required)
    X = X.reshape((X.shape[0], X.shape[1]))

    # Split into train/test
    split_index = int(len(X) * (split_percent / 100))
    X_train, X_test = X[:split_index], X[split_index:]
    y_train, y_test = y[:split_index], y[split_index:]

    # SVM Model
    model = SVR(C=100, gamma=0.1, epsilon=0.01)
    model.fit(X_train, y_train)

    # Predict on full data (for plotting)
    predictions = model.predict(X)

    # Save predictions + evaluation
    save_results(df, y, predictions, scaler, f"{symbol.lower()}_svm")

    print(f"[SVM] Model trained for {symbol} | Split: {split_percent}%")

if __name__ == "__main__":
    train_model(80, symbol="AAPL")
