from flask import Flask, send_from_directory, request, jsonify
import os
import uuid
import json

app = Flask(__name__, static_folder="build", static_url_path="/")
UPLOAD_FOLDER = "uploads"
TASKS_FILE = "tasks.json"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Initialize tasks file
if not os.path.exists(TASKS_FILE):
    with open(TASKS_FILE, "w") as f:
        json.dump([], f)

# Serve React app
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    file_path = os.path.join(app.static_folder, path)
    if os.path.isfile(file_path):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")

# Document upload (Customer/Paralegal)
@app.route("/api/documents", methods=["POST"])
def upload_document():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400
    filename = f"{uuid.uuid4()}_{file.filename}"
    file.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))
    return jsonify({"message": "Document uploaded", "filename": filename}), 201

# List documents (all roles)
@app.route("/api/documents", methods=["GET"])
def list_documents():
    try:
        files = os.listdir(app.config["UPLOAD_FOLDER"])
        return jsonify({"documents": files})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Customer task submission
@app.route("/api/tasks", methods=["POST"])
def submit_task():
    data = request.get_json()
    document = data.get("document")
    description = data.get("description")
    if not document or not description:
        return jsonify({"error": "Document and description required"}), 400
    task = {
        "id": str(uuid.uuid4()),
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

# List tasks (Customer/Paralegal)
@app.route("/api/tasks", methods=["GET"])
def list_tasks():
    try:
        with open(TASKS_FILE, "r") as f:
            tasks = json.load(f)
        return jsonify({"tasks": tasks})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# AI process (Customer/Lawyer)
@app.route("/api/ai/process", methods=["POST"])
def ai_process():
    data = request.get_json()
    document = data.get("document")
    return jsonify({"message": f"AI processing placeholder for {document}"})

# Debug route
@app.route("/debug-list")
def debug_list():
    try:
        return jsonify({"build_contents": os.listdir("./build")})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run()
