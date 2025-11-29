# models.py
from config import db
from datetime import date

class Crop(db.Model):
    __tablename__ = "crops"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    area = db.Column(db.Float, nullable=False)                    # area in acres (float)
    planting_date = db.Column(db.Date, nullable=False)            # stored as Date
    harvested = db.Column(db.Boolean, default=False)
    harvest_amount = db.Column(db.Float, default=0.0)             # quantity in chosen unit
    harvest_unit = db.Column(db.String(30), default="kg")         # unit, default kg
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "area": self.area,
            # convert date to ISO string for frontend
            "planting_date": self.planting_date.isoformat() if isinstance(self.planting_date, date) else None,
            "harvested": self.harvested,
            "harvest_amount": self.harvest_amount,
            "harvest_unit": self.harvest_unit,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
