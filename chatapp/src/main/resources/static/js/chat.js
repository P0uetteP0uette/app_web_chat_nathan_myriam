let stompClient = null;
let selectedUser = null; // null = Public, sinon contient le pseudo du destinataire

document.addEventListener("DOMContentLoaded", function() {
    
    // 1. Charger la liste des utilisateurs et leurs statuts
    fetch('/api/users')
        .then(response => response.json())
        .then(usersMap => {
            for (const [username, status] of Object.entries(usersMap)) {
                addUserToSidebar(username, status);
            }
        });

    // 2. Charger l'historique des messages
    fetch('/api/history')
        .then(response => response.json())
        .then(messages => {
            messages.forEach(msg => {
                showChatMessage({
                    from: msg.sender,
                    content: msg.content,
                    time: msg.time,
                    type: 'CHAT'
                });
            });
        });

    // 3. Connexion WebSocket
    const socket = new SockJS('/chat-websocket');
    stompClient = Stomp.over(socket);

    stompClient.connect({}, () => {
        // Abonnement PUBLIC
        stompClient.subscribe('/topic/public', (payload) => {
            onMessageReceived(JSON.parse(payload.body));
        });

        // Abonnement PRIVÉ
        stompClient.subscribe('/user/queue/private', (payload) => {
            onPrivateMessageReceived(JSON.parse(payload.body));
        });

        // Dire qu'on est là
        stompClient.send("/app/chat.addUser", {}, JSON.stringify({}));
    });

    // Gestion touche Entrée
    const messageInput = document.getElementById("message");
    messageInput.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            sendMessage();
        }
    });
});

// --- ENVOI DE MESSAGES ---
function sendMessage() {
    const messageInput = document.getElementById("message");
    const content = messageInput.value.trim();

    if (content && stompClient) {
        const chatMessage = { content: content, type: 'CHAT' };

        if (selectedUser) {
            // Envoi PRIVÉ
            chatMessage.recipient = selectedUser;
            stompClient.send("/app/chat.private", {}, JSON.stringify(chatMessage));
        } else {
            // Envoi PUBLIC
            stompClient.send("/app/sendMessage", {}, JSON.stringify(chatMessage));
        }
        messageInput.value = '';
        messageInput.focus();
    }
}

// --- CHANGEMENT DE STATUT ---
function sendStatusChange() {
    const selector = document.getElementById("status-select");
    const newStatus = selector.value;
    if (stompClient) {
        const msg = { content: newStatus, type: 'STATUS' };
        stompClient.send("/app/chat.changeStatus", {}, JSON.stringify(msg));
    }
}

// --- RÉCEPTION ---
function onMessageReceived(msg) {
    if (msg.type === 'JOIN') {
        addUserToSidebar(msg.from, "ONLINE");
        showSystemMessage(msg.from + " a rejoint le chat.");
    } 
    else if (msg.type === 'LEAVE') {
        removeUserFromSidebar(msg.from);
        showSystemMessage(msg.from + " a quitté le chat.");
    } 
    else if (msg.type === 'STATUS') {
        updateUserStatus(msg.from, msg.content);
    } 
    else {
        showChatMessage(msg);
    }
}

function onPrivateMessageReceived(msg) {
    showChatMessage(msg, true);
}

// --- AFFICHAGE ---
function showChatMessage(msg, isPrivate = false) {
    const box = document.getElementById("chat-box");
    const div = document.createElement("div");

    // Avatar (DiceBear API)
    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.from}`;

    // Construction HTML
    let htmlContent = `
        <div style="display: flex; align-items: flex-start; margin-bottom: 10px;">
            <img src="${avatarUrl}" alt="Avatar" style="width: 35px; height: 35px; border-radius: 50%; margin-right: 10px; border: 2px solid #ddd;">
            <div>
                <div style="font-size: 0.8em; color: #555; margin-bottom: 2px;">
                    <b>${msg.from}</b> <span style="color: #aaa;">[${msg.time}]</span>
                </div>
                <div style="background-color: ${isPrivate ? '#ffefc1' : '#f1f1f1'}; 
                            border: 1px solid ${isPrivate ? '#e1c563' : '#ddd'}; 
                            padding: 8px 12px; 
                            border-radius: 10px; 
                            display: inline-block;">
                    ${isPrivate ? '🔒 ' : ''}${msg.content}
                </div>
            </div>
        </div>
    `;

    div.innerHTML = htmlContent;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

function showSystemMessage(text) {
    const box = document.getElementById("chat-box");
    const div = document.createElement("div");
    div.style.color = "#888"; 
    div.style.fontStyle = "italic"; 
    div.style.fontSize = "0.9em";
    div.style.marginBottom = "5px";
    div.innerText = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

// --- GESTION SIDEBAR (Liste connectés) ---

function getStatusColor(status) {
    if (status === 'BUSY') return '#e74c3c'; // Rouge
    if (status === 'AWAY') return '#f39c12'; // Orange
    return '#2ecc71'; // Vert (ONLINE)
}

function addUserToSidebar(username, status = 'ONLINE') {
    const list = document.getElementById("users-list");
    // Évite les doublons
    if (!document.getElementById("user-" + username)) {
        const li = document.createElement("li");
        li.id = "user-" + username;
        li.style.cursor = "pointer";
        li.style.display = "flex";
        li.style.alignItems = "center";
        li.style.padding = "5px";
        li.style.borderRadius = "4px";
        
        // Pastille de couleur
        const dot = document.createElement("span");
        dot.id = "status-dot-" + username;
        dot.style.height = "10px";
        dot.style.width = "10px";
        dot.style.backgroundColor = getStatusColor(status);
        dot.style.borderRadius = "50%";
        dot.style.marginRight = "10px";
        
        const text = document.createElement("span");
        text.innerText = username;

        li.appendChild(dot);
        li.appendChild(text);

        // Clic sur l'utilisateur
        li.onclick = function() {
            // Si on clique sur celui déjà sélectionné -> On désélectionne
            if (selectedUser === username) {
                selectedUser = null;
                li.style.backgroundColor = "transparent";
                li.style.fontWeight = "normal";
                document.getElementById("chat-header").innerText = "Chat Général";
            } else {
                // Reset des autres
                document.querySelectorAll("#users-list li").forEach(el => {
                    el.style.backgroundColor = "transparent";
                    el.style.fontWeight = "normal";
                });
                // Sélection du nouveau
                selectedUser = username;
                li.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                li.style.fontWeight = "bold";
                document.getElementById("chat-header").innerText = "🔒 Privé avec " + username;
            }
        };

        list.appendChild(li);
    } else {
        // Si l'utilisateur existe déjà (reconnexion), on met juste à jour son statut
        updateUserStatus(username, status);
    }
}

function removeUserFromSidebar(username) {
    const li = document.getElementById("user-" + username);
    if (li) {
        li.remove();
    }
    // Si la personne à qui on parlait part
    if (selectedUser === username) {
        selectedUser = null;
        document.getElementById("chat-header").innerText = "Chat Général";
    }
}

function updateUserStatus(username, newStatus) {
    const dot = document.getElementById("status-dot-" + username);
    if (dot) {
        dot.style.backgroundColor = getStatusColor(newStatus);
    }
}