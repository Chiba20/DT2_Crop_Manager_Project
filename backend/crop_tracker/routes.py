from flask import Blueprint, request, jsonify
from model import get_db
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime

crop_routes = Blueprint("crop_routes", __name__)
auth_routes = Blueprint("auth_routes", __name__)

SECRET = "MYSECRET"

# -----------------------------
# AUTH: REGISTER
# -----------------------------
@auth_routes.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()

    if not data:
        return jsonify({"success": False, "message": "JSON required"}), 400

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"success": False, "message": "Email + password required"}), 400

    conn = get_db()
    cur = conn.cursor()

    exists = cur.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if exists:
        return jsonify({"success": False, "message": "User already exists"}), 400

    hashed_pw = generate_password_hash(password)
    cur.execute("INSERT INTO users (email, password) VALUES (?, ?)", (email, hashed_pw))
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "Registered successfully"}), 201


# -----------------------------
# AUTH: LOGIN
# -----------------------------
@auth_routes.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data:
        return jsonify({"success": False, "message": "JSON required"}), 400

    email = data.get("email")
    password = data.get("password")

    conn = get_db()
    cur = conn.cursor()

    user = cur.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()

    if not user or not check_password_hash(user["password"], password):
        return jsonify({"success": False, "message": "Invalid credentials"}), 401

    token = jwt.encode(
        {"email": email, "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=2)},
        SECRET,
        algorithm="HS256"
    )

    return jsonify({"success": True, "token": token}), 200


# -----------------------------
# 1. ADD CROP
# -----------------------------
@crop_routes.route("/crops", methods=["POST"])
def add_crop():
    data = request.get_json()

    if not data:
        return jsonify({"error": "JSON required"}), 400

    name = data.get("name")
    area = data.get("area")
    planting_date = data.get("planting_date")

    if not name or area is None or not planting_date:
        return jsonify({"error": "Missing fields"}), 400

    if float(area) <= 0:
        return jsonify({"error": "Area must be positive"}), 400

    conn = get_db()
    cur = conn.cursor()

    cur.execute(
        "INSERT INTO crops (name, area, planting_date) VALUES (?, ?, ?)",
        (name, area, planting_date)
    )
    conn.commit()

    new_id = cur.lastrowid
    conn.close()

    return jsonify({
        "id": new_id,
        "name": name,
        "area": area,
        "planting_date": planting_date
    }), 201


# -----------------------------
# 2. GET CROPS
# -----------------------------
@crop_routes.route("/crops", methods=["GET"])
def get_crops():
    conn = get_db()
    rows = conn.cursor().execute("SELECT * FROM crops").fetchall()
    conn.close()

    return jsonify([dict(row) for row in rows]), 200


# -----------------------------
# 3. RECORD HARVEST
# -----------------------------
@crop_routes.route("/crops/<int:crop_id>/harvest", methods=["PUT"])
def record_harvest(crop_id):
    data = request.get_json()

    if not data:
        return jsonify({"error": "JSON required"}), 400

    date = data.get("date")
    yield_amount = data.get("yieldAmount")

    if not date or yield_amount is None:
        return jsonify({"error": "Missing fields"}), 400

    if float(yield_amount) < 0:
        return jsonify({"error": "Yield amount must be positive"}), 400

    conn = get_db()
    cur = conn.cursor()

    crop_exists = cur.execute("SELECT id FROM crops WHERE id = ?", (crop_id,)).fetchone()
    if not crop_exists:
        return jsonify({"error": "Crop not found"}), 404

    cur.execute(
        "INSERT INTO harvests (crop_id, date, yield_amount) VALUES (?, ?, ?)",
        (crop_id, date, yield_amount)
    )

    conn.commit()
    conn.close()

    return jsonify({"message": "Harvest recorded successfully"}), 200
