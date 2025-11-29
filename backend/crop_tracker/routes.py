# routes.py
from flask import Blueprint, request, jsonify
from config import db
from models import Crop
from datetime import datetime
from sqlalchemy.exc import SQLAlchemyError

crop_routes = Blueprint("crops", __name__)

def parse_date_iso(s):
    """Parse YYYY-MM-DD string into date. Raise ValueError if invalid."""
    return datetime.strptime(s, "%Y-%m-%d").date()

# -----------------------------
# POST /crops → Add a new crop
# -----------------------------
@crop_routes.route("/crops", methods=["POST"])
def add_crop():
    data = request.get_json(silent=True) or {}
    required_fields = ["name", "area", "planting_date"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"{field} is required"}), 400

    # Validate name
    name = str(data.get("name")).strip()
    if not name:
        return jsonify({"error": "name cannot be empty"}), 400

    # Validate area
    try:
        area = float(data.get("area"))
        if area <= 0:
            return jsonify({"error": "area must be a positive number"}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "area must be a number (e.g. 1.5)"}), 400

    # Validate planting_date
    try:
        pd = parse_date_iso(data.get("planting_date"))
    except (ValueError, TypeError):
        return jsonify({"error": "planting_date must be in YYYY-MM-DD format"}), 400

    crop = Crop(name=name, area=area, planting_date=pd)
    try:
        db.session.add(crop)
        db.session.commit()
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": "database error", "detail": str(e)}), 500

    return jsonify({"message": "Crop added successfully", "crop": crop.to_dict()}), 201


# -----------------------------
# GET /crops → Get all crops
# -----------------------------
@crop_routes.route("/crops", methods=["GET"])
def get_crops():
    crops = Crop.query.order_by(Crop.created_at.desc()).all()
    return jsonify([c.to_dict() for c in crops]), 200


# ----------------------------------------------------
# PUT /crops/<id>/harvest → Record harvest safely
# ----------------------------------------------------
@crop_routes.route("/crops/<int:crop_id>/harvest", methods=["PUT"])
def record_harvest(crop_id):
    crop = Crop.query.get_or_404(crop_id)
    data = request.get_json(silent=True) or {}

    if "harvest_amount" not in data:
        return jsonify({"error": "harvest_amount is required"}), 400

    # Validate amount
    try:
        amt = float(data.get("harvest_amount"))
        if amt < 0:
            return jsonify({"error": "harvest_amount must be non-negative"}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "harvest_amount must be a number"}), 400

    # optional: harvest_date (YYYY-MM-DD)
    harvest_date = data.get("harvest_date")
    if harvest_date:
        try:
            _ = parse_date_iso(harvest_date)  # we parse only to validate; you can store if you add a Harvest model later
        except (ValueError, TypeError):
            return jsonify({"error": "harvest_date must be in YYYY-MM-DD format if provided"}), 400

    unit = data.get("unit") or data.get("harvest_unit") or "kg"

    # Update
    crop.harvested = True
    crop.harvest_amount = amt
    crop.harvest_unit = str(unit)

    try:
        db.session.commit()
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": "database error", "detail": str(e)}), 500

    return jsonify({"message": "Harvest recorded", "crop": crop.to_dict()}), 200


# UPDATE /crops/<id> → Update crop information
@crop_routes.route("/crops/<int:crop_id>", methods=["PUT"])
def update_crop(crop_id):
    crop = Crop.query.get_or_404(crop_id)
    data = request.get_json(silent=True) or {}

    # Validate optional fields if provided
    if "name" in data:
        name = str(data.get("name")).strip()
        if not name:
            return jsonify({"error": "name cannot be empty"}), 400
        crop.name = name

    if "area" in data:
        try:
            area = float(data.get("area"))
            if area <= 0:
                return jsonify({"error": "area must be a positive number"}), 400
            crop.area = area
        except (ValueError, TypeError):
            return jsonify({"error": "area must be a number"}), 400

    if "planting_date" in data:
        try:
            pd = parse_date_iso(data.get("planting_date"))
            crop.planting_date = pd
        except (ValueError, TypeError):
            return jsonify({"error": "planting_date must be in YYYY-MM-DD format"}), 400

    try:
        db.session.commit()
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": "database error", "detail": str(e)}), 500

    return jsonify({"message": "Crop updated successfully", "crop": crop.to_dict()}), 200


# DELETE /crops/<id> → Delete a crop
@crop_routes.route("/crops/<int:crop_id>", methods=["DELETE"])
def delete_crop(crop_id):
    crop = Crop.query.get_or_404(crop_id)
    try:
        db.session.delete(crop)
        db.session.commit()
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": "database error", "detail": str(e)}), 500

    return jsonify({"message": "Crop deleted successfully"}), 200
