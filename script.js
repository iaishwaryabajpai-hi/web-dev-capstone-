// ============================================
// Sampark - script.js
// Full CRUD: Create, Read, Update, Delete
// Uses: fetch, async/await, .json(), for loop,
//       getElementById, createElement, className,
//       innerHTML, innerText, appendChild,
//       function declarations & arrow functions
// ============================================

const API_URL = "http://localhost:5001";


// ==========================================
//  INDEX PAGE — Posts (Full CRUD)
// ==========================================

// READ — Function to render all posts into the DOM
function renderPosts(arr) {
    let container = document.getElementById("postsContainer");
    if (!container) return;

    container.innerHTML = "";

    for (let i = 0; i < arr.length; i++) {
        let post = arr[i];

        let postDiv = document.createElement("div");
        postDiv.className = "post";
        postDiv.id = "post-" + post.id;

        postDiv.innerHTML = `
            <div class="post-header">
                <div class="post-avatar" style="background-image: url('assets/post_avatar_1.png'); background-size: cover; background-position: center;"></div>
                <div>
                    <div class="post-author">${post.author}</div>
                    <div class="post-time">${post.time}</div>
                </div>
            </div>
            <div class="post-content" id="post-content-${post.id}">
                <p>${post.text}</p>
            </div>
            <br>
            <button onclick="handleLike(${post.id})">Like (${post.likes})</button>
            <button onclick="handleEditPost(${post.id})" style="margin-left: 15px;">Edit</button>
            <button onclick="handleDeletePost(${post.id})" style="margin-left: 15px;">Delete</button>
        `;

        container.appendChild(postDiv);
    }
}

// READ — GET all posts from the backend
async function loadPosts() {
    let response = await fetch(API_URL + "/posts");
    let data = await response.json();
    renderPosts(data.posts);
}

// CREATE — POST a new post to the backend (called from onsubmit)
async function handlePostSubmit(event) {
    event.preventDefault();

    let postInput = document.getElementById("postInput");
    let text = postInput.value;

    if (text === "") return;

    let response = await fetch(API_URL + "/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text, author: "Aishwarya" })
    });

    if (response.status === 201) {
        postInput.value = "";
        loadPosts();
    }
}

// UPDATE — Show edit form for a post, then PUT to backend
function handleEditPost(id) {
    let contentDiv = document.getElementById("post-content-" + id);
    if (!contentDiv) return;

    // Get current text from the <p> tag inside the content div
    let currentText = contentDiv.getElementsByTagName("p")[0].innerText;

    // Replace the content div with an edit form
    contentDiv.innerHTML = `
        <textarea id="edit-input-${id}" rows="3" style="width: 100%; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 15px; color: #fff; font-family: 'Outfit', sans-serif; font-size: 15px; resize: none;">${currentText}</textarea>
        <br><br>
        <button onclick="submitEditPost(${id})" class="post-btn" style="float: none; font-size: 14px; padding: 8px 16px;">Save</button>
        <button onclick="loadPosts()" style="margin-left: 10px; font-size: 14px; padding: 8px 16px; background: none; border: 1px solid rgba(255,255,255,0.2); color: #fff; border-radius: 20px; cursor: pointer;">Cancel</button>
    `;
}

// UPDATE — PUT the edited text to the backend
async function submitEditPost(id) {
    let editInput = document.getElementById("edit-input-" + id);
    let newText = editInput.value;

    if (newText === "") return;

    let response = await fetch(API_URL + "/posts/" + id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newText })
    });

    if (response.status === 200) {
        loadPosts();
    }
}

// DELETE — DELETE a post from the backend
async function handleDeletePost(id) {
    let response = await fetch(API_URL + "/posts/" + id, {
        method: "DELETE"
    });

    if (response.status === 200) {
        loadPosts();
    }
}

// Like handler (simple visual feedback)
function handleLike(id) {
    alert("You liked post #" + id + "!");
}


