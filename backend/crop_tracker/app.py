# app.py
from config import create_app, db
from routes import crop_routes

app = create_app()
app.register_blueprint(crop_routes)

# Create database tables if not exist
with app.app_context():
    db.create_all()

if __name__ == "__main__":
    # debug True is ok for development only
    app.run(debug=True, host="0.0.0.0", port=5000)
