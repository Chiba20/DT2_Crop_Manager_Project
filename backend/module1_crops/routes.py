from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity

from . import crops_bp
from extensions import db
from models import Crop, Harvest
from common.responses import ok, fail
from .schemas import CropCreateSchema, HarvestCreateSchema

@crops_bp.post("")
@jwt_required()
def add_crop():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    try:
        payload = CropCreateSchema().load(data)
    except Exception as e:
        return fail("Validation error", 400, getattr(e, "messages", str(e)))

    crop = Crop(user_id=user_id, **payload)
    db.session.add(crop)
    db.session.commit()

    return ok({
        "id": crop.id,
        "name": crop.name,
        "crop_type": crop.crop_type,
        "area_acres": crop.area_acres,
        "planting_date": crop.planting_date.isoformat()
    }, 201)

@crops_bp.get("")
@jwt_required()
def list_crops():
    user_id = get_jwt_identity()
    crops = Crop.query.filter_by(user_id=user_id).order_by(Crop.id.desc()).all()
    return ok([{
        "id": c.id,
        "name": c.name,
        "crop_type": c.crop_type,
        "area_acres": c.area_acres,
        "planting_date": c.planting_date.isoformat()
    } for c in crops])

@crops_bp.put("/<int:crop_id>/harvest")
@jwt_required()
def record_harvest(crop_id):
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    try:
        payload = HarvestCreateSchema().load(data)
    except Exception as e:
        return fail("Validation error", 400, getattr(e, "messages", str(e)))

    crop = Crop.query.filter_by(id=crop_id, user_id=user_id).first()
    if not crop:
        return fail("Crop not found", 404)

    h = Harvest(
        user_id=user_id,
        crop_id=crop.id,
        harvested_on=payload["harvested_on"],
        yield_kg=payload["yield_kg"],
    )
    db.session.add(h)
    db.session.commit()

    return ok({
        "id": h.id,
        "crop_id": h.crop_id,
        "harvested_on": h.harvested_on.isoformat(),
        "yield_kg": h.yield_kg,
        "crop_name": crop.name,
        "crop_type": crop.crop_type
    }, 200)