// ==========================================
//  MESSAGES PAGE — Chat (Full CRUD)
// ==========================================

// READ — Function to render all messages into the DOM
function renderMessages(arr) {
    let chatDiv = document.getElementById("chatMessages");
    if (!chatDiv) return;

    chatDiv.innerHTML = "";

    for (let i = 0; i < arr.length; i++) {
        let msg = arr[i];

        let messageDiv = document.createElement("div");
        messageDiv.className = "message " + msg.type;
        messageDiv.id = "msg-" + msg.id;

        // Only show edit/delete on "sent" messages
        if (msg.type === "sent") {
            messageDiv.innerHTML = `
                <span>${msg.text}</span>
                <div class="msg-actions" style="margin-top: 6px; display: flex; gap: 10px;">
                    <button onclick="handleEditMessage(${msg.id})" style="background: none; border: none; color: rgba(0,229,255,0.7); cursor: pointer; font-size: 11px; padding: 0;">Edit</button>
                    <button onclick="handleDeleteMessage(${msg.id})" style="background: none; border: none; color: rgba(255,100,100,0.7); cursor: pointer; font-size: 11px; padding: 0;">Delete</button>
                </div>
            `;
        } else {
            messageDiv.innerText = msg.text;
        }

        chatDiv.appendChild(messageDiv);
    }

    // Scroll to bottom
    chatDiv.scrollTop = chatDiv.scrollHeight;
}

// READ — GET all messages from the backend
async function loadMessages() {
    let response = await fetch(API_URL + "/messages");
    let data = await response.json();
    renderMessages(data.messages);
}

// CREATE — POST a new message (called from onclick)
async function handleSendMessage() {
    let msgInput = document.getElementById("msgInput");
    let text = msgInput.value;

    if (text === "") return;

    let response = await fetch(API_URL + "/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text, type: "sent" })
    });

    if (response.status === 201) {
        msgInput.value = "";
        loadMessages();
    }
}

// UPDATE — Show inline edit for a message
function handleEditMessage(id) {
    let msgDiv = document.getElementById("msg-" + id);
    if (!msgDiv) return;

    let currentText = msgDiv.getElementsByTagName("span")[0].innerText;

    msgDiv.innerHTML = `
        <input type="text" id="edit-msg-${id}" value="${currentText}" style="width: 80%; background: rgba(0,0,0,0.5); border: 1px solid rgba(0,229,255,0.4); border-radius: 12px; padding: 8px 12px; color: #fff; font-size: 14px; outline: none;">
        <button onclick="submitEditMessage(${id})" style="margin-left: 8px; background: rgba(0,229,255,0.3); border: none; color: #fff; padding: 8px 12px; border-radius: 12px; cursor: pointer; font-size: 12px;">Save</button>
    `;
}

// UPDATE — PUT the edited message to the backend
async function submitEditMessage(id) {
    let editInput = document.getElementById("edit-msg-" + id);
    let newText = editInput.value;

    if (newText === "") return;

    let response = await fetch(API_URL + "/messages/" + id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newText })
    });

    if (response.status === 200) {
        loadMessages();
    }
}

// DELETE — DELETE a message from the backend
async function handleDeleteMessage(id) {
    let response = await fetch(API_URL + "/messages/" + id, {
        method: "DELETE"
    });

    if (response.status === 200) {
        loadMessages();
    }
}

// Handle Enter key in message input (called from onkeyup)
function handleMsgKeyup(event) {
    if (event.key === "Enter") {
        handleSendMessage();
    }
}


// ==========================================
//  ON PAGE LOAD — fetch data from backend
// ==========================================

// Check which page we are on and load the right data
let postsContainer = document.getElementById("postsContainer");
let chatMessages = document.getElementById("chatMessages");

if (postsContainer) {
    loadPosts();
}

if (chatMessages) {
    loadMessages();
}
