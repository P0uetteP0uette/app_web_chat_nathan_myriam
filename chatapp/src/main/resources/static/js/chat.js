/* ================================================================
   CHAT GÉNÉRAL (Main Controller)
   ================================================================ */

let stompClient = null;
let selectedUser = null;
let userStatuses = {};

// Mémoire pour le regroupement
let lastSender = null;     
let lastTimeMinutes = -1;  
let lastTypePrivate = false; 

function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

document.addEventListener("DOMContentLoaded", function() {
    
    // 1. Charger Users
    fetch('/api/users')
        .then(response => response.json())
        .then(usersMap => {
            for (const [username, status] of Object.entries(usersMap)) {
                userStatuses[username] = status;
                addUserToSidebar(username, status);
            }
        });

    // 2. Charger Historique (Seulement le Public !)
    fetch('/api/history')
        .then(response => response.json())
        .then(messages => {
            messages.forEach(msg => {
                showChatMessage({
                    from: msg.sender,
                    content: msg.content,
                    time: msg.time,
                    timestamp: msg.timestamp,
                    type: 'CHAT'
                });
            });
        });

    // 3. WebSocket (Le moteur unique)
    const socket = new SockJS('/chat-websocket');
    stompClient = Stomp.over(socket);
    stompClient.debug = null; // Décommente pour cacher les logs

    stompClient.connect({}, () => {
        console.log("✅ WebSocket connecté (chat.js)");
        
        // Abonnement Public
        stompClient.subscribe('/topic/public', (payload) => {
            onMessageReceived(JSON.parse(payload.body));
        });
        
        // Abonnement Privé
        stompClient.subscribe('/user/queue/private', (payload) => {
            const msg = JSON.parse(payload.body);
            console.log("📨 Message privé reçu dans chat.js:", msg);
            // 🛑 STOP : On ne l'affiche plus ici !
            // ✅ ON ENVOIE UN SIGNAL A LA POPUP
            const event = new CustomEvent('private-message-received', { detail: msg });
            window.dispatchEvent(event);
        });
        
        stompClient.send("/app/chat.addUser", {}, JSON.stringify({}));
    });

    document.getElementById("message").addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            sendMessage();
        }
    });
});

function sendMessage() {
    const input = document.getElementById("message");
    const content = input.value.trim();

    if (content && stompClient) {
        const chatMessage = { content: content, type: 'CHAT' };
        // Envoi public uniquement ici
        stompClient.send("/app/sendMessage", {}, JSON.stringify(chatMessage));
        input.value = '';
        input.focus();
    }
}

function sendStatusChange() {
    const selector = document.getElementById("status-select");
    const newStatus = selector.value;
    if (stompClient) {
        const msg = { content: newStatus, type: 'STATUS' };
        stompClient.send("/app/chat.changeStatus", {}, JSON.stringify(msg));
    }
}

function onMessageReceived(msg) {
    if (msg.type === 'JOIN') {
        userStatuses[msg.from] = "ONLINE";
        addUserToSidebar(msg.from, "ONLINE");
        showSystemMessage(msg.from + " a rejoint le chat.");
    } 
    else if (msg.type === 'LEAVE') {
        delete userStatuses[msg.from];
        removeUserFromSidebar(msg.from);
        showSystemMessage(msg.from + " a quitté le chat.");
    } 
    else if (msg.type === 'STATUS') {
        userStatuses[msg.from] = msg.content;
        updateUserStatus(msg.from, msg.content);
    } 
    else {
        showChatMessage(msg);
    }
}

