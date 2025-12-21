# testpredict.py (FULL) — Seeds realistic acres + kg and tests /api/predict
import sys
import os

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from app import app
from crop_tracker.model import get_db, init_db

def is_postgres(conn) -> bool:
    try:
        import sqlite3
        return not isinstance(conn, sqlite3.Connection)
    except Exception:
        return True

def ph(conn) -> str:
    return "%s" if is_postgres(conn) else "?"

def last_insert_id(conn, cur, table_name: str):
    """
    SQLite: cursor.lastrowid
    Postgres: SELECT LASTVAL()
    """
    if is_postgres(conn):
        cur.execute("SELECT LASTVAL() AS id")
        row = cur.fetchone()
        return int(row["id"] if isinstance(row, dict) else row[0])
    return cur.lastrowid

# Initialize DB (for SQLite only; postgres tables should already exist)
init_db()

conn = get_db()
cur = conn.cursor()
p = ph(conn)

# Clean tables (order matters because of FK)
cur.execute("DELETE FROM harvests")
cur.execute("DELETE FROM crops")
cur.execute("DELETE FROM reset_tokens")
cur.execute("DELETE FROM users")
conn.commit()

# Insert a user
cur.execute(
    f"INSERT INTO users (email, username, password) VALUES ({p}, {p}, {p})",
    ("test@example.com", "tester", "pass123")
)
conn.commit()
user_id = last_insert_id(conn, cur, "users")

# Training crops: area in acres
crops = [
    (user_id, "Maize", 2.0, "2024-03-10"),
    (user_id, "Maize", 3.0, "2024-04-15"),
    (user_id, "Maize", 4.0, "2024-11-20"),
]
for c in crops:
    cur.execute(
        f"INSERT INTO crops (user_id, name, area, planting_date) VALUES ({p}, {p}, {p}, {p})",
        c
    )
conn.commit()

# Fetch crop ids
cur.execute(
    f"SELECT id FROM crops WHERE user_id={p} AND name={p} ORDER BY id",
    (user_id, "Maize")
)
rows = cur.fetchall()

# rows could be dicts or tuples depending on cursor type
crop_ids = []
for r in rows:
    if isinstance(r, dict):
        crop_ids.append(r["id"])
    else:
        crop_ids.append(r[0])

# Harvest yields in kg (reasonable kg/acre)
harvests = [
    (crop_ids[0], "2024-06-01", 1300.0),
    (crop_ids[1], "2024-07-10", 2100.0),
    (crop_ids[2], "2025-02-10", 2480.0),
]
for h in harvests:
    cur.execute(
        f"INSERT INTO harvests (crop_id, date, yield_amount) VALUES ({p}, {p}, {p})",
        h
    )
conn.commit()

# New crop to predict
cur.execute(
    f"INSERT INTO crops (user_id, name, area, planting_date) VALUES ({p}, {p}, {p}, {p})",
    (user_id, "Maize", 2.5, "2025-03-15")
)
conn.commit()
new_crop_id = last_insert_id(conn, cur, "crops")

conn.close()

# Test call
with app.test_client() as client:
    resp = client.get(f"/api/predict/{new_crop_id}?user_id={user_id}")
    print("Status code:", resp.status_code)
    print("Response JSON:", resp.get_json())
