from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import uuid
from crop_tracker.model import get_db
import re
from flask import session
# -----------------------------
# Blueprints
# -----------------------------
auth_routes = Blueprint("auth_routes", __name__, url_prefix="/api")
crop_routes = Blueprint("crop_routes", __name__, url_prefix="/api")

# -----------------------------
# Validation Functions
# -----------------------------
def validate_email(email):
    return re.match(r"[^@]+@[^@]+\.[^@]+", email) is not None

def validate_username(username):
    return re.match(r"^\w{3,20}$", username) is not None

def validate_password(password):
    return len(password) >= 6 and re.search(r"\d", password)

def validate_date(date_string):
    try:
        datetime.strptime(date_string, "%Y-%m-%d")
        return True
    except ValueError:
        return False

# -----------------------------
# AUTH ROUTES
# -----------------------------
@auth_routes.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = data.get("email")
    username = data.get("username")
    password = data.get("password")

    if not all([email, username, password]):
        return jsonify({"success": False, "message": "All fields are required"}), 400
    if not validate_email(email):
        return jsonify({"success": False, "message": "Invalid email"}), 400
    if not validate_username(username):
        return jsonify({"success": False, "message": "Invalid username (3-20 chars, letters/numbers/_ only)"}), 400
    if not validate_password(password):
        return jsonify({"success": False, "message": "Password too weak (min 6 chars, must contain number)"}), 400

    conn = get_db()
    cursor = conn.cursor()

    # Only check email uniqueness, username can be duplicate
    if cursor.execute("SELECT id FROM users WHERE email=?", (email,)).fetchone():
        conn.close()
        return jsonify({"success": False, "message": "Email already exists"}), 400

    hashed_password = generate_password_hash(password)
    cursor.execute(
        "INSERT INTO users (email, username, password) VALUES (?, ?, ?)",
        (email, username, hashed_password)
    )
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()

    return jsonify({"success": True, "userId": user_id}), 201


@auth_routes.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    if not all([email, password]):
        return jsonify({"success": False, "message": "Email and password are required"}), 400

    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
    conn.close()

    if not user or not check_password_hash(user["password"], password):
        return jsonify({"success": False, "message": "Invalid credentials"}), 400

    # ✅ Store user_id in session
    session["user_id"] = user["id"]

    return jsonify({"success": True, "userId": user["id"]}), 200




@auth_routes.route("/reset-password", methods=["POST"])
def request_password_reset():
    data = request.get_json() or {}
    email = data.get("email")

    if not email:
        return jsonify({"success": False, "message": "Email is required"}), 400
    if not validate_email(email):
        return jsonify({"success": False, "message": "Invalid email"}), 400

    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
    if not user:
        conn.close()
        return jsonify({"success": False, "message": "Email not found"}), 404

    token = str(uuid.uuid4())
    expiry = (datetime.utcnow() + timedelta(hours=1)).isoformat()
    conn.execute(
        "INSERT INTO reset_tokens (user_id, token, expiry) VALUES (?, ?, ?)",
        (user["id"], token, expiry)
    )
    conn.commit()
    conn.close()

    return jsonify({"success": True, "token": token}), 200


@auth_routes.route("/reset-password/<token>", methods=["POST"])
def reset_password(token):
    data = request.get_json() or {}
    new_password = data.get("password")

    if not new_password:
        return jsonify({"success": False, "message": "New password is required"}), 400
    if not validate_password(new_password):
        return jsonify({"success": False, "message": "Password too weak (min 6 chars, must contain number)"}), 400

    conn = get_db()
    token_row = conn.execute(
        "SELECT * FROM reset_tokens WHERE token=?", (token,)
    ).fetchone()

    if not token_row:
        conn.close()
        return jsonify({"success": False, "message": "Invalid token"}), 400
    if datetime.utcnow() > datetime.fromisoformat(token_row["expiry"]):
        conn.close()
        return jsonify({"success": False, "message": "Token expired"}), 400

    hashed_password = generate_password_hash(new_password)
    conn.execute(
        "UPDATE users SET password=? WHERE id=?",
        (hashed_password, token_row["user_id"])
    )
    conn.execute("DELETE FROM reset_tokens WHERE token=?", (token,))
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "Password reset successful"}), 200


