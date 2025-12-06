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

    # Validate JSON
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    name = data.get("name")
    area = data.get("area")
    planting_date = data.get("planting_date")

    # Field validation
    errors = {}

    if not name:
        errors["name"] = "Crop name is required"
    if area is None:
        errors["area"] = "Area is required"
    else:
        try:
            area = float(area)
        except:
            errors["area"] = "Area must be a number"
    if not planting_date:
        errors["planting_date"] = "Planting date is required"

    if errors:
        return jsonify({"errors": errors}), 400

    # Save crop
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

    rows = cur.execute("SELECT * FROM crops").fetchall()
    conn.close()

    return jsonify([dict(row) for row in rows]), 200


# ----------------------------------------------------
# 3. RECORD HARVEST
# ----------------------------------------------------
@crop_routes.route("/crops/<int:crop_id>/harvest", methods=["PUT"])
def record_harvest(crop_id):
    data = request.get_json()

    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    date = data.get("date")
    yield_amount = data.get("yieldAmount")

    errors = {}

    if not date:
        errors["date"] = "Harvest date required"
    if yield_amount is None:
        errors["yieldAmount"] = "Yield amount required"
    else:
        try:
            yield_amount = float(yield_amount)
        except:
            errors["yieldAmount"] = "Yield amount must be a number"

    if errors:
        return jsonify({"errors": errors}), 400

    conn = get_db()
    cur = conn.cursor()

    # Check crop exists
    crop_exists = cur.execute("SELECT * FROM crops WHERE id = ?", (crop_id,)).fetchone()
    if not crop_exists:
        return jsonify({"error": "Crop not found"}), 404

    # Insert harvest
    cur.execute("""
        INSERT INTO harvests (crop_id, date, yield_amount)
        VALUES (?, ?, ?)
    """, (crop_id, date, yield_amount))

    conn.commit()
    conn.close()

    return jsonify({"message": "Harvest recorded successfully"}), 200
