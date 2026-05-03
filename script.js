// ============================================
// Sampark - script.js (FINAL FIXED)
// ============================================

const API_URL = "http://localhost:5001";

// ✅ Current selected chat user
let currentChatUser = "Priya Sharma";

// ✅ Avatar mapping
const userAvatars = {
    "Priya Sharma": "assets/post_avatar_1.png",
    "Rahul Verma": "assets/post_avatar_2.png",
    "Ms. Kapoor (Teacher)": "assets/user_avatar.png"
};


// ==========================================
//  IMAGE PREVIEW (for post upload)
// ==========================================

function previewImage(input) {
    let preview = document.getElementById("imagePreview");
    let previewImg = document.getElementById("previewImg");
    let fileName = document.getElementById("fileName");

    if (input.files && input.files[0]) {
        let reader = new FileReader();
        reader.onload = function (e) {
            previewImg.src = e.target.result;
            preview.style.display = "block";
        };
        reader.readAsDataURL(input.files[0]);
        fileName.innerText = input.files[0].name;
    }
}

function removePreview() {
    document.getElementById("imagePreview").style.display = "none";
    document.getElementById("previewImg").src = "";
    document.getElementById("postImage").value = "";
    document.getElementById("fileName").innerText = "";
}


// ==========================================
//  POSTS — Full CRUD with Image Upload
// ==========================================

function renderPosts(arr) {
    let container = document.getElementById("postsContainer");
    if (!container) return;

    container.innerHTML = "";

    arr.forEach(post => {
        let div = document.createElement("div");
        div.className = "post";
        div.id = "post-" + post.id;

        // Build image HTML if post has an image
        let imageHtml = "";
        if (post.image_url) {
            imageHtml = `<div style="margin:10px 0;"><img src="${post.image_url}" style="max-width:100%; border-radius:12px; border:1px solid rgba(255,255,255,0.1);"></div>`;
        }

        div.innerHTML = `
            <div class="post-header">
                <div class="post-avatar" style="background:url('assets/post_avatar_1.png') center/cover;"></div>
                <div>
                    <div class="post-author">${post.author}</div>
                    <div class="post-time">${post.time}</div>
                </div>
            </div>
            <div id="post-content-${post.id}">
                <p>${post.text}</p>
                ${imageHtml}
            </div>
            <br>
            <button onclick="handleLike(${post.id})">👍 Like (${post.likes})</button>
            <button onclick="handleEditPost(${post.id})">✏️ Edit</button>
            <button onclick="handleDeletePost(${post.id})">🗑️ Delete</button>
        `;

        container.appendChild(div);
    });
}

// READ — Load all posts from Supabase
async function loadPosts() {
    try {
        let res = await fetch(API_URL + "/posts");
        let data = await res.json();
        renderPosts(data.posts);
    } catch (err) {
        console.error("Failed to load posts:", err);
    }
}

// CREATE — Submit a new post (with optional image)
async function handlePostSubmit(e) {
    e.preventDefault();

    let input = document.getElementById("postInput");
    let fileInput = document.getElementById("postImage");

    if (!input.value) return;

    let imageUrl = null;

    // Upload image first if one is selected
    if (fileInput && fileInput.files && fileInput.files[0]) {
        try {
            let formData = new FormData();
            formData.append("image", fileInput.files[0]);

            let uploadRes = await fetch(API_URL + "/upload", {
                method: "POST",
                body: formData
            });

            if (uploadRes.ok) {
                let uploadData = await uploadRes.json();
                imageUrl = uploadData.url;
            } else {
                let errData = await uploadRes.json();
                alert("Image upload failed: " + (errData.error || "Unknown error"));
                return;
            }
        } catch (err) {
            console.error("Image upload failed:", err);
            alert("Image upload failed. Please try again.");
            return;
        }
    }

    // Now create the post
    try {
        let postBody = {
            text: input.value,
            author: "Aishwarya"
        };

        if (imageUrl) {
            postBody.image_url = imageUrl;
        }

        let res = await fetch(API_URL + "/posts", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(postBody)
        });

        if (res.status === 201) {
            input.value = "";
            removePreview();
            loadPosts();
        }
    } catch (err) {
        console.error("Failed to create post:", err);
    }
}

