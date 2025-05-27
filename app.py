from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS
import os
import uuid
import json
import jwt
import boto3
from datetime import datetime, timedelta
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__, static_folder="build", static_url_path="/")
CORS(app)
UPLOAD_FOLDER = "uploads"
TASKS_FILE = "tasks.json"
USERS_FILE = "users.json"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["SECRET_KEY"] = "your-secret-key"  # Replace with a secure key
app.config["S3_BUCKET"] = "your-s3-bucket-name"  # Replace with your S3 bucket
app.config["S3_REGION"] = "us-east-1"  # Replace with your S3 region

# Initialize S3 client
s3_client = boto3.client(
    's3',
    aws_access_key_id="your-access-key",  # Replace with your AWS access key
    aws_secret_access_key="your-secret-key"  # Replace with your AWS secret key
)

# Initialize files
if not os.path.exists(TASKS_FILE):
    with open(TASKS_FILE, "w") as f:
        json.dump([], f)
if not os.path.exists(USERS_FILE):
    with open(USERS_FILE, "w") as f:
        json.dump([], f)

# JWT authentication decorator
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

# Serve React app
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    if path.startswith("api/"):
        return jsonify({"error": "API route not found"}), 404
    file_path = os.path.join(app.static_folder, path)
    if os.path.isfile(file_path):
        return send_from_directory(app.static_folder, path)
    index_path = os.path.join(app.static_folder, "index.html")
    if os.path.exists(index_path):
        return send_from_directory(app.static_folder, "index.html")
    return jsonify({"error": "React build folder not found."}), 500

# User login
@app.route("/api/login", methods=["POST"])
def login():
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

# Document upload
@app.route("/api/documents", methods=["POST"])
@token_required
def upload_document():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400
    user_id = request.user_id
    filename = f"{user_id}/{uuid.uuid4()}_{file.filename}"
    s3_client.upload_fileobj(
        file,
        app.config["S3_BUCKET"],
        filename,
        ExtraArgs={'ServerSideEncryption': 'AES256'}
    )
    return jsonify({"message": "Document uploaded", "filename": filename}), 201

# List documents
@app.route("/api/documents", methods=["GET"])
@token_required
def list_documents():
    user_id = request.user_id
    try:
        response = s3_client.list_objects_v2(
            Bucket=app.config["S3_BUCKET"],
            Prefix=f"{user_id}/"
        )
        documents = [obj["Key"] for obj in response.get("Contents", [])]
        return jsonify({"documents": [doc.split("/")[-1] for doc in documents]})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Customer task submission
@app.route("/api/tasks", methods=["POST"])
@token_required
def submit_task():
    data = request.get_json()
    document = data.get("document")
    description = data.get("description")
    if not document or not description:
        return jsonify({"error": "Document and description required"}), 400
    user_id = request.user_id
    task = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "document": document,
        "description": description,
        "status": "pending"
    }
    with open(TASKS_FILE, "r+") as f:
        tasks = json.load(f)
        tasks.append(task)
        f.seek(0)
        json.dump(tasks, f)
    return jsonify({"message": "Task submitted", "task": task}), 201

# List tasks
@app.route("/api/tasks", methods=["GET"])
@token_required
def list_tasks():
    user_id = request.user_id
    try:
        with open(TASKS_FILE, "r") as f:
            tasks = json.load(f)
        user_tasks = [task for task in tasks if task["user_id"] == user_id]
        return jsonify({"tasks": user_tasks})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# AI process
@app.route("/api/ai/process", methods=["POST"])
@token_required
def ai_process():
    data = request.get_json()
    document = data.get("document")
    user_id = request.user_id
    return jsonify({"message": f"AI processing placeholder for {document} by user {user_id}"})

# Debug route
@app.route("/api/debug-list")
def debug_list():
    try:
        return jsonify({"build_contents": os.listdir("./build")})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run()
