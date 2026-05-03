from flask import Flask, request
from flask_cors import CORS
from supabase import create_client
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# ---- Supabase Connection ----
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


# ---- Base Route ----

@app.route("/")
def base_app():
    return {"status": "Sampark API is running with Supabase!"}


# ==========================================
#  POSTS — Full CRUD
# ==========================================

# ---- READ all posts ----

@app.route("/posts", methods=["GET"])
def get_all_posts():
    response = supabase.table("posts").select("*").order("id", desc=True).execute()
    return {"posts": response.data}


# ---- CREATE a new post ----

@app.route("/posts", methods=["POST"])
def create_post():
    data = request.get_json()

    if not data or not data.get("text"):
        return {"error": "text is required"}, 400

    new_post = {
        "author": data.get("author", "Aishwarya"),
        "text": data["text"],
        "time": "Just now",
        "likes": 0,
        "comments": 0
    }

    response = supabase.table("posts").insert(new_post).execute()
    return response.data[0], 201


# ---- UPDATE a post ----

@app.route("/posts/<int:post_id>", methods=["PUT"])
def update_post(post_id):
    data = request.get_json()

    update_data = {}
    if "text" in data:
        update_data["text"] = data["text"]
    if "author" in data:
        update_data["author"] = data["author"]

    if not update_data:
        return {"error": "nothing to update"}, 400

    response = supabase.table("posts").update(update_data).eq("id", post_id).execute()

    if len(response.data) == 0:
        return {"error": "post not found"}, 404

    return response.data[0], 200


# ---- DELETE a post ----

@app.route("/posts/<int:post_id>", methods=["DELETE"])
def delete_post(post_id):
    supabase.table("posts").delete().eq("id", post_id).execute()
    return {"message": "post deleted"}, 200


# ==========================================
#  MESSAGES — Full CRUD
# ==========================================

# ---- READ all messages ----

@app.route("/messages", methods=["GET"])
def get_all_messages():
    response = supabase.table("messages").select("*").order("id", desc=False).execute()
    return {"messages": response.data}


# ---- CREATE a new message ----

@app.route("/messages", methods=["POST"])
def create_message():
    data = request.get_json()

    if not data or not data.get("text"):
        return {"error": "text is required"}, 400

    new_msg = {
        "text": data["text"],
        "type": data.get("type", "sent")
    }

    response = supabase.table("messages").insert(new_msg).execute()
    return response.data[0], 201


# ---- UPDATE a message ----

@app.route("/messages/<int:msg_id>", methods=["PUT"])
def update_message(msg_id):
    data = request.get_json()

    update_data = {}
    if "text" in data:
        update_data["text"] = data["text"]

    if not update_data:
        return {"error": "nothing to update"}, 400

    response = supabase.table("messages").update(update_data).eq("id", msg_id).execute()

    if len(response.data) == 0:
        return {"error": "message not found"}, 404

    return response.data[0], 200


# ---- DELETE a message ----

@app.route("/messages/<int:msg_id>", methods=["DELETE"])
def delete_message(msg_id):
    supabase.table("messages").delete().eq("id", msg_id).execute()
    return {"message": "message deleted"}, 200


# ==========================================
#  PROFILE — Read & Update
# ==========================================

# ---- GET profile ----

@app.route("/profile", methods=["GET"])
def get_profile():
    response = supabase.table("profiles").select("*").limit(1).execute()
    if len(response.data) == 0:
        return {"error": "profile not found"}, 404
    return {"profile": response.data[0]}


# ---- PUT (update) profile ----

@app.route("/profile/<int:profile_id>", methods=["PUT"])
def update_profile(profile_id):
    data = request.get_json()

    update_data = {}
    if "name" in data:
        update_data["name"] = data["name"]
    if "role" in data:
        update_data["role"] = data["role"]

    if not update_data:
        return {"error": "nothing to update"}, 400

    response = supabase.table("profiles").update(update_data).eq("id", profile_id).execute()

    if len(response.data) == 0:
        return {"error": "profile not found"}, 404

    return response.data[0], 200


# ---- Run the app ----

if __name__ == "__main__":
    app.run(port=5001, debug=True)
