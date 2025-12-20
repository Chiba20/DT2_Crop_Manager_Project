from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from statistics import mean
import sqlite3

prediction_routes = Blueprint("prediction_routes", __name__)

NOT_RECOMMENDED_REASON = {
    "potato": {
        "rainy": "Excess moisture increases risk of rot and fungal diseases."
    },
    "wheat": {
        "rainy": "High humidity during growth reduces grain quality and yield."
    },
    "tomato": {
        "cool": "Low temperatures slow flowering and fruit development."
    },
    "beans": {
        "dry": "Water stress during flowering reduces pod formation."
    }
}

CONFIDENCE_DAYS = 7


NOT_RECOMMENDED = {
    crop: list(seasons.keys())
    for crop, seasons in NOT_RECOMMENDED_REASON.items()
}


CROP_BASE_DAYS = {
    "maize": 120,
    "rice": 150,
    "wheat": 130,
    "beans": 90,
    "tomato": 85,
    "potato": 110
}

SEASON_ADJUSTMENT = {
    "rainy": -10,
    "dry": 15,
    "cool": 5
}


DB_PATH = "backend/database.db"


def get_user_crop_history(user_id, crop_name):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT c.planting_date, h.harvest_date
        FROM crops c
        JOIN harvests h ON c.id = h.crop_id
        WHERE c.user_id = ? AND LOWER(c.name) = ?
    """, (user_id, crop_name.lower()))

    rows = cursor.fetchall()
    conn.close()
    return rows


@prediction_routes.route("/api/predict-harvest", methods=["POST"])
def predict_harvest():
    data = request.get_json() or {}

    crop = data.get("crop")
    planting_date_str = data.get("planting_date")
    season = data.get("season")
    user_id = data.get("user_id")
    use_history = bool(data.get("use_history", False))

    if not crop or not planting_date_str or not season:
        return jsonify({"error": "Missing required fields"}), 400

    crop = crop.lower()
    season = season.lower()

    if crop not in CROP_BASE_DAYS:
        return jsonify({"error": "Unsupported crop"}), 400

    if crop in NOT_RECOMMENDED_REASON and season in NOT_RECOMMENDED_REASON[crop]:
        return jsonify({
            "recommended": False,
            "crop": crop,
            "season": season,
            "message": f"{crop.capitalize()} is not recommended in {season} season.",
            "reason": NOT_RECOMMENDED_REASON[crop][season]
    }), 200


    base_days = CROP_BASE_DAYS[crop]
    predicted_days = base_days + SEASON_ADJUSTMENT.get(season, 0)

    history_used = False
    history_available = False

    if use_history and user_id:
        history = get_user_crop_history(user_id, crop)

        if len(history) >= 3:
            durations = []
            for p, h in history:
                try:
                    d1 = datetime.strptime(p, "%Y-%m-%d")
                    d2 = datetime.strptime(h, "%Y-%m-%d")
                    durations.append((d2 - d1).days)
                except:
                    pass

            if len(durations) >= 3:
                predicted_days = int(0.7 * predicted_days + 0.3 * mean(durations))
                history_used = True
                history_available = True
        else:
            history_available = False

    planting_date = datetime.strptime(planting_date_str, "%Y-%m-%d")
    harvest_date = planting_date + timedelta(days=predicted_days)

    return jsonify({
        "crop": crop,
        "season": season,
        "planting_date": planting_date_str,
        "predicted_harvest_date": harvest_date.strftime("%Y-%m-%d"),
        "duration_days": predicted_days,
        "confidence_range": {
            "minus_days": CONFIDENCE_DAYS,
            "plus_days": CONFIDENCE_DAYS,
            "earliest": (harvest_date - timedelta(days=CONFIDENCE_DAYS)).strftime("%Y-%m-%d"),
            "latest": (harvest_date + timedelta(days=CONFIDENCE_DAYS)).strftime("%Y-%m-%d"),
        },
        "history_used": history_used,
        "history_available": len(history) >= 3 if use_history and user_id else False,
        "recommended": True
    }), 200

