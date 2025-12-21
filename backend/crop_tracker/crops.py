from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import uuid
import re

from crop_tracker.model import get_db

# -----------------------------
# Blueprints
# -----------------------------
auth_routes = Blueprint("auth_routes", __name__, url_prefix="/api")
crop_routes = Blueprint("crop_routes", __name__, url_prefix="/api")

# -----------------------------
# Helpers (DB compatibility)
# -----------------------------
def is_postgres_connection(conn) -> bool:
    # psycopg2 connections have a "cursor" method but sqlite also has.
    # The easiest safe check: sqlite connections are sqlite3.Connection
    try:
        import sqlite3  # local import
        return not isinstance(conn, sqlite3.Connection)
    except Exception:
        # If sqlite3 is unavailable for some reason, assume postgres
        return True

def placeholder(conn) -> str:
    # SQLite uses "?" ; PostgreSQL uses "%s"
    return "%s" if is_postgres_connection(conn) else "?"

def row_to_dict(row):
    # sqlite3.Row -> dict, psycopg2 RealDictCursor row is already dict
    if row is None:
        return None
    if isinstance(row, dict):
        return row
    try:
        return dict(row)
    except Exception:
        return row

def fetchone(cur, conn):
    row = cur.fetchone()
    return row_to_dict(row)

def fetchall(cur, conn):
    rows = cur.fetchall()
    return [row_to_dict(r) for r in rows]

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
    cur = conn.cursor()
    ph = placeholder(conn)

    # Email uniqueness check
    cur.execute(f"SELECT id FROM users WHERE email={ph}", (email,))
    existing = fetchone(cur, conn)
    if existing:
        conn.close()
        return jsonify({"success": False, "message": "Email already exists"}), 400

    hashed_password = generate_password_hash(password)

    # Insert user
    cur.execute(
        f"INSERT INTO users (email, username, password) VALUES ({ph}, {ph}, {ph})",
        (email, username, hashed_password),
    )
    conn.commit()

    # Get inserted id (works for both DBs)
    if is_postgres_connection(conn):
        cur.execute("SELECT LASTVAL() AS id")
        new_row = fetchone(cur, conn)
        user_id = int(new_row["id"]) if new_row and "id" in new_row else None
    else:
        user_id = cur.lastrowid

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
    cur = conn.cursor()
    ph = placeholder(conn)

    cur.execute(f"SELECT * FROM users WHERE email={ph}", (email,))
    user = fetchone(cur, conn)
    conn.close()

    if not user or not check_password_hash(user["password"], password):
        return jsonify({"success": False, "message": "Invalid credentials"}), 400

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
    cur = conn.cursor()
    ph = placeholder(conn)

    cur.execute(f"SELECT * FROM users WHERE email={ph}", (email,))
    user = fetchone(cur, conn)
    if not user:
        conn.close()
        return jsonify({"success": False, "message": "Email not found"}), 404

    token = str(uuid.uuid4())
    expiry_dt = datetime.utcnow() + timedelta(hours=1)

    # Store expiry consistently
    expiry_value = expiry_dt  # postgres TIMESTAMP can store datetime directly
    if not is_postgres_connection(conn):
        expiry_value = expiry_dt.isoformat()  # sqlite stores as text

    cur.execute(
        f"INSERT INTO reset_tokens (user_id, token, expiry) VALUES ({ph}, {ph}, {ph})",
        (user["id"], token, expiry_value),
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
    cur = conn.cursor()
    ph = placeholder(conn)

    cur.execute(f"SELECT * FROM reset_tokens WHERE token={ph}", (token,))
    token_row = fetchone(cur, conn)

    if not token_row:
        conn.close()
        return jsonify({"success": False, "message": "Invalid token"}), 400

    # Expiry check
    expiry_val = token_row["expiry"]
    if is_postgres_connection(conn):
        # postgres returns datetime
        expiry_dt = expiry_val
    else:
        # sqlite stores iso string
        expiry_dt = datetime.fromisoformat(expiry_val)

    if datetime.utcnow() > expiry_dt:
        conn.close()
        return jsonify({"success": False, "message": "Token expired"}), 400

    hashed_password = generate_password_hash(new_password)

    cur.execute(
        f"UPDATE users SET password={ph} WHERE id={ph}",
        (hashed_password, token_row["user_id"]),
    )
    cur.execute(f"DELETE FROM reset_tokens WHERE token={ph}", (token,))
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
    except Exception:
        return jsonify({"error": "Area must be a number."}), 400

    if not planting_date or not validate_date(planting_date):
        return jsonify({"error": "Invalid or missing planting date."}), 400

    conn = get_db()
    cur = conn.cursor()
    ph = placeholder(conn)

    cur.execute(
        f"INSERT INTO crops (user_id, name, area, planting_date) VALUES ({ph}, {ph}, {ph}, {ph})",
        (user_id, name.strip(), area, planting_date),
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
    cur = conn.cursor()
    ph = placeholder(conn)

    # PostgreSQL cannot parameterize LIMIT/OFFSET as easily in some drivers,
    # so we keep LIMIT/OFFSET as integers via safe formatting.
    cur.execute(
        f"SELECT * FROM crops WHERE user_id={ph} ORDER BY id DESC LIMIT {int(limit)} OFFSET {int(offset)}",
        (user_id,),
    )
    crops = fetchall(cur, conn)

    cur.execute(f"SELECT COUNT(*) AS total FROM crops WHERE user_id={ph}", (user_id,))
    total_row = fetchone(cur, conn)
    total = int(total_row["total"]) if total_row and "total" in total_row else 0

    conn.close()

    return jsonify({
        "data": crops,
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
    except Exception:
        return jsonify({"error": "Area must be a number."}), 400

    if not planting_date or not validate_date(planting_date):
        return jsonify({"error": "Invalid or missing planting date."}), 400

    conn = get_db()
    cur = conn.cursor()
    ph = placeholder(conn)

    cur.execute(
        f"SELECT * FROM crops WHERE id={ph} AND user_id={ph}",
        (crop_id, user_id),
    )
    crop = fetchone(cur, conn)

    if not crop:
        conn.close()
        return jsonify({"error": "Unauthorized or invalid crop"}), 403

    cur.execute(
        f"UPDATE crops SET name={ph}, area={ph}, planting_date={ph} WHERE id={ph}",
        (name.strip(), area, planting_date, crop_id),
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "Crop updated successfully!"}), 200


@crop_routes.route("/crop/<int:crop_id>/<int:user_id>", methods=["DELETE"])
def delete_crop(crop_id, user_id):
    conn = get_db()
    cur = conn.cursor()
    ph = placeholder(conn)

    cur.execute(
        f"SELECT * FROM crops WHERE id={ph} AND user_id={ph}",
        (crop_id, user_id),
    )
    crop = fetchone(cur, conn)

    if not crop:
        conn.close()
        return jsonify({"error": "Unauthorized or invalid crop"}), 403

    cur.execute(f"DELETE FROM crops WHERE id={ph}", (crop_id,))
    conn.commit()
    conn.close()

    return jsonify({"message": "Crop deleted successfully!"}), 200
