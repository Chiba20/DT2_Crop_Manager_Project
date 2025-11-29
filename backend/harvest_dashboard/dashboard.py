from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
import itertools

app = Flask(__name__)
CORS(app)

# Temporary in-memory data store with consistent keys and valid dates
HARVESTS = [
    {"id": 1, "crop": "Maize", "yield": 120, "date": "2025-01-15"},
    {"id": 2, "crop": "Rice",  "yield": 80,  "date": "2025-02-01"},
    {"id": 3, "crop": "Wheat", "yield": 230, "date": "2025-12-18"},
    {"id":4, "crop": "sisal", "yield": 26, "date": "2025-12-13"}
]

_id_counter = itertools.count(start=4)


# -----------------------------------------------------------
# GET /harvests   → returns all harvest records
# -----------------------------------------------------------
@app.get("/harvests")
def get_harvests():
    return jsonify(HARVESTS), 200


# -----------------------------------------------------------
# POST /harvests   → Add harvest record (optional for testing)
# -----------------------------------------------------------
@app.post("/harvests")
def add_harvest():
    data = request.json or {}
    crop = data.get("crop")
    try:
        y = float(data.get("yield", 0))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid yield value"}), 400

    date_str = data.get("date")
    # basic date validation: try to parse ISO YYYY-MM-DD if provided
    if date_str:
        try:
            # normalize date
            datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400
    else:
        date_str = datetime.utcnow().strftime("%Y-%m-%d")

    new_record = {
        "id": next(_id_counter),
        "crop": crop or "Unknown",
        "yield": y,
        "date": date_str
    }
    HARVESTS.append(new_record)
    return jsonify(new_record), 201


# ---------------------------------------------------------------
# GET /harvests/stats   → return yield per crop type + total yield + extras
# ---------------------------------------------------------------
@app.get("/harvests/stats")
def get_stats():
    stats = {}
    total_yield = 0
    count = len(HARVESTS)

    for h in HARVESTS:
        crop = h.get("crop", "Unknown")
        y = h.get("yield", 0) or 0

        total_yield += y
        stats[crop] = stats.get(crop, 0) + y

    # determine top crop (highest total yield) if any
    top_crop = None
    if stats:
        top_crop = max(stats.items(), key=lambda kv: kv[1])[0]

    return jsonify({
        "total_yield": total_yield,
        "crop_yield": stats,
        "count": count,
        "top_crop": top_crop
    }), 200


# -----------------------------------------------------------
# Run the Flask server
# -----------------------------------------------------------
if __name__ == "__main__":
    app.run(debug=True, port=5002)
