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


# -------------------------------
# Helpers (SQLite + Postgres compatible)
# -------------------------------
def is_postgres(conn) -> bool:
    try:
        import sqlite3
        return not isinstance(conn, sqlite3.Connection)
    except Exception:
        return True


def ph(conn) -> str:
    # placeholder
    return "%s" if is_postgres(conn) else "?"


def row_to_dict(row):
    if row is None:
        return None
    if isinstance(row, dict):
        return row
    try:
        return dict(row)
    except Exception:
        return row


def rows_to_list(rows):
    return [row_to_dict(r) for r in rows]


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
    cur = conn.cursor()
    p = ph(conn)

    # Ownership check
    cur.execute(
        f"SELECT * FROM crops WHERE id={p} AND user_id={p}",
        (crop_id, user_id)
    )
    crop = row_to_dict(cur.fetchone())

    if not crop:
        conn.close()
        return jsonify({"error": "Unauthorized or invalid crop"}), 403

    # Insert harvest
    cur.execute(
        f"INSERT INTO harvests (crop_id, date, yield_amount) VALUES ({p}, {p}, {p})",
        (crop_id, date, yield_amount)
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "Harvest recorded successfully"}), 201


# =====================================================
# GET /api/harvests?user_id=1
# =====================================================
@harvest_routes.route("/harvests", methods=["GET"])
def get_harvests():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "User not logged in"}), 401

    conn = get_db()
    cur = conn.cursor()
    p = ph(conn)

    cur.execute(f"""
        SELECT h.id,
               c.name AS crop_name,
               h.date,
               h.yield_amount
        FROM harvests h
        JOIN crops c ON h.crop_id = c.id
        WHERE c.user_id = {p}
        ORDER BY h.date DESC
    """, (user_id,))
    harvests = rows_to_list(cur.fetchall())
    conn.close()

    return jsonify(harvests), 200


# =====================================================
# GET /api/harvests/stats?user_id=1
# =====================================================
@harvest_routes.route("/harvests/stats", methods=["GET"])
def get_harvest_stats():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "User not logged in"}), 401

    conn = get_db()
    cur = conn.cursor()
    p = ph(conn)

    cur.execute(f"""
        SELECT c.name AS crop_name,
               SUM(h.yield_amount) AS total_yield,
               AVG(h.yield_amount) AS avg_yield,
               COUNT(h.id) AS harvest_count,
               MAX(h.date) AS last_cropping_date
        FROM harvests h
        JOIN crops c ON h.crop_id = c.id
        WHERE c.user_id = {p}
        GROUP BY c.name
        ORDER BY total_yield DESC
    """, (user_id,))
    stats_rows = rows_to_list(cur.fetchall())
    conn.close()

    overall_total = sum(float((r.get("total_yield") or 0)) for r in stats_rows)

    return jsonify({
        "stats": [
            {
                "crop_name": r.get("crop_name"),
                "total_yield": float(r.get("total_yield") or 0),
                "avg_yield": float(r.get("avg_yield") or 0),
                "harvest_count": int(r.get("harvest_count") or 0),
                "last_cropping_date": r.get("last_cropping_date"),
            }
            for r in stats_rows
        ],
        "overall_total_yield": float(overall_total)
    }), 200


# =====================================================
# GET /api/harvests/summary/yearly?user_id=1
# =====================================================
@harvest_routes.route("/harvests/summary/yearly", methods=["GET"])
def summary_yearly():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "User not logged in"}), 401

    conn = get_db()
    cur = conn.cursor()
    p = ph(conn)
    pg = is_postgres(conn)

    if pg:
        cur.execute(f"""
            SELECT EXTRACT(YEAR FROM h.date)::INT AS year,
                   SUM(h.yield_amount) AS total_yield
            FROM harvests h
            JOIN crops c ON h.crop_id = c.id
            WHERE c.user_id = {p}
            GROUP BY year
            ORDER BY year
        """, (user_id,))
    else:
        cur.execute(f"""
            SELECT strftime('%Y', h.date) AS year,
                   SUM(h.yield_amount) AS total_yield
            FROM harvests h
            JOIN crops c ON h.crop_id = c.id
            WHERE c.user_id = {p}
            GROUP BY year
            ORDER BY year
        """, (user_id,))

    rows = rows_to_list(cur.fetchall())
    conn.close()

    yearly = []
    for r in rows:
        yearly.append({
            "year": str(r.get("year")),
            "total_yield": float(r.get("total_yield") or 0)
        })

    return jsonify({"yearly": yearly}), 200


# =====================================================
# GET /api/harvests/summary/top-crops-yearly?user_id=1&from=2023&to=2025&top=10
# =====================================================
@harvest_routes.route("/harvests/summary/top-crops-yearly", methods=["GET"])
def top_crops_yearly():
    user_id = request.args.get("user_id")
    year_from = request.args.get("from", type=int)
    year_to = request.args.get("to", type=int)
    top_n = request.args.get("top", default=10, type=int)

    if not user_id:
        return jsonify({"error": "User not logged in"}), 401
    if year_from is None or year_to is None:
        return jsonify({"error": "from and to years are required"}), 400
    if year_from > year_to:
        return jsonify({"error": "from year must be <= to year"}), 400

    top_n = max(1, min(top_n, 30))

    conn = get_db()
    cur = conn.cursor()
    p = ph(conn)
    pg = is_postgres(conn)

    # Top crops total
    if pg:
        cur.execute(f"""
            SELECT c.name AS crop_name,
                   SUM(h.yield_amount) AS total_yield
            FROM harvests h
            JOIN crops c ON h.crop_id = c.id
            WHERE c.user_id = {p}
              AND EXTRACT(YEAR FROM h.date)::INT BETWEEN {p} AND {p}
            GROUP BY c.name
            ORDER BY total_yield DESC
            LIMIT {int(top_n)}
        """, (user_id, year_from, year_to))
    else:
        cur.execute(f"""
            SELECT c.name AS crop_name,
                   SUM(h.yield_amount) AS total_yield
            FROM harvests h
            JOIN crops c ON h.crop_id = c.id
            WHERE c.user_id = {p}
              AND CAST(strftime('%Y', h.date) AS INTEGER) BETWEEN {p} AND {p}
            GROUP BY c.name
            ORDER BY total_yield DESC
            LIMIT {p}
        """, (user_id, year_from, year_to, top_n))

    top_rows = rows_to_list(cur.fetchall())
    top_names = [r["crop_name"] for r in top_rows]

    # Total by year (all crops)
    if pg:
        cur.execute(f"""
            SELECT EXTRACT(YEAR FROM h.date)::INT AS year,
                   SUM(h.yield_amount) AS total_yield
            FROM harvests h
            JOIN crops c ON h.crop_id = c.id
            WHERE c.user_id = {p}
              AND EXTRACT(YEAR FROM h.date)::INT BETWEEN {p} AND {p}
            GROUP BY year
            ORDER BY year
        """, (user_id, year_from, year_to))
    else:
        cur.execute(f"""
            SELECT CAST(strftime('%Y', h.date) AS INTEGER) AS year,
                   SUM(h.yield_amount) AS total_yield
            FROM harvests h
            JOIN crops c ON h.crop_id = c.id
            WHERE c.user_id = {p}
              AND CAST(strftime('%Y', h.date) AS INTEGER) BETWEEN {p} AND {p}
            GROUP BY year
            ORDER BY year
        """, (user_id, year_from, year_to))

    all_totals = rows_to_list(cur.fetchall())
    all_total_by_year = {int(r["year"]): float(r.get("total_yield") or 0) for r in all_totals}

    # Breakdown: year x crop (only top crops)
    top_year_crop = []
    if top_names:
        if pg:
            placeholders = ",".join([p] * len(top_names))
            cur.execute(f"""
                SELECT EXTRACT(YEAR FROM h.date)::INT AS year,
                       c.name AS crop_name,
                       SUM(h.yield_amount) AS total_yield
                FROM harvests h
                JOIN crops c ON h.crop_id = c.id
                WHERE c.user_id = {p}
                  AND EXTRACT(YEAR FROM h.date)::INT BETWEEN {p} AND {p}
                  AND c.name IN ({placeholders})
                GROUP BY year, c.name
                ORDER BY year, c.name
            """, (user_id, year_from, year_to, *top_names))
        else:
            placeholders = ",".join(["?"] * len(top_names))
            cur.execute(f"""
                SELECT CAST(strftime('%Y', h.date) AS INTEGER) AS year,
                       c.name AS crop_name,
                       SUM(h.yield_amount) AS total_yield
                FROM harvests h
                JOIN crops c ON h.crop_id = c.id
                WHERE c.user_id = ?
                  AND CAST(strftime('%Y', h.date) AS INTEGER) BETWEEN ? AND ?
                  AND c.name IN ({placeholders})
                GROUP BY year, c.name
                ORDER BY year, c.name
            """, (user_id, year_from, year_to, *top_names))

        top_year_crop = rows_to_list(cur.fetchall())

    conn.close()

    years = list(range(year_from, year_to + 1))
    year_map = {y: {"year": str(y)} for y in years}

    for r in top_year_crop:
        y = int(r["year"])
        year_map[y][r["crop_name"]] = float(r.get("total_yield") or 0)

    for y in years:
        for name in top_names:
            year_map[y].setdefault(name, 0.0)

        all_total = all_total_by_year.get(y, 0.0)
        top_sum = sum(float(year_map[y].get(name, 0.0) or 0.0) for name in top_names)
        year_map[y]["Others"] = max(0.0, all_total - top_sum)

    return jsonify({
        "from": year_from,
        "to": year_to,
        "top": top_n,
        "top_names": top_names,
        "series": [year_map[y] for y in years]
    }), 200


