# backend/crop_tracker/predictor.py

import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import datetime

# -----------------------------
# Simple training data (mock historical data)
# [area, month] -> yield
# -----------------------------
X = np.array([
    [1, 1], [2, 1], [3, 1],
    [1, 6], [2, 6], [3, 6],
    [1, 11], [2, 11], [3, 11],
])
y = np.array([
    40, 70, 100,
    60, 100, 140,
    50, 90, 130
])

# Train simple regression model
model = LinearRegression()
model.fit(X, y)


def predict_yield(area, planting_date):
    """
    Predict crop yield based on area and planting month
    """

    # Extract month from planting_date (YYYY-MM-DD)
    month = datetime.strptime(planting_date, "%Y-%m-%d").month

    prediction = model.predict([[area, month]])[0]
    prediction = round(prediction, 2)

    # Categorize yield
    if prediction < 60:
        category = "Low"
        tip = "Improve soil quality and irrigation."
    elif prediction < 120:
        category = "Medium"
        tip = "Maintain regular watering and fertilization."
    else:
        category = "High"
        tip = "Excellent conditions! Keep monitoring pests."

    return {
        "predicted_yield": prediction,
        "category": category,
        "tip": tip
    }
