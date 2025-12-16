from flask import Blueprint
crops_bp = Blueprint("crops", __name__)
from . import routes
