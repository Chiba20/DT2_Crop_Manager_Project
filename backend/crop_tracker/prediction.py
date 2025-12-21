# prediction.py (FULL) — Area in acres, yield in kilograms (kg)
from flask import Blueprint, request, jsonify
from datetime import datetime
from crop_tracker.model import get_db

prediction_routes = Blueprint("prediction_routes", __name__, url_prefix="/api")

# -------------------------------
# Crop profiles in kg/acre (realistic ranges)
# -------------------------------
CROP_PROFILES = {
    "Maize":   {"baseline": 650,  "min": 250,  "max": 1600},    # kg/acre
    "Rice":    {"baseline": 1200, "min": 400,  "max": 2400},
    "Beans":   {"baseline": 400,  "min": 150,  "max": 1000},
    "Cassava": {"baseline": 4000, "min": 2000, "max": 10000},
    "Sorghum": {"baseline": 500,  "min": 200,  "max": 1200},
}
DEFAULT_PROFILE = {"baseline": 800, "min": 300, "max": 2000}

TIPS = {
    "Low": [
        "Add compost/manure and apply recommended fertilizer rates.",
        "Plant on time and keep proper spacing.",
        "Weed early and control pests/diseases quickly.",
    ],
    "Medium": [
        "Keep regular weeding and correct spacing.",
        "Top-dress fertilizer at the correct growth stage.",
        "Monitor pests/diseases weekly.",
    ],
    "High": [
        "Keep records (seed type, fertilizer, dates) to repeat success.",
        "Harvest on time and dry/store properly to reduce losses.",
        "Maintain the best practices that worked.",
    ],
}

# -------------------------------
# Helpers (SQLite + Postgres compatible)
# -------------------------------
def validate_date_str(date_str: str) -> bool:
    try:
        datetime.strptime(date_str, "%Y-%m-%d")
        return True
    except Exception:
        return False

def parse_month(date_str: str):
    try:
        return int(datetime.strptime(date_str, "%Y-%m-%d").strftime("%m"))
    except Exception:
        return None

def clamp(x, lo, hi):
    return max(lo, min(hi, x))

def season_factor(month: int):
    if month in [3, 4, 5]:
        return 1.06
    if month in [10, 11, 12]:
        return 1.03
    if month in [6, 7, 8, 9]:
        return 0.95
    return 1.00

def season_name(month: int):
    if month in [3, 4, 5]:
        return "Long Rains"
    if month in [10, 11, 12]:
        return "Short Rains"
    if month in [6, 7, 8, 9]:
        return "Dry"
    return "Other"

def category_from_kg_per_acre(pred_kg_acre: float, baseline_kg_acre: float):
    if baseline_kg_acre <= 0:
        return "Medium"
    ratio = pred_kg_acre / baseline_kg_acre
    if ratio < 0.70:
        return "Low"
    if ratio < 1.10:
        return "Medium"
    return "High"

def is_postgres(conn) -> bool:
    try:
        import sqlite3
        return not isinstance(conn, sqlite3.Connection)
    except Exception:
        return True

def ph(conn) -> str:
    return "%s" if is_postgres(conn) else "?"

def row_to_dict(row):
    if row is None:
        return None
    if isinstance(row, dict):
        return row
    try:
        return dict(row)
    except Exception:
        return row

def rows_to_list(rows):
    return [row_to_dict(r) for r in rows]


# -------------------------------
# Stable simple regression (ridge) on kg/acre vs month
# Model: y = b0 + b1*month
# -------------------------------
def train_ridge_month_model(samples, lam=0.5):
    if len(samples) < 3:
        return None

    xtx00 = 0.0
    xtx01 = 0.0
    xtx11 = 0.0
    xty0 = 0.0
    xty1 = 0.0

    for m, y in samples:
        x0 = 1.0
        x1 = float(m)
        y = float(y)

        xtx00 += x0 * x0
        xtx01 += x0 * x1
        xtx11 += x1 * x1

        xty0 += x0 * y
        xty1 += x1 * y

    xtx00 += lam
    xtx11 += lam

    det = xtx00 * xtx11 - xtx01 * xtx01
    if abs(det) < 1e-9:
        return None

    inv00 = xtx11 / det
    inv01 = -xtx01 / det
    inv10 = -xtx01 / det
    inv11 = xtx00 / det

    b0 = inv00 * xty0 + inv01 * xty1
    b1 = inv10 * xty0 + inv11 * xty1
    return (b0, b1)

def blended_pred_kg_per_acre(month, profile, model, n_points):
    baseline = profile["baseline"] * season_factor(month)

    if not model:
        return clamp(baseline, profile["min"], profile["max"])

    b0, b1 = model
    model_pred = b0 + b1 * month

    w = clamp(0.20 + 0.10 * n_points, 0.25, 0.85)
    pred = (w * model_pred) + ((1.0 - w) * baseline)

    return clamp(pred, profile["min"], profile["max"])