# -----------------------------
# CROP ROUTES
# -----------------------------
@crop_routes.route("/crop/<int:user_id>", methods=["POST"])
def add_crop(user_id):
    data = request.get_json() or {}
    name = data.get("name")
    area = data.get("area")
    planting_date = data.get("planting_date")

    if not name or not isinstance(name, str) or name.strip() == "":
        return jsonify({"error": "Crop name must be a non-empty string."}), 400

    try:
        area = float(area)
        if area <= 0:
            return jsonify({"error": "Area must be a positive number."}), 400
    except:
        return jsonify({"error": "Area must be a number."}), 400

    if not planting_date or not validate_date(planting_date):
        return jsonify({"error": "Invalid or missing planting date."}), 400

    conn = get_db()
    conn.execute(
        "INSERT INTO crops (user_id, name, area, planting_date) VALUES (?, ?, ?, ?)",
        (user_id, name.strip(), area, planting_date)
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "Crop added successfully!"}), 201


@crop_routes.route("/crop/<int:user_id>", methods=["GET"])
def get_crops(user_id):
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 5, type=int)

    if page < 1 or limit < 1:
        return jsonify({"error": "Invalid pagination values"}), 400

    offset = (page - 1) * limit

    conn = get_db()
    crops = conn.execute(
        "SELECT * FROM crops WHERE user_id=? LIMIT ? OFFSET ?",
        (user_id, limit, offset)
    ).fetchall()

    total = conn.execute(
        "SELECT COUNT(*) FROM crops WHERE user_id=?",
        (user_id,)
    ).fetchone()[0]

    conn.close()

    return jsonify({
        "data": [dict(c) for c in crops],
        "page": page,
        "limit": limit,
        "total": total
    }), 200


@crop_routes.route("/crop/<int:crop_id>/<int:user_id>", methods=["PUT"])
def update_crop(crop_id, user_id):
    data = request.get_json() or {}
    name = data.get("name")
    area = data.get("area")
    planting_date = data.get("planting_date")

    if not name or not isinstance(name, str) or name.strip() == "":
        return jsonify({"error": "Crop name must be a non-empty string."}), 400

    try:
        area = float(area)
        if area <= 0:
            return jsonify({"error": "Area must be a positive number."}), 400
    except:
        return jsonify({"error": "Area must be a number."}), 400

    if not planting_date or not validate_date(planting_date):
        return jsonify({"error": "Invalid or missing planting date."}), 400

    conn = get_db()
    crop = conn.execute(
        "SELECT * FROM crops WHERE id=? AND user_id=?",
        (crop_id, user_id)
    ).fetchone()

    if not crop:
        conn.close()
        return jsonify({"error": "Unauthorized or invalid crop"}), 403

    conn.execute(
        "UPDATE crops SET name=?, area=?, planting_date=? WHERE id=?",
        (name.strip(), area, planting_date, crop_id)
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "Crop updated successfully!"}), 200


@crop_routes.route("/crop/<int:crop_id>/<int:user_id>", methods=["DELETE"])
def delete_crop(crop_id, user_id):
    conn = get_db()
    crop = conn.execute(
        "SELECT * FROM crops WHERE id=? AND user_id=?",
        (crop_id, user_id)
    ).fetchone()

    if not crop:
        conn.close()
        return jsonify({"error": "Unauthorized or invalid crop"}), 403

    conn.execute("DELETE FROM crops WHERE id=?", (crop_id,))
    conn.commit()
    conn.close()

    return jsonify({"message": "Crop deleted successfully!"}), 200