// --- AFFICHAGE CHAT GÉNÉRAL ---
function showChatMessage(msg) {
    const box = document.getElementById("chat-box");
    const safeContent = escapeHtml(msg.content);

    // Correction date
    let displayTime = msg.time;
    if (!displayTime && msg.timestamp) {
        try {
            displayTime = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch(e) {}
    }
    if (!displayTime) displayTime = "";

    const currentMinutes = timeToMinutes(displayTime);
    const timeDiff = currentMinutes - lastTimeMinutes;

    let shouldGroup = (msg.from === lastSender) 
                    && (timeDiff >= 0 && timeDiff < 5);

    if (shouldGroup) {
        const lastElement = box.lastElementChild;
        if (lastElement && lastElement.classList.contains('message-group')) {
            const bubble = lastElement.querySelector(".chat-bubble");
            if (bubble) {
                const newTextLine = document.createElement("div");
                newTextLine.style.marginTop = "4px"; 
                newTextLine.style.paddingTop = "4px";
                newTextLine.style.borderTop = "1px solid rgba(0,0,0,0.05)"; 
                newTextLine.innerHTML = safeContent; 
                bubble.appendChild(newTextLine);
                lastTimeMinutes = currentMinutes; 
                box.scrollTop = box.scrollHeight;
                return; 
            }
        }
    }

    const div = document.createElement("div");
    div.className = "message-group";
    div.style.marginBottom = "15px";
    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.from}`;

    div.innerHTML = `
        <div style="display: flex; align-items: flex-start;">
            <img src="${avatarUrl}" alt="Avatar" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px; border: 2px solid #eee;">
            <div style="max-width: 80%;">
                <div style="font-size: 0.8em; color: #555; margin-bottom: 2px; margin-left: 2px;">
                    <b>${msg.from}</b> <span style="color: #aaa;">[${displayTime}]</span>
                </div>
                <div class="chat-bubble" style="background-color: #f1f1f1; border: 1px solid #ddd; padding: 10px 15px; border-radius: 12px; border-top-left-radius: 2px; position: relative; word-wrap: break-word;">
                    ${safeContent}
                </div>
            </div>
        </div>
    `;
    
    box.appendChild(div);
    lastSender = msg.from;
    lastTimeMinutes = currentMinutes;
    box.scrollTop = box.scrollHeight;
}

function showSystemMessage(text) {
    const box = document.getElementById("chat-box");
    lastSender = null; 
    const div = document.createElement("div");
    div.style.cssText = "color:#888; font-style:italic; font-size:0.85em; margin-bottom:10px; text-align:center;";
    div.innerText = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

function getStatusColor(status) {
    if (status === 'BUSY') return '#e74c3c';
    if (status === 'AWAY') return '#f39c12';
    return '#2ecc71';
}

function addUserToSidebar(username, status = 'ONLINE') {
    const list = document.getElementById("users-list");
    if (document.getElementById("user-" + username)) {
        updateUserStatus(username, status);
        return;
    }
    const li = document.createElement("li");
    li.id = "user-" + username;
    li.style.cssText = "cursor:pointer; display:flex; align-items:center; padding:10px; border-radius:4px; margin-bottom:2px; transition:background 0.2s;";

    const dot = document.createElement("span");
    dot.id = "status-dot-" + username;
    dot.style.cssText = `height:10px; width:10px; background-color:${getStatusColor(status)}; border-radius:50%; margin-right:10px;`;
    
    const text = document.createElement("span");
    text.innerText = username;
    text.style.color = "white";

    if (username === currentUserGlobal) {
        text.style.fontWeight = "bold";
        text.style.color = "#f1c40f"; 
        text.innerText += " (Moi)";
        li.style.border = "1px solid rgba(241, 196, 15, 0.5)";
    }

    li.appendChild(dot);
    li.appendChild(text);

    li.onclick = function() {
        // Quand on clique sur un user, ça ouvre la POPUP (via chat-popup.js)
        if (typeof openChat === "function") {
            openChat(username);
        }
    };

    if (username === currentUserGlobal) list.prepend(li); 
    else list.appendChild(li);
}

function removeUserFromSidebar(username) {
    const li = document.getElementById("user-" + username);
    if (li) li.remove();
}

function updateUserStatus(username, newStatus) {
    const dot = document.getElementById("status-dot-" + username);
    if (dot) dot.style.backgroundColor = getStatusColor(newStatus);
    userStatuses[username] = newStatus;
}

function escapeHtml(text) {
    if (!text) return text;
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}