# =====================================================
# GET /api/harvests/filter/crop-year?user_id=1&crop=Maize&year=2024
# =====================================================
@harvest_routes.route("/harvests/filter/crop-year", methods=["GET"])
def crop_year_filter():
    user_id = request.args.get("user_id")
    crop = request.args.get("crop")
    year = request.args.get("year", type=int)

    if not user_id:
        return jsonify({"error": "User not logged in"}), 401
    if not crop:
        return jsonify({"error": "crop is required"}), 400
    if year is None:
        return jsonify({"error": "year is required"}), 400

    conn = get_db()
    cur = conn.cursor()
    p = ph(conn)
    pg = is_postgres(conn)

    # planted count
    if pg:
        cur.execute(f"""
            SELECT COUNT(*) AS planted_count
            FROM crops
            WHERE user_id = {p}
              AND name = {p}
              AND EXTRACT(YEAR FROM planting_date)::INT = {p}
        """, (user_id, crop, year))
    else:
        cur.execute(f"""
            SELECT COUNT(*) AS planted_count
            FROM crops
            WHERE user_id = {p}
              AND name = {p}
              AND CAST(strftime('%Y', planting_date) AS INTEGER) = {p}
        """, (user_id, crop, year))

    planted_row = row_to_dict(cur.fetchone())

    # harvest stats
    if pg:
        cur.execute(f"""
            SELECT COUNT(h.id) AS harvest_events,
                   COALESCE(SUM(h.yield_amount), 0) AS total_yield,
                   COALESCE(AVG(h.yield_amount), 0) AS avg_yield
            FROM harvests h
            JOIN crops c ON h.crop_id = c.id
            WHERE c.user_id = {p}
              AND c.name = {p}
              AND EXTRACT(YEAR FROM h.date)::INT = {p}
        """, (user_id, crop, year))
    else:
        cur.execute(f"""
            SELECT COUNT(h.id) AS harvest_events,
                   COALESCE(SUM(h.yield_amount), 0) AS total_yield,
                   COALESCE(AVG(h.yield_amount), 0) AS avg_yield
            FROM harvests h
            JOIN crops c ON h.crop_id = c.id
            WHERE c.user_id = {p}
              AND c.name = {p}
              AND CAST(strftime('%Y', h.date) AS INTEGER) = {p}
        """, (user_id, crop, year))

    harvest_row = row_to_dict(cur.fetchone())

    # monthly breakdown
    if pg:
        cur.execute(f"""
            SELECT EXTRACT(MONTH FROM h.date)::INT AS month,
                   COALESCE(SUM(h.yield_amount), 0) AS total_yield
            FROM harvests h
            JOIN crops c ON h.crop_id = c.id
            WHERE c.user_id = {p}
              AND c.name = {p}
              AND EXTRACT(YEAR FROM h.date)::INT = {p}
            GROUP BY month
            ORDER BY month
        """, (user_id, crop, year))
    else:
        cur.execute(f"""
            SELECT CAST(strftime('%m', h.date) AS INTEGER) AS month,
                   COALESCE(SUM(h.yield_amount), 0) AS total_yield
            FROM harvests h
            JOIN crops c ON h.crop_id = c.id
            WHERE c.user_id = {p}
              AND c.name = {p}
              AND CAST(strftime('%Y', h.date) AS INTEGER) = {p}
            GROUP BY month
            ORDER BY month
        """, (user_id, crop, year))

    monthly_rows = rows_to_list(cur.fetchall())
    conn.close()

    return jsonify({
        "crop": crop,
        "year": year,
        "planted_count": int(planted_row.get("planted_count") or 0),
        "harvest_events": int(harvest_row.get("harvest_events") or 0),
        "total_yield": float(harvest_row.get("total_yield") or 0),
        "avg_yield": float(harvest_row.get("avg_yield") or 0),
        "monthly": [{"month": int(r["month"]), "total_yield": float(r.get("total_yield") or 0)} for r in monthly_rows]
    }), 200


