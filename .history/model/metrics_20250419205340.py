from sklearn.metrics import r2_score

def calculate_r2(actual, predicted):
    return r2_score(actual, predicted)
