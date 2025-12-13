from flask import Blueprint, jsonify
import sqlite3
from predictor import predict_yield
from database import DB_PATH

predict_bp = Blueprint("predict", __name__)

@predict_bp.route("/predict/<int:crop_id>", methods=["GET"])
def predict(crop_id):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("SELECT area, planting_date FROM crops WHERE id = ?", (crop_id,))
    crop = cur.fetchone()
    conn.close()

    if not crop:
        return jsonify({"error": "Crop not found"}), 404

    area, planting_date = crop
    prediction, category = predict_yield(area, planting_date)

    if prediction is None:
        return jsonify({"message": category}), 400

    return jsonify({
        "predicted_yield": round(prediction, 2),
        "category": category
    })