// UPDATE — Like a post
async function handleLike(postId) {
    try {
        let res = await fetch(API_URL + "/posts/" + postId + "/like", {
            method: "PUT",
            headers: {"Content-Type": "application/json"}
        });

        if (res.ok) {
            loadPosts();
        }
    } catch (err) {
        console.error("Failed to like post:", err);
    }
}

// UPDATE — Edit a post (inline prompt)
async function handleEditPost(postId) {
    let contentDiv = document.getElementById("post-content-" + postId);
    if (!contentDiv) return;

    let currentText = contentDiv.querySelector("p").innerText.trim();
    let newText = prompt("Edit your post:", currentText);

    if (newText === null || newText.trim() === "") return;

    try {
        let res = await fetch(API_URL + "/posts/" + postId, {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ text: newText.trim() })
        });

        if (res.ok) {
            loadPosts();
        }
    } catch (err) {
        console.error("Failed to edit post:", err);
    }
}

// DELETE — Remove a post
async function handleDeletePost(postId) {
    let confirmed = confirm("Are you sure you want to delete this post?");
    if (!confirmed) return;

    try {
        let res = await fetch(API_URL + "/posts/" + postId, {
            method: "DELETE"
        });

        if (res.ok) {
            loadPosts();
        }
    } catch (err) {
        console.error("Failed to delete post:", err);
    }
}


// ==========================================
//  CHAT SECTION
// ==========================================

// ✅ FIXED: using <img> instead of background
function updateChatAvatar(user) {
    let avatar = document.getElementById("chatAvatar");
    if (!avatar) return;

    let img = userAvatars[user] || "assets/user_avatar.png";

    avatar.src = img;
}

// 🔹 Render messages
function renderMessages(arr) {
    let chat = document.getElementById("chatMessages");
    if (!chat) return;

    chat.innerHTML = "";

    arr.forEach(msg => {
        let div = document.createElement("div");
        div.className = "message " + msg.type;

        div.innerText = msg.text;

        chat.appendChild(div);
    });

    chat.scrollTop = chat.scrollHeight;
}

// 🔹 Load messages (server-side filtered by user)
async function loadMessages() {
    try {
        let res = await fetch(API_URL + "/messages?user=" + encodeURIComponent(currentChatUser));
        let data = await res.json();

        renderMessages(data.messages);
    } catch (err) {
        console.error("Failed to load messages:", err);
    }
}

// 🔹 Send message
async function handleSendMessage() {
    let input = document.getElementById("msgInput");
    let text = input.value;

    if (!text) return;

    try {
        let res = await fetch(API_URL + "/messages", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                text,
                type: "sent",
                user: currentChatUser
            })
        });

        if (res.status === 201) {
            input.value = "";
            loadMessages();
        }
    } catch (err) {
        console.error("Failed to send message:", err);
    }
}

// 🔹 Enter key
function handleMsgKeyup(e) {
    if (e.key === "Enter") handleSendMessage();
}


// ==========================================
//  CONTACT CLICK (FIXED)
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    document.querySelectorAll(".contact-item").forEach(item => {

        item.addEventListener("click", () => {

            // remove active
            document.querySelectorAll(".contact-item")
                .forEach(i => i.classList.remove("active"));

            item.classList.add("active");

            let name = item.querySelector("h4").innerText;

            currentChatUser = name;

            // update name
            let chatHeaderName = document.querySelector(".chat-header h4");
            if (chatHeaderName) chatHeaderName.innerText = name;

            // ✅ update image
            updateChatAvatar(name);

            // load messages
            loadMessages();
        });

    });

    // ✅ initial load
    updateChatAvatar(currentChatUser);
    loadMessages();
});


// ==========================================
//  PAGE LOAD (POSTS)
// ==========================================

if (document.getElementById("postsContainer")) {
    loadPosts();
}