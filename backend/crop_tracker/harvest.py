from flask import Blueprint, request, jsonify
from datetime import datetime
from crop_tracker.model import get_db

harvest_routes = Blueprint("harvest_routes", __name__, url_prefix="/api")

# -------------------------------
# Utility: validate date
# -------------------------------
def validate_date(date_string):
    try:
        datetime.strptime(date_string, "%Y-%m-%d")
        return True
    except ValueError:
        return False


# =====================================================
# GET /api/harvests?user_id=1
# =====================================================
@harvest_routes.route("/harvests", methods=["GET"])
def get_harvests():
    user_id = request.args.get("user_id")

    if not user_id:
        return jsonify({"error": "User not logged in"}), 401

    conn = get_db()
    harvests = conn.execute("""
        SELECT harvests.id,
               crops.name AS crop_name,
               harvests.date,
               harvests.yield_amount
        FROM harvests
        JOIN crops ON harvests.crop_id = crops.id
        WHERE crops.user_id = ?
        ORDER BY harvests.date DESC
    """, (user_id,)).fetchall()
    conn.close()

    return jsonify([dict(h) for h in harvests]), 200


# =====================================================
# GET /api/harvests/stats?user_id=1
# =====================================================
@harvest_routes.route("/harvests/stats", methods=["GET"])
def get_harvest_stats():
    user_id = request.args.get("user_id")

    if not user_id:
        return jsonify({"error": "User not logged in"}), 401

    conn = get_db()
    stats = conn.execute("""
        SELECT crops.name AS crop_name,
               SUM(harvests.yield_amount) AS total_yield,
               AVG(harvests.yield_amount) AS avg_yield,
               COUNT(harvests.id) AS harvest_count
        FROM harvests
        JOIN crops ON harvests.crop_id = crops.id
        WHERE crops.user_id = ?
        GROUP BY crops.name
        ORDER BY total_yield DESC
    """, (user_id,)).fetchall()

    overall_total = sum(row["total_yield"] or 0 for row in stats)
    conn.close()

    return jsonify({
        "stats": [
            {
                "crop_name": row["crop_name"],
                "total_yield": row["total_yield"] or 0,
                "avg_yield": row["avg_yield"] or 0,
                "harvest_count": row["harvest_count"]
            }
            for row in stats
        ],
        "overall_total_yield": overall_total
    }), 200


# =====================================================
# ✅ NEW: GET /api/harvests/monthly?user_id=1&crop=Maize&year=2025(optional)
# =====================================================
@harvest_routes.route("/harvests/monthly", methods=["GET"])
def harvest_monthly():
    user_id = request.args.get("user_id")
    crop = request.args.get("crop")
    year = request.args.get("year")  # optional

    if not user_id:
        return jsonify({"error": "User not logged in"}), 401
    if not crop:
        return jsonify({"error": "crop is required"}), 400

    conn = get_db()

    if year:
        rows = conn.execute("""
            SELECT CAST(strftime('%m', harvests.date) AS INTEGER) AS month,
                   SUM(harvests.yield_amount) AS total_yield
            FROM harvests
            JOIN crops ON harvests.crop_id = crops.id
            WHERE crops.user_id = ?
              AND crops.name = ?
              AND strftime('%Y', harvests.date) = ?
            GROUP BY month
            ORDER BY month
        """, (user_id, crop, year)).fetchall()
    else:
        rows = conn.execute("""
            SELECT CAST(strftime('%m', harvests.date) AS INTEGER) AS month,
                   SUM(harvests.yield_amount) AS total_yield
            FROM harvests
            JOIN crops ON harvests.crop_id = crops.id
            WHERE crops.user_id = ?
              AND crops.name = ?
            GROUP BY month
            ORDER BY month
        """, (user_id, crop)).fetchall()

    conn.close()

    return jsonify({
        "crop": crop,
        "year": year,
        "monthly": [{"month": r["month"], "total_yield": r["total_yield"] or 0} for r in rows]
    }), 200


# =====================================================
# ✅ NEW: GET /api/harvests/trend?user_id=1&year=2025(optional)
# monthly totals for ALL crops
# =====================================================
@harvest_routes.route("/harvests/trend", methods=["GET"])
def harvest_trend():
    user_id = request.args.get("user_id")
    year = request.args.get("year")  # optional

    if not user_id:
        return jsonify({"error": "User not logged in"}), 401

    conn = get_db()

    if year:
        rows = conn.execute("""
            SELECT CAST(strftime('%m', harvests.date) AS INTEGER) AS month,
                   crops.name AS crop_name,
                   SUM(harvests.yield_amount) AS total_yield
            FROM harvests
            JOIN crops ON harvests.crop_id = crops.id
            WHERE crops.user_id = ?
              AND strftime('%Y', harvests.date) = ?
            GROUP BY month, crop_name
            ORDER BY month, crop_name
        """, (user_id, year)).fetchall()
    else:
        rows = conn.execute("""
            SELECT CAST(strftime('%m', harvests.date) AS INTEGER) AS month,
                   crops.name AS crop_name,
                   SUM(harvests.yield_amount) AS total_yield
            FROM harvests
            JOIN crops ON harvests.crop_id = crops.id
            WHERE crops.user_id = ?
            GROUP BY month, crop_name
            ORDER BY month, crop_name
        """, (user_id,)).fetchall()

    conn.close()

    return jsonify({
        "year": year,
        "trend": [{"month": r["month"], "crop_name": r["crop_name"], "total_yield": r["total_yield"] or 0} for r in rows]
    }), 200


# =====================================================
# POST /api/harvest/<crop_id>/<user_id>
# =====================================================
@harvest_routes.route("/harvest/<int:crop_id>/<int:user_id>", methods=["POST"])
def add_harvest(crop_id, user_id):
    data = request.get_json() or {}
    date = data.get("date")
    yield_amount = data.get("yield_amount")

    if not date or yield_amount is None:
        return jsonify({"error": "Date and yield_amount are required"}), 400

    if not validate_date(date):
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    try:
        yield_amount = float(yield_amount)
        if yield_amount <= 0:
            return jsonify({"error": "Yield must be positive"}), 400
    except ValueError:
        return jsonify({"error": "Yield must be a number"}), 400

    conn = get_db()
    crop = conn.execute(
        "SELECT * FROM crops WHERE id=? AND user_id=?",
        (crop_id, user_id)
    ).fetchone()

    if not crop:
        conn.close()
        return jsonify({"error": "Unauthorized or invalid crop"}), 403

    conn.execute(
        "INSERT INTO harvests (crop_id, date, yield_amount) VALUES (?, ?, ?)",
        (crop_id, date, yield_amount)
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "Harvest recorded successfully"}), 201
