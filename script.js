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
//  POSTS (UNCHANGED)
// ==========================================

function renderPosts(arr) {
    let container = document.getElementById("postsContainer");
    if (!container) return;

    container.innerHTML = "";

    arr.forEach(post => {
        let div = document.createElement("div");
        div.className = "post";

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
            </div>
            <br>
            <button onclick="handleLike(${post.id})">Like (${post.likes})</button>
            <button onclick="handleEditPost(${post.id})">Edit</button>
            <button onclick="handleDeletePost(${post.id})">Delete</button>
        `;

        container.appendChild(div);
    });
}

async function loadPosts() {
    let res = await fetch(API_URL + "/posts");
    let data = await res.json();
    renderPosts(data.posts);
}

async function handlePostSubmit(e) {
    e.preventDefault();

    let input = document.getElementById("postInput");
    if (!input.value) return;

    let res = await fetch(API_URL + "/posts", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ text: input.value, author: "Aishwarya" })
    });

    if (res.status === 201) {
        input.value = "";
        loadPosts();
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

// 🔹 Load messages (FILTERED)
async function loadMessages() {
    let res = await fetch(API_URL + "/messages");
    let data = await res.json();

    let filtered = data.messages.filter(
        msg => msg.user === currentChatUser
    );

    renderMessages(filtered);
}

// 🔹 Send message
async function handleSendMessage() {
    let input = document.getElementById("msgInput");
    let text = input.value;

    if (!text) return;

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
            document.querySelector(".chat-header h4").innerText = name;

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