# =====================================================
# GET /api/harvests/seasonality?user_id=1&from=2023&to=2025
# =====================================================
@harvest_routes.route("/harvests/seasonality", methods=["GET"])
def seasonality():
    user_id = request.args.get("user_id")
    year_from = request.args.get("from", type=int)
    year_to = request.args.get("to", type=int)

    if not user_id:
        return jsonify({"error": "User not logged in"}), 401
    if year_from is None or year_to is None:
        return jsonify({"error": "from and to years are required"}), 400

    conn = get_db()
    cur = conn.cursor()
    p = ph(conn)
    pg = is_postgres(conn)

    if pg:
        cur.execute(f"""
            SELECT EXTRACT(MONTH FROM h.date)::INT AS month,
                   SUM(h.yield_amount) AS total_yield
            FROM harvests h
            JOIN crops c ON h.crop_id = c.id
            WHERE c.user_id = {p}
              AND EXTRACT(YEAR FROM h.date)::INT BETWEEN {p} AND {p}
            GROUP BY month
            ORDER BY month
        """, (user_id, year_from, year_to))
    else:
        cur.execute(f"""
            SELECT CAST(strftime('%m', h.date) AS INTEGER) AS month,
                   SUM(h.yield_amount) AS total_yield
            FROM harvests h
            JOIN crops c ON h.crop_id = c.id
            WHERE c.user_id = {p}
              AND CAST(strftime('%Y', h.date) AS INTEGER) BETWEEN {p} AND {p}
            GROUP BY month
            ORDER BY month
        """, (user_id, year_from, year_to))

    rows = rows_to_list(cur.fetchall())
    conn.close()

    return jsonify({
        "monthly": [{"month": int(r["month"]), "total_yield": float(r.get("total_yield") or 0)} for r in rows]
    }), 200


# =====================================================
# GET /api/harvests/distribution?user_id=1&from=2023&to=2025
# =====================================================
@harvest_routes.route("/harvests/distribution", methods=["GET"])
def distribution():
    user_id = request.args.get("user_id")
    year_from = request.args.get("from", type=int)
    year_to = request.args.get("to", type=int)

    if not user_id:
        return jsonify({"error": "User not logged in"}), 401
    if year_from is None or year_to is None:
        return jsonify({"error": "from and to years are required"}), 400

    conn = get_db()
    cur = conn.cursor()
    p = ph(conn)
    pg = is_postgres(conn)

    if pg:
        cur.execute(f"""
            SELECT
              CASE
                WHEN h.yield_amount < 10 THEN '0-9'
                WHEN h.yield_amount < 50 THEN '10-49'
                WHEN h.yield_amount < 100 THEN '50-99'
                WHEN h.yield_amount < 200 THEN '100-199'
                ELSE '200+'
              END AS label,
              COUNT(*) AS count
            FROM harvests h
            JOIN crops c ON h.crop_id = c.id
            WHERE c.user_id = {p}
              AND EXTRACT(YEAR FROM h.date)::INT BETWEEN {p} AND {p}
            GROUP BY label
            ORDER BY count DESC
        """, (user_id, year_from, year_to))
    else:
        cur.execute(f"""
            SELECT
              CASE
                WHEN h.yield_amount < 10 THEN '0-9'
                WHEN h.yield_amount < 50 THEN '10-49'
                WHEN h.yield_amount < 100 THEN '50-99'
                WHEN h.yield_amount < 200 THEN '100-199'
                ELSE '200+'
              END AS label,
              COUNT(*) AS count
            FROM harvests h
            JOIN crops c ON h.crop_id = c.id
            WHERE c.user_id = {p}
              AND CAST(strftime('%Y', h.date) AS INTEGER) BETWEEN {p} AND {p}
            GROUP BY label
            ORDER BY count DESC
        """, (user_id, year_from, year_to))

    rows = rows_to_list(cur.fetchall())
    conn.close()

    return jsonify({
        "buckets": [{"label": r["label"], "count": int(r.get("count") or 0)} for r in rows]
    }), 200
