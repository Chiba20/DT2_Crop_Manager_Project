from marshmallow import Schema, fields, validate

class CropCreateSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=2, max=80))
    crop_type = fields.Str(required=True, validate=validate.Length(min=2, max=80))
    area_acres = fields.Float(required=True, validate=validate.Range(min=0.0001))
    planting_date = fields.Date(required=True)

class HarvestCreateSchema(Schema):
    harvested_on = fields.Date(required=True)
    yield_kg = fields.Float(required=True, validate=validate.Range(min=0.0001))
