# testpredict.py (FULL) — Seeds realistic acres + kg and tests /api/predict

import sys
import os

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from app import app
from crop_tracker.model import get_db, init_db, DB_PATH

print("Database path:", DB_PATH)

init_db()
conn = get_db()
cur = conn.cursor()

# Clean tables
cur.execute("DELETE FROM harvests")
cur.execute("DELETE FROM crops")
cur.execute("DELETE FROM users")
cur.execute("DELETE FROM reset_tokens")
conn.commit()

# Insert a user
cur.execute(
    "INSERT INTO users (email, username, password) VALUES (?, ?, ?)",
    ("test@example.com", "tester", "pass123")
)
user_id = cur.lastrowid

# Training crops: area in acres
crops = [
    (user_id, "Maize", 2.0, "2024-03-10"),  # Long rains
    (user_id, "Maize", 3.0, "2024-04-15"),  # Long rains
    (user_id, "Maize", 4.0, "2024-11-20"),  # Short rains
]
for c in crops:
    cur.execute("INSERT INTO crops (user_id, name, area, planting_date) VALUES (?, ?, ?, ?)", c)
conn.commit()

cur.execute("SELECT id FROM crops WHERE user_id=? AND name=? ORDER BY id", (user_id, "Maize"))
crop_ids = [r[0] for r in cur.fetchall()]

# Harvest yields in kg
# Target kg/acre around 600–750 (reasonable)
harvests = [
    (crop_ids[0], "2024-06-01", 1300.0),  # 2 acres -> 650 kg/acre
    (crop_ids[1], "2024-07-10", 2100.0),  # 3 acres -> 700 kg/acre
    (crop_ids[2], "2025-02-10", 2480.0),  # 4 acres -> 620 kg/acre
]
for h in harvests:
    cur.execute("INSERT INTO harvests (crop_id, date, yield_amount) VALUES (?, ?, ?)", h)
conn.commit()

# New crop to predict
cur.execute(
    "INSERT INTO crops (user_id, name, area, planting_date) VALUES (?, ?, ?, ?)",
    (user_id, "Maize", 2.5, "2025-03-15")
)
conn.commit()
new_crop_id = cur.lastrowid
conn.close()

# Test call
with app.test_client() as client:
    resp = client.get(f"/api/predict/{new_crop_id}?user_id={user_id}")
    print("Status code:", resp.status_code)
    print("Response JSON:", resp.get_json())
