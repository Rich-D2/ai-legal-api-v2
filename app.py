from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS
import os
import json
import jwt
from datetime import datetime, timedelta
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__, static_folder="build", static_url_path="/")
CORS(app)
USERS_FILE = "users.json"

# Initialize users file
if not os.path.exists(USERS_FILE):
    with open(USERS_FILE, "w") as f:
        json.dump([], f)
    os.chmod(USERS_FILE, 0o666)

app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "your-secret-key")

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
        if not token:
            return jsonify({"error": "Token is missing"}), 401
        try:
            data = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
            request.user_id = data["user_id"]
        except:
            return jsonify({"error": "Token is invalid"}), 401
        return f(*args, **kwargs)
    return decorated

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    try:
        if path and path.startswith("api/"):
            return jsonify({"error": "API route not found"}), 404
        index_path = os.path.join(app.static_folder, "index.html")
        if os.path.exists(index_path):
            return send_from_directory(app.static_folder, "index.html")
        return jsonify({"error": "React build folder not found."}), 500
    except Exception as e:
        return jsonify({"error": "Server error"}), 500

@app.route("/api/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")
        with open(USERS_FILE, "r") as f:
            users = json.load(f)
        for user in users:
            if user["email"] == email and check_password_hash(user["password"], password):
                token = jwt.encode({
                    "user_id": user["id"],
                    "exp": datetime.utcnow() + timedelta(hours=24)
                }, app.config["SECRET_KEY"], algorithm="HS256")
                return jsonify({"token": token})
        return jsonify({"error": "Invalid credentials"}), 401
    except Exception as e:
        return jsonify({"error": "Server error during login"}), 500

@app.route("/api/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")
        with open(USERS_FILE, "r+") as f:
            users = json.load(f)
            if any(user["email"] == email for user in users):
                return jsonify({"error": "User already exists"}), 400
            new_user = {
                "id": str(uuid.uuid4()),
                "email": email,
                "password": generate_password_hash(password)
            }
            users.append(new_user)
            f.seek(0)
            json.dump(users, f)
        return jsonify({"message": "User registered"}), 201
    except Exception as e:
        return jsonify({"error": "Server error during registration"}), 500

@app.route("/api/customer", methods=["GET"])
@token_required
def customer():
    return jsonify({"message": "Customer dashboard data"})

@app.route("/api/paralegal", methods=["GET"])
@token_required
def paralegal():
    return jsonify({"message": "Paralegal dashboard data"})

@app.route("/api/lawyer", methods=["GET"])
@token_required
def lawyer():
    return jsonify({"message": "Lawyer dashboard data"})

@app.route("/api/admin", methods=["GET"])
@token_required
def admin():
    return jsonify({"message": "Admin dashboard data"})

if __name__ == "__main__":
    app.run()
