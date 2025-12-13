import sqlite3
import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import datetime
from database import DB_PATH

def load_training_data():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("""
        SELECT crops.area, crops.planting_date, harvests.yield_amount
        FROM crops
        JOIN harvests ON crops.id = harvests.crop_id
    """)

    rows = cur.fetchall()
    conn.close()

    X = []
    y = []

    for area, planting_date, yield_amount in rows:
        month = datetime.strptime(planting_date, "%Y-%m-%d").month
        X.append([area, month])
        y.append(yield_amount)

    return np.array(X), np.array(y)

def predict_yield(area, planting_date):
    X, y = load_training_data()

    if len(X) < 2:
        return None, "Not enough data"

    model = LinearRegression()
    model.fit(X, y)

    month = datetime.strptime(planting_date, "%Y-%m-%d").month
    prediction = model.predict([[area, month]])[0]

    return prediction, categorize_yield(prediction, y)

def categorize_yield(prediction, all_yields):
    low = np.percentile(all_yields, 33)
    high = np.percentile(all_yields, 66)

    if prediction < low:
        return "Low"
    elif prediction < high:
        return "Medium"
    else:
        return "High"
