from flask import Blueprint, jsonify
from crop_tracker.model import get_db
from crop_tracker.predictor import predict_yield

# Blueprint for prediction routes
prediction_routes = Blueprint("prediction_routes", __name__, url_prefix="/api")

@prediction_routes.route("/predict/<int:crop_id>", methods=["GET"])
def predict_crop(crop_id):
    """
    Predict yield for a given crop using area and planting date
    """
    conn = get_db()
    crop = conn.execute(
        "SELECT area, planting_date FROM crops WHERE id=?",
        (crop_id,)
    ).fetchone()
    conn.close()

    if not crop:
        return jsonify({"error": "Crop not found"}), 404

    result = predict_yield(crop["area"], crop["planting_date"])
    return jsonify(result), 200
