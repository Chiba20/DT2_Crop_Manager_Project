# student2/backend/routes.py
from flask import Blueprint, request, jsonify
from model import get_db
import os

bp = Blueprint("harvest_routes", __name__)

# GET /api/harvests?from=YYYY-MM-DD&to=YYYY-MM-DD&cropId=1
@bp.route("/harvests", methods=["GET"])
def get_harvests():
    from_date = request.args.get("from")
    to_date = request.args.get("to")
    crop_id = request.args.get("cropId")

    q = """
      SELECT h.id, h.crop_id, c.name as crop_name, h.date as harvest_date, h.yield_amount
      FROM harvests h
      JOIN crops c ON c.id = h.crop_id
    """
    params = []
    conds = []
    if crop_id:
        conds.append("h.crop_id = ?")
        params.append(int(crop_id))
    if from_date:
        conds.append("date(h.date) >= date(?)")
        params.append(from_date)
    if to_date:
        conds.append("date(h.date) <= date(?)")
        params.append(to_date)
    if conds:
        q += " WHERE " + " AND ".join(conds)
    q += " ORDER BY date(h.date) DESC"

    conn = get_db()
    cur = conn.cursor()
    try:
        rows = cur.execute(q, tuple(params)).fetchall()
    finally:
        conn.close()

    harvests = []
    for r in rows:
        harvests.append({
            "id": r["id"],
            "cropId": r["crop_id"],
            "cropName": r["crop_name"],
            "harvestDate": r["harvest_date"],
            "yield": r["yield_amount"]
        })
    return jsonify({"harvests": harvests}), 200


# GET /api/harvests/stats?from=...&to=...
@bp.route("/harvests/stats", methods=["GET"])
def get_harvests_stats():
    from_date = request.args.get("from")
    to_date = request.args.get("to")

    q = """
      SELECT h.crop_id, c.name as crop_name,
             COUNT(h.id) as count,
             COALESCE(SUM(h.yield_amount),0) as sumYield,
             COALESCE(AVG(h.yield_amount),0) as avgYield
      FROM harvests h
      JOIN crops c ON c.id = h.crop_id
    """
    params = []
    conds = []
    if from_date:
        conds.append("date(h.date) >= date(?)")
        params.append(from_date)
    if to_date:
        conds.append("date(h.date) <= date(?)")
        params.append(to_date)
    if conds:
        q += " WHERE " + " AND ".join(conds)
    q += " GROUP BY h.crop_id, c.name ORDER BY sumYield DESC"

    conn = get_db()
    cur = conn.cursor()
    try:
        rows = cur.execute(q, tuple(params)).fetchall()

        total_q = "SELECT COALESCE(SUM(yield_amount),0) as totalYield, COUNT(id) as totalHarvests FROM harvests"
        if conds:
            total_q += " WHERE " + " AND ".join(conds)
            total_params = tuple(params)
        else:
            total_params = ()
        totals_row = cur.execute(total_q, total_params).fetchone()
    finally:
        conn.close()

    byCrop = []
    for r in rows:
        byCrop.append({
            "cropId": r["crop_id"],
            "cropName": r["crop_name"],
            "count": int(r["count"]),
            "sumYield": float(r["sumYield"]),
            "avgYield": float(r["avgYield"])
        })

    return jsonify({
        "totalYield": float(totals_row["totalYield"] or 0),
        "totalHarvests": int(totals_row["totalHarvests"] or 0),
        "byCrop": byCrop
    }), 200
