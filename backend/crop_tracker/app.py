from flask import Flask
from flask_cors import CORS
from model import init_db
from routes import crop_routes, auth_routes

app = Flask(__name__)
app.config["SECRET_KEY"] = "MYSECRET"

CORS(app)
init_db()

# Register blueprints
app.register_blueprint(crop_routes)
app.register_blueprint(auth_routes)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
