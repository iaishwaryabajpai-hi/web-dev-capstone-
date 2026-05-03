from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client
from dotenv import load_dotenv
import os
import uuid

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# ---- Supabase Connection ----
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY in .env file")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Supabase Storage bucket name
BUCKET_NAME = "post-images"


# ---- Base Route ----

@app.route("/api/")
def base_app():
    return jsonify({"status": "Sampark API is running with Supabase!"})


# ==========================================
#  IMAGE UPLOAD
# ==========================================

@app.route("/api/upload", methods=["POST"])
def upload_image():
    """Upload an image to Supabase Storage and return the public URL."""
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image file provided"}), 400

        file = request.files["image"]

        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        # Generate a unique filename
        ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "png"
        unique_name = f"{uuid.uuid4().hex}.{ext}"

        # Read file bytes
        file_bytes = file.read()

        # Upload to Supabase Storage
        supabase.storage.from_(BUCKET_NAME).upload(
            path=unique_name,
            file=file_bytes,
            file_options={"content-type": file.content_type or "image/png"}
        )

        # Get public URL
        public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(unique_name)

        return jsonify({"url": public_url}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================================
#  POSTS — Full CRUD
# ==========================================

# ---- READ all posts ----

@app.route("/api/posts", methods=["GET"])
def get_all_posts():
    try:
        response = supabase.table("posts").select("*").order("id", desc=True).execute()
        return jsonify({"posts": response.data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---- CREATE a new post ----

@app.route("/api/posts", methods=["POST"])
def create_post():
    try:
        data = request.get_json()

        if not data or not data.get("text"):
            return jsonify({"error": "text is required"}), 400

        new_post = {
            "author": data.get("author", "Aishwarya"),
            "text": data["text"],
            "time": "Just now",
            "likes": 0,
            "comments": 0,
            "image_url": data.get("image_url", None)
        }

        response = supabase.table("posts").insert(new_post).execute()
        return jsonify(response.data[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---- UPDATE a post ----

@app.route("/api/posts/<int:post_id>", methods=["PUT"])
def update_post(post_id):
    try:
        data = request.get_json()

        update_data = {}
        if "text" in data:
            update_data["text"] = data["text"]
        if "author" in data:
            update_data["author"] = data["author"]
        if "likes" in data:
            update_data["likes"] = data["likes"]
        if "image_url" in data:
            update_data["image_url"] = data["image_url"]

        if not update_data:
            return jsonify({"error": "nothing to update"}), 400

        response = supabase.table("posts").update(update_data).eq("id", post_id).execute()

        if len(response.data) == 0:
            return jsonify({"error": "post not found"}), 404

        return jsonify(response.data[0]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---- LIKE a post ----

@app.route("/api/posts/<int:post_id>/like", methods=["PUT"])
def like_post(post_id):
    try:
        # Fetch current likes
        current = supabase.table("posts").select("likes").eq("id", post_id).execute()

        if len(current.data) == 0:
            return jsonify({"error": "post not found"}), 404

        new_likes = current.data[0]["likes"] + 1
        response = supabase.table("posts").update({"likes": new_likes}).eq("id", post_id).execute()

        return jsonify(response.data[0]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---- DELETE a post ----

@app.route("/api/posts/<int:post_id>", methods=["DELETE"])
def delete_post(post_id):
    try:
        supabase.table("posts").delete().eq("id", post_id).execute()
        return jsonify({"message": "post deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================================
#  MESSAGES — Full CRUD
# ==========================================

# ---- READ all messages ----

@app.route("/api/messages", methods=["GET"])
def get_all_messages():
    try:
        user = request.args.get("user")

        query = supabase.table("messages").select("*").order("id", desc=False)

        if user:
            query = query.eq("user", user)

        response = query.execute()
        return jsonify({"messages": response.data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---- CREATE a new message ----

@app.route("/api/messages", methods=["POST"])
def create_message():
    try:
        data = request.get_json()

        if not data or not data.get("text"):
            return jsonify({"error": "text is required"}), 400

        new_msg = {
            "text": data["text"],
            "type": data.get("type", "sent"),
            "user": data.get("user", "Priya Sharma")
        }

        response = supabase.table("messages").insert(new_msg).execute()
        return jsonify(response.data[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---- UPDATE a message ----

@app.route("/api/messages/<int:msg_id>", methods=["PUT"])
def update_message(msg_id):
    try:
        data = request.get_json()

        update_data = {}
        if "text" in data:
            update_data["text"] = data["text"]

        if not update_data:
            return jsonify({"error": "nothing to update"}), 400

        response = supabase.table("messages").update(update_data).eq("id", msg_id).execute()

        if len(response.data) == 0:
            return jsonify({"error": "message not found"}), 404

        return jsonify(response.data[0]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---- DELETE a message ----

@app.route("/api/messages/<int:msg_id>", methods=["DELETE"])
def delete_message(msg_id):
    try:
        supabase.table("messages").delete().eq("id", msg_id).execute()
        return jsonify({"message": "message deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================================
#  PROFILE — Read & Update
# ==========================================

# ---- GET profile ----

@app.route("/api/profile", methods=["GET"])
def get_profile():
    try:
        response = supabase.table("profiles").select("*").limit(1).execute()
        if len(response.data) == 0:
            return jsonify({"error": "profile not found"}), 404
        return jsonify({"profile": response.data[0]})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---- PUT (update) profile ----

@app.route("/api/profile/<int:profile_id>", methods=["PUT"])
def update_profile(profile_id):
    try:
        data = request.get_json()

        update_data = {}
        if "name" in data:
            update_data["name"] = data["name"]
        if "role" in data:
            update_data["role"] = data["role"]

        if not update_data:
            return jsonify({"error": "nothing to update"}), 400

        response = supabase.table("profiles").update(update_data).eq("id", profile_id).execute()

        if len(response.data) == 0:
            return jsonify({"error": "profile not found"}), 404

        return jsonify(response.data[0]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---- Run the app ----

if __name__ == "__main__":
    app.run(port=5001, debug=True)
