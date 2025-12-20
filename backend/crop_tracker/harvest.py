from flask import Blueprint, request, jsonify, session
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
# GET /api/harvests
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
# GET /api/harvests/stats
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
# POST /api/harvest/<crop_id>/<user_id>
# =====================================================
@harvest_routes.route("/harvest/<int:crop_id>/<int:user_id>", methods=["POST"])
def add_harvest(crop_id, user_id):
    data = request.get_json() or {}
    date = data.get("date")
    yield_amount = data.get("yield_amount")

    if not date or not yield_amount:
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