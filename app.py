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
UPLOAD_FOLDER = "Uploads"
TASKS_FILE = "tasks.json"
USERS_FILE = "users.json"
CASES_FILE = "cases.json"
CHATS_FILE = "chats.json"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "your-secret-key")
app.config["S3_BUCKET"] = os.environ.get("S3_BUCKET", "your-s3-bucket-name")
app.config["S3_REGION"] = os.environ.get("S3_REGION", "us-east-1")

try:
    s3_client = boto3.client(
        's3',
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY")
    )
except Exception as e:
    print(f"Error initializing S3 client: {str(e)}")

for file in [TASKS_FILE, USERS_FILE, CASES_FILE, CHATS_FILE]:
    if not os.path.exists(file):
        with open(file, "w") as f:
            json.dump([], f)
        os.chmod(file, 0o666)

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
        except Exception as e:
            print(f"Token error: {str(e)}")
            return jsonify({"error": "Token is invalid"}), 401
        return f(*args, **kwargs)
    return decorated

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    try:
        print(f"Serving path: {path}")
        if path and path.startswith("api/"):
            return jsonify({"error": "API route not found"}), 404
        index_path = os.path.join(app.static_folder, "index.html")
        if os.path.exists(index_path):
            return send_from_directory(app.static_folder, "index.html")
        print(f"Index file not found at {index_path}")
        return jsonify({"error": "React build folder not found."}), 500
    except Exception as e:
        print(f"Error serving path {path}: {str(e)}")
        return jsonify({"error": "Server error"}), 500

@app.route("/api/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")
        print(f"Login attempt: {email}")
        if not os.path.exists(USERS_FILE):
            print(f"Users file not found at {USERS_FILE}")
            return jsonify({"error": "Users file not found"}), 500
        with open(USERS_FILE, "r") as f:
            users = json.load(f)
        for user in users:
            if user["email"] == email and check_password_hash(user["password"], password):
                token = jwt.encode({
                    "user_id": user["id"],
                    "exp": datetime.utcnow() + timedelta(hours=24)
                }, app.config["SECRET_KEY"], algorithm="HS256")
                print(f"Login successful for {email}")
                return jsonify({"token": token})
        print(f"Invalid credentials for {email}")
        return jsonify({"error": "Invalid credentials"}), 401
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({"error": "Server error during login"}), 500

@app.route("/api/cases", methods=["POST"])
@token_required
def create_case():
    try:
        data = request.get_json()
        title = data.get("title")
        if not title:
            return jsonify({"error": "Title is required"}), 400
        user_id = request.user_id
        case = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "title": title,
            "created_at": datetime.utcnow().isoformat(),
            "documents": [],
            "chat_ids": []
        }
        with open(CASES_FILE, "r+") as f:
            cases = json.load(f)
            cases.append(case)
            f.seek(0)
            json.dump(cases, f)
        return jsonify({"message": "Case created", "case": case}), 201
    except Exception as e:
        print(f"Case creation error: {str(e)}")
        return jsonify({"error": "Server error"}), 500

@app.route("/api/cases", methods=["GET"])
@token_required
def list_cases():
    try:
        user_id = request.user_id
        if not os.path.exists(CASES_FILE):
            print(f"Cases file not found at {CASES_FILE}")
            return jsonify({"cases": []}), 200
        with open(CASES_FILE, "r") as f:
            cases = json.load(f)
        user_cases = [case for case in cases if case["user_id"] == user_id]
        return jsonify({"cases": user_cases})
    except Exception as e:
        print(f"List cases error: {str(e)}")
        return jsonify({"error": "Server error"}), 500

@app.route("/api/documents", methods=["POST"])
@token_required
def upload_document():
    try:
        if "file" not in request.files or "case_id" not in request.form:
            return jsonify({"error": "File and case_id are required"}), 400
        file = request.files["file"]
        case_id = request.form["case_id"]
        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400
        user_id = request.user_id
        filename = f"{user_id}/{case_id}/{uuid.uuid4()}_{file.filename}"

        if not os.path.exists(CASES_FILE):
            print(f"Cases file not found at {CASES_FILE}")
            return jsonify({"error": "Cases file not found"}), 500
        with open(CASES_FILE, "r") as f:
            cases = json.load(f)
        case = next((c for c in cases if c["id"] == case_id and c["user_id"] == user_id), None)
        if not case:
            return jsonify({"error": "Case not found or unauthorized"}), 404

        try:
            s3_client.upload_fileobj(
                file,
                app.config["S3_BUCKET"],
                filename,
                ExtraArgs={'ServerSideEncryption': 'AES256'}
            )
        except Exception as e:
            print(f"S3 upload error: {str(e)}")
            return jsonify({"error": "Failed to upload to S3"}), 500

        case["documents"].append(filename)
        with open(CASES_FILE, "r+") as f:
            cases = json.load(f)
            for i, c in enumerate(cases):
                if c["id"] == case_id:
                    cases[i] = case
                    break
            f.seek(0)
            json.dump(cases, f)

        return jsonify({"message": "Document uploaded", "filename": filename}), 201
    except Exception as e:
        print(f"Document upload error: {str(e)}")
        return jsonify({"error": "Server error"}), 500

@app.route("/api/documents", methods=["GET"])
@token_required
def list_documents():
    try:
        user_id = request.user_id
        case_id = request.args.get("case_id")
        prefix = f"{user_id}/{case_id}/" if case_id else f"{user_id}/"
        try:
            response = s3_client.list_objects_v2(
                Bucket=app.config["S3_BUCKET"],
                Prefix=prefix
            )
            documents = [obj["Key"].split("/")[-1] for obj in response.get("Contents", [])]
        except Exception as e:
            print(f"S3 list error: {str(e)}")
            return jsonify({"documents": []}), 200
        return jsonify({"documents": documents})
    except Exception as e:
        print(f"List documents error: {str(e)}")
        return jsonify({"documents": []}), 200

@app.route("/api/tasks", methods=["POST"])
@token_required
def submit_task():
    try:
        data = request.get_json()
        document = data.get("document")
        description = data.get("description")
        case_id = data.get("case_id")
        if not document or not description or not case_id:
            return jsonify({"error": "Document, description, and case_id required"}), 400
        user_id = request.user_id

        if not os.path.exists(CASES_FILE):
            print(f"Cases file not found at {CASES_FILE}")
            return jsonify({"error": "Cases file not found"}), 500
        with open(CASES_FILE, "r") as f:
            cases = json.load(f)
        if not any(c["id"] == case_id and c["user_id"] == user_id for c in cases):
            return jsonify({"error": "Case not found or unauthorized"}), 404

        task = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "case_id": case_id,
            "document": document,
            "description": description,
            "status": "pending"
        }
        if not os.path.exists(TASKS_FILE):
            with open(TASKS_FILE, "w") as f:
                json.dump([], f)
        with open(TASKS_FILE, "r+") as f:
            tasks = json.load(f)
            tasks.append(task)
            f.seek(0)
            json.dump(tasks, f)
        return jsonify({"message": "Task submitted", "task": task}), 201
    except Exception as e:
        print(f"Task submission error: {str(e)}")
        return jsonify({"error": "Server error"}), 500

@app.route("/api/tasks", methods=["GET"])
@token_required
def list_tasks():
    try:
        user_id = request.user_id
        case_id = request.args.get("case_id")
        if not os.path.exists(TASKS_FILE):
            print(f"Tasks file not found at {TASKS_FILE}")
            return jsonify({"tasks": []}), 200
        with open(TASKS_FILE, "r") as f:
            tasks = json.load(f)
        user_tasks = [task for task in tasks if task["user_id"] == user_id and (not case_id or task["case_id"] == case_id)]
        return jsonify({"tasks": user_tasks})
    except Exception as e:
        print(f"List tasks error: {str(e)}")
        return jsonify({"error": "Server error"}), 500

@app.route("/api/ai/chat", methods=["POST"])
@token_required
def ai_chat():
    try:
        data = request.get_json()
        message = data.get("message")
        case_id = data.get("case_id")
        if not message or not case_id:
            return jsonify({"error": "Message and case_id required"}), 400
        user_id = request.user_id

        if not os.path.exists(CASES_FILE):
            print(f"Cases file not found at {CASES_FILE}")
            return jsonify({"error": "Cases file not found"}), 500
        with open(CASES_FILE, "r") as f:
            cases = json.load(f)
        case = next((c for c in cases if c["id"] == case_id and c["user_id"] == user_id), None)
        if not case:
            return jsonify({"error": "Case not found or unauthorized"}), 404

        response = f"AI response to: {message} (case: {case_id})"

        chat = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "case_id": case_id,
            "message": message,
            "response": response,
            "timestamp": datetime.utcnow().isoformat()
        }

        if not os.path.exists(CHATS_FILE):
            with open(CHATS_FILE, "w") as f:
                json.dump([], f)
        with open(CHATS_FILE, "r+") as f:
            chats = json.load(f)
            chats.append(chat)
            f.seek(0)
            json.dump(chats, f)

        case["chat_ids"].append(chat["id"])
        with open(CASES_FILE, "r+") as f:
            cases = json.load(f)
            for i, c in enumerate(cases):
                if c["id"] == case_id:
                    cases[i] = case
                    break
            f.seek(0)
            json.dump(cases, f)

        return jsonify({"message": "Chat recorded", "chat": chat})
    except Exception as e:
        print(f"AI chat error: {str(e)}")
        return jsonify({"error": "Server error"}), 500

@app.route("/api/ai/chats", methods=["GET"])
@token_required
def list_chats():
    try:
        user_id = request.user_id
        case_id = request.args.get("case_id")
        if not os.path.exists(CHATS_FILE):
            print(f"Chats file not found at {CHATS_FILE}")
            return jsonify({"chats": []}), 200
        with open(CHATS_FILE, "r") as f:
            chats = json.load(f)
        user_chats = [chat for chat in chats if chat["user_id"] == user_id and (not case_id or chat["case_id"] == case_id)]
        return jsonify({"chats": user_chats})
    except Exception as e:
        print(f"List chats error: {str(e)}")
        return jsonify({"error": "Server error"}), 500

@app.route("/api/ai/process", methods=["POST"])
@token_required
def ai_process():
    try:
        data = request.get_json()
        document = data.get("document")
        user_id = request.user_id
        return jsonify({"message": f"AI processing placeholder for {document} by user {user_id}"})
    except Exception as e:
        print(f"AI process error: {str(e)}")
        return jsonify({"error": "Server error"}), 500

@app.route("/api/debug")
def debug():
    try:
        build_exists = os.path.exists("./build")
        index_exists = os.path.exists(os.path.join(app.static_folder, "index.html"))
        files = {
            "users.json": os.path.exists(USERS_FILE),
            "cases.json": os.path.exists(CASES_FILE),
            "tasks.json": os.path.exists(TASKS_FILE),
            "chats.json": os.path.exists(CHATS_FILE)
        }
        s3_status = "connected" if s3_client else "failed"
        return jsonify({
            "build_folder": build_exists,
            "index_html": index_exists,
            "files": files,
            "s3_status": s3_status,
            "python_version": os.environ.get("PYTHON_VERSION"),
            "node_version": os.environ.get("NODE_VERSION")
        })
    except Exception as e:
        print(f"Debug error: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run()
