# backend/crop_tracker/routes.py

from flask import Blueprint, request, jsonify
from model import get_db

crop_routes = Blueprint("crop_routes", __name__)

# ----------------------------------------------------
# 1. ADD NEW CROP
# ----------------------------------------------------
@crop_routes.route("/crops", methods=["POST"])
def add_crop():
    data = request.get_json()

    name = data.get("name")
    area = data.get("area")
    planting_date = data.get("planting_date")

    if not name or area is None or not planting_date:
        return jsonify({"error": "name, area, planting_date required"}), 400

    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO crops (name, area, planting_date)
        VALUES (?, ?, ?)
    """, (name, area, planting_date))

    conn.commit()
    new_id = cur.lastrowid
    conn.close()

    return jsonify({
        "id": new_id,
        "name": name,
        "area": area,
        "planting_date": planting_date
    }), 201


# ----------------------------------------------------
# 2. GET ALL CROPS
# ----------------------------------------------------
@crop_routes.route("/crops", methods=["GET"])
def get_crops():
    conn = get_db()
    cur = conn.cursor()

    crops = cur.execute("SELECT * FROM crops").fetchall()
    conn.close()

    return jsonify([dict(row) for row in crops])


# ----------------------------------------------------
# 3. RECORD HARVEST
# ----------------------------------------------------
@crop_routes.route("/crops/<int:crop_id>/harvest", methods=["PUT"])
def record_harvest(crop_id):
    data = request.get_json()

    date = data.get("date")
    yield_amount = data.get("yieldAmount")

    if not date or yield_amount is None:
        return jsonify({"error": "date and yieldAmount required"}), 400

    conn = get_db()
    cur = conn.cursor()

    # check if crop exists
    crop_check = cur.execute("SELECT * FROM crops WHERE id = ?", (crop_id,)).fetchone()
    if not crop_check:
        return jsonify({"error": "Crop not found"}), 404

    cur.execute("""
        INSERT INTO harvests (crop_id, date, yield_amount)
        VALUES (?, ?, ?)
    """, (crop_id, date, yield_amount))

    conn.commit()
    conn.close()

    return jsonify({"message": "Harvest recorded successfully"}), 200
