from flask import Blueprint, request, jsonify
from datetime import datetime
from crop_tracker.model import get_db

prediction_routes = Blueprint("prediction_routes", __name__, url_prefix="/api")


# -------------------------------
# Helpers
# -------------------------------
def parse_month(planting_date: str):
    """Return month (1-12) from YYYY-MM-DD, else None."""
    try:
        return int(datetime.strptime(planting_date, "%Y-%m-%d").strftime("%m"))
    except Exception:
        return None


def category_from_yield(predicted_yield: float, area: float):
    """
    Categorize yield using yield-per-area (simple, stable thresholds).
    You can tune these thresholds later using your real dataset.
    """
    if area <= 0:
        return "Medium"

    ypa = predicted_yield / area  # yield per unit area

    if ypa < 1.5:
        return "Low"
    elif ypa < 3.0:
        return "Medium"
    return "High"


TIPS = {
    "Low": [
        "Improve soil fertility with compost/manure or recommended fertilizer.",
        "Water consistently, especially during early growth stages.",
        "Control weeds early to reduce competition.",
    ],
    "Medium": [
        "Maintain good spacing and regular weeding.",
        "Use mulching to conserve moisture and reduce weeds.",
        "Monitor pests/diseases weekly and treat early.",
    ],
    "High": [
        "Keep the same best practices that worked well.",
        "Record inputs (fertilizer, irrigation) to repeat success.",
        "Harvest on time to avoid field losses.",
    ],
}


def train_simple_regression(samples):
    """
    Simple Linear Regression with 2 features:
      x1 = area, x2 = month_planted
    Model: y = b0 + b1*x1 + b2*x2

    This uses a light-weight closed-form solution using normal equations
    for 3 parameters. No external ML libs required.

    samples: list of tuples (area, month, yield_amount)
    returns (b0, b1, b2) or None if can't train.
    """
    if len(samples) < 3:
        return None

    # Build X and y
    # X = [ [1, area, month], ... ]
    X = []
    y = []
    for a, m, yy in samples:
        X.append([1.0, float(a), float(m)])
        y.append(float(yy))

    # Compute (X^T X) and (X^T y)
    # 3x3 and 3x1
    xtx = [[0.0]*3 for _ in range(3)]
    xty = [0.0]*3

    for i in range(len(X)):
        for r in range(3):
            xty[r] += X[i][r] * y[i]
            for c in range(3):
                xtx[r][c] += X[i][r] * X[i][c]

    # Invert 3x3 matrix xtx (manual inverse)
    det = (
        xtx[0][0]*(xtx[1][1]*xtx[2][2] - xtx[1][2]*xtx[2][1]) -
        xtx[0][1]*(xtx[1][0]*xtx[2][2] - xtx[1][2]*xtx[2][0]) +
        xtx[0][2]*(xtx[1][0]*xtx[2][1] - xtx[1][1]*xtx[2][0])
    )

    # If singular matrix (not invertible), can't train reliably
    if abs(det) < 1e-9:
        return None

    inv = [[0.0]*3 for _ in range(3)]
    inv[0][0] =  (xtx[1][1]*xtx[2][2] - xtx[1][2]*xtx[2][1]) / det
    inv[0][1] = -(xtx[0][1]*xtx[2][2] - xtx[0][2]*xtx[2][1]) / det
    inv[0][2] =  (xtx[0][1]*xtx[1][2] - xtx[0][2]*xtx[1][1]) / det
    inv[1][0] = -(xtx[1][0]*xtx[2][2] - xtx[1][2]*xtx[2][0]) / det
    inv[1][1] =  (xtx[0][0]*xtx[2][2] - xtx[0][2]*xtx[2][0]) / det
    inv[1][2] = -(xtx[0][0]*xtx[1][2] - xtx[0][2]*xtx[1][0]) / det
    inv[2][0] =  (xtx[1][0]*xtx[2][1] - xtx[1][1]*xtx[2][0]) / det
    inv[2][1] = -(xtx[0][0]*xtx[2][1] - xtx[0][1]*xtx[2][0]) / det
    inv[2][2] =  (xtx[0][0]*xtx[1][1] - xtx[0][1]*xtx[1][0]) / det

    # beta = inv(X^T X) * (X^T y)
    b0 = inv[0][0]*xty[0] + inv[0][1]*xty[1] + inv[0][2]*xty[2]
    b1 = inv[1][0]*xty[0] + inv[1][1]*xty[1] + inv[1][2]*xty[2]
    b2 = inv[2][0]*xty[0] + inv[2][1]*xty[1] + inv[2][2]*xty[2]

    return (b0, b1, b2)


def fallback_prediction(area: float, month: int, history_yields):
    """
    If regression can't train (too few points), we still predict:
    predicted = avg(history) adjusted slightly by month, else area-based baseline.
    """
    if history_yields:
        avg_y = sum(history_yields) / len(history_yields)
        # tiny season adjustment
        factor = 1.05 if month in [3, 4, 5, 11, 12] else (0.95 if month in [6, 7, 8, 9, 10] else 1.0)
        return max(0.0, avg_y * factor)

    # baseline: yield_per_area depends a bit on month
    if month in [3, 4, 5, 11, 12]:
        ypa = 2.2
    elif month in [6, 7, 8, 9, 10]:
        ypa = 1.8
    else:
        ypa = 2.0
    return max(0.0, ypa * area)


# =====================================================
# ✅ GET /api/predict/<crop_id>?user_id=1
# =====================================================
@prediction_routes.route("/predict/<int:crop_id>", methods=["GET"])
def predict_yield(crop_id):
    user_id = request.args.get("user_id")

    if not user_id:
        return jsonify({"error": "User not logged in"}), 401

    # Validate user_id numeric (matches your routes)
    try:
        user_id_int = int(user_id)
    except ValueError:
        return jsonify({"error": "Invalid user_id"}), 400

    conn = get_db()

    # 1) Fetch crop (ownership check like harvest.py)
    crop = conn.execute(
        "SELECT * FROM crops WHERE id=? AND user_id=?",
        (crop_id, user_id_int)
    ).fetchone()

    if not crop:
        conn.close()
        return jsonify({"error": "Unauthorized or invalid crop"}), 403

    area = float(crop["area"])
    planting_date = crop["planting_date"]
    month = parse_month(planting_date)

    if month is None:
        conn.close()
        return jsonify({"error": "Invalid planting_date stored for this crop"}), 400

    # 2) Historical data for training:
    # Use this user's harvest data for SAME crop name (more training points)
    # join harvests -> crops where crops.user_id = user and crops.name = same crop name
    rows = conn.execute("""
        SELECT c.area AS area,
               CAST(strftime('%m', c.planting_date) AS INTEGER) AS month_planted,
               h.yield_amount AS yield_amount
        FROM harvests h
        JOIN crops c ON h.crop_id = c.id
        WHERE c.user_id = ?
          AND c.name = ?
          AND c.area > 0
          AND h.yield_amount > 0
    """, (user_id_int, crop["name"])).fetchall()

    # Also keep simple history yields for fallback
    history_yields = [float(r["yield_amount"]) for r in rows if r["yield_amount"] is not None]

    conn.close()

    samples = []
    for r in rows:
        if r["month_planted"] is None:
            continue
        samples.append((r["area"], r["month_planted"], r["yield_amount"]))

    # 3) Train regression (area + month)
    model = train_simple_regression(samples)

    if model:
        b0, b1, b2 = model
        predicted = b0 + b1 * area + b2 * month
        predicted = max(0.0, float(predicted))
        used_model = True
    else:
        predicted = fallback_prediction(area, month, history_yields)
        used_model = False

    category = category_from_yield(predicted, area)

    return jsonify({
        "crop_id": crop_id,
        "crop_name": crop["name"],
        "area": area,
        "planting_date": planting_date,
        "month_planted": month,
        "predicted_yield": round(predicted, 2),
        "yield_category": category,
        "tips": TIPS[category],
        "training_points": len(samples),
        "used_regression_model": used_model
    }), 200
