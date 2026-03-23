from sklearn.metrics import r2_score

def calculate_r2(actual, predicted):
    """
    Calculates R-squared (coefficient of determination).

    Parameters:
        actual (array-like): Ground truth values
        predicted (array-like): Predicted values from the model

    Returns:
        float: R-squared score
    """
    return r2_score(actual, predicted)
