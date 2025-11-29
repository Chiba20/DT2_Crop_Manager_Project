from flask import Blueprint, request, jsonify
from models import db, Crop, Harvest
from datetime import datetime

bp = Blueprint("crop_tracker", __name__)

@bp.route("/", methods=["GET"])
def list_crops():
    crops = Crop.query.order_by(Crop.name).all()
    return jsonify([c.to_dict() for c in crops])

@bp.route("/", methods=["POST"])
def add_crop():
    data = request.json or {}
    name = data.get("name")
    if not name:
        return jsonify({"error": "name is required"}), 400
    area = data.get("area")
    planted_date = data.get("planted_date")
    pd = None
    if planted_date:
        try:
            pd = datetime.fromisoformat(planted_date).date()
        except Exception:
            return jsonify({"error": "invalid planted_date, use YYYY-MM-DD"}), 400

    crop = Crop(name=name, area=area, planted_date=pd)
    db.session.add(crop)
    db.session.commit()
    return jsonify(crop.to_dict()), 201

@bp.route("/<int:crop_id>/record_harvest", methods=["POST"])
def record_harvest(crop_id):
    crop = Crop.query.get(crop_id)
    if not crop:
        return jsonify({"error": "crop not found"}), 404
    data = request.json or {}
    try:
        y = float(data.get("yield", 0))
    except Exception:
        return jsonify({"error":"invalid yield"}), 400
    date_str = data.get("date")
    d = None
    if date_str:
        try:
            d = datetime.fromisoformat(date_str).date()
        except Exception:
            return jsonify({"error":"invalid date"}), 400
    else:
        d = datetime.utcnow().date()

    harvest = Harvest(crop_id=crop.id, yield_kg=y, date=d)
    db.session.add(harvest)
    db.session.commit()
    return jsonify(harvest.to_dict()), 201