def confidence_label(n_points, used_model):
    if not used_model:
        return "Low"
    if n_points >= 10:
        return "High"
    if n_points >= 5:
        return "Medium"
    return "Low"


# =====================================================
# GET /api/predict/<crop_id>?user_id=1
# =====================================================
@prediction_routes.route("/predict/<int:crop_id>", methods=["GET"])
def predict_yield(crop_id):
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "User not logged in"}), 401

    try:
        user_id_int = int(user_id)
    except ValueError:
        return jsonify({"error": "Invalid user_id"}), 400

    conn = get_db()
    cur = conn.cursor()
    p = ph(conn)
    pg = is_postgres(conn)

    # Ownership check
    cur.execute(
        f"SELECT id, user_id, name, area, planting_date FROM crops WHERE id={p} AND user_id={p}",
        (crop_id, user_id_int)
    )
    crop = row_to_dict(cur.fetchone())

    if not crop:
        conn.close()
        return jsonify({"error": "Unauthorized or invalid crop"}), 403

    # Area stored in acres
    try:
        area_acres = float(crop["area"])
    except Exception:
        conn.close()
        return jsonify({"error": "Invalid area stored for this crop"}), 400

    if area_acres <= 0:
        conn.close()
        return jsonify({"error": "Area must be > 0 acres"}), 400

    planting_date = crop["planting_date"]

    # planting_date might be DATE (postgres) or TEXT (sqlite)
    if isinstance(planting_date, (datetime,)):
        planting_date_str = planting_date.date().isoformat()
    else:
        planting_date_str = str(planting_date)

    if not validate_date_str(planting_date_str):
        conn.close()
        return jsonify({"error": "Invalid planting_date stored for this crop"}), 400

    month = parse_month(planting_date_str)
    if month is None:
        conn.close()
        return jsonify({"error": "Invalid planting_date stored for this crop"}), 400

    crop_name = (crop["name"] or "").strip()
    profile = CROP_PROFILES.get(crop_name, DEFAULT_PROFILE)

    # Training data: same crop name for this user
    if pg:
        # Postgres: EXTRACT(MONTH FROM date)
        cur.execute(f"""
            SELECT c.area AS area_acres,
                   EXTRACT(MONTH FROM c.planting_date)::INT AS month_planted,
                   h.yield_amount AS yield_kg
            FROM harvests h
            JOIN crops c ON h.crop_id = c.id
            WHERE c.user_id = {p}
              AND c.name = {p}
              AND c.area > 0
              AND h.yield_amount > 0
        """, (user_id_int, crop_name))
    else:
        # SQLite: strftime
        cur.execute(f"""
            SELECT c.area AS area_acres,
                   CAST(strftime('%m', c.planting_date) AS INTEGER) AS month_planted,
                   h.yield_amount AS yield_kg
            FROM harvests h
            JOIN crops c ON h.crop_id = c.id
            WHERE c.user_id = {p}
              AND c.name = {p}
              AND c.area > 0
              AND h.yield_amount > 0
        """, (user_id_int, crop_name))

    rows = rows_to_list(cur.fetchall())
    conn.close()

    # Convert training records -> kg/acre
    samples = []
    for r in rows:
        try:
            a = float(r["area_acres"])
            m = int(r["month_planted"])
            y = float(r["yield_kg"])
            if a > 0 and y > 0 and 1 <= m <= 12:
                kg_per_acre = y / a
                kg_per_acre = clamp(kg_per_acre, profile["min"] * 0.5, profile["max"] * 1.5)
                samples.append((m, kg_per_acre))
        except Exception:
            continue

    model = train_ridge_month_model(samples, lam=0.5)
    used_model = model is not None

    pred_kg_per_acre = blended_pred_kg_per_acre(month, profile, model, len(samples))
    pred_total_kg = pred_kg_per_acre * area_acres

    category = category_from_kg_per_acre(pred_kg_per_acre, profile["baseline"])
    season = season_name(month)

    return jsonify({
        "crop_id": crop_id,
        "crop_name": crop_name,
        "area": area_acres,
        "area_unit": "acres",
        "planting_date": planting_date_str,
        "month_planted": month,
        "season": season,

        "predicted_yield": round(pred_total_kg, 1),
        "yield_unit": "kg",
        "predicted_yield_per_acre": round(pred_kg_per_acre, 1),
        "yield_per_acre_unit": "kg/acre",

        "baseline_yield_per_acre": profile["baseline"],
        "baseline_unit": "kg/acre",

        "yield_category": category,
        "tips": TIPS[category],

        "training_points": len(samples),
        "used_regression_model": used_model,
        "confidence": confidence_label(len(samples), used_model),
    }), 200
