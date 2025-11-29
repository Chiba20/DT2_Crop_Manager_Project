from flask_sqlalchemy import SQLAlchemy
from datetime import date, datetime

db = SQLAlchemy()

class Crop(db.Model):
    __tablename__ = "crops"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False, unique=True)
    area = db.Column(db.Float, nullable=True)
    planted_date = db.Column(db.Date, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "area": self.area,
            "planted_date": self.planted_date.isoformat() if self.planted_date else None,
        }

class Harvest(db.Model):
    __tablename__ = "harvests"
    id = db.Column(db.Integer, primary_key=True)
    crop_id = db.Column(db.Integer, db.ForeignKey("crops.id"), nullable=False)
    crop = db.relationship("Crop", backref="harvests")
    yield_kg = db.Column(db.Float, nullable=False)
    date = db.Column(db.Date, nullable=False, default=lambda: date.today())

    def to_dict(self):
        return {
            "id": self.id,
            "crop_id": self.crop_id,
            "crop": self.crop.name if self.crop else None,
            "yield": self.yield_kg,
            "date": self.date.isoformat(),
        }
