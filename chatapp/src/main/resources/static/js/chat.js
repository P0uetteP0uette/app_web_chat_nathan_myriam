let stompClient = null;
let selectedUser = null;
let userStatuses = {};

// Mémoire pour le regroupement
let lastSender = null;     
let lastTimeMinutes = -1;  
let lastTypePrivate = false; 

// Utilitaire temps
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

    // 2. Charger Historique
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

    // 3. WebSocket
    const socket = new SockJS('/chat-websocket');
    stompClient = Stomp.over(socket);

    stompClient.connect({}, () => {
        stompClient.subscribe('/topic/public', (payload) => onMessageReceived(JSON.parse(payload.body)));
        stompClient.subscribe('/user/queue/private', (payload) => onPrivateMessageReceived(JSON.parse(payload.body)));
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
        if (selectedUser) {
            chatMessage.recipient = selectedUser;
            stompClient.send("/app/chat.private", {}, JSON.stringify(chatMessage));
        } else {
            stompClient.send("/app/sendMessage", {}, JSON.stringify(chatMessage));
        }
        input.value = '';
        input.focus();
    }
}

function sendStatusChange() {
    const selector = document.getElementById("status-select");
    const newStatus = selector.value;
    // userStatuses["Moi"] = newStatus; // Optionnel
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

function onPrivateMessageReceived(msg) {
    showChatMessage(msg, true);
}

// --- FONCTION D'AFFICHAGE CORRIGÉE ---
function showChatMessage(msg, isPrivate = false) {
    const box = document.getElementById("chat-box");
    
    // 1. Analyse du temps
    const currentMinutes = timeToMinutes(msg.time);
    const timeDiff = currentMinutes - lastTimeMinutes;

    // 2. Conditions de regroupement
    let shouldGroup = (msg.from === lastSender) 
                   && (isPrivate === lastTypePrivate) 
                   && (timeDiff >= 0 && timeDiff < 5);

    // 3. TENTATIVE DE REGROUPEMENT
    if (shouldGroup) {
        const lastElement = box.lastElementChild;
        
        // On vérifie que le dernier élément est bien un groupe de message (et pas un message système)
        // et qu'il contient bien une bulle.
        if (lastElement && lastElement.classList.contains('message-group')) {
            const bubble = lastElement.querySelector(".chat-bubble");
            
            if (bubble) {
                // Création de la ligne supplémentaire
                const newTextLine = document.createElement("div");
                newTextLine.style.marginTop = "4px"; 
                newTextLine.style.paddingTop = "4px";
                newTextLine.style.borderTop = "1px solid rgba(0,0,0,0.05)"; 
                newTextLine.innerText = msg.content;
                
                bubble.appendChild(newTextLine);
                
                // IMPORTANT : On met à jour la mémoire et on quitte la fonction ici !
                lastTimeMinutes = currentMinutes; // On actualise l'heure du dernier msg
                box.scrollTop = box.scrollHeight;
                return; 
            }
        }
    }

    // --- NOUVEAU BLOC (Si on arrive ici, c'est qu'on n'a pas pu grouper) ---
    
    const div = document.createElement("div");
    div.className = "message-group"; // Classe importante pour le repérage
    div.style.marginBottom = "15px";

    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.from}`;
    const bgColor = isPrivate ? '#ffefc1' : '#f1f1f1';
    const borderColor = isPrivate ? '#e1c563' : '#ddd'; // '#ddd' ou transparent
    const lockIcon = isPrivate ? '🔒 ' : '';

    div.innerHTML = `
        <div style="display: flex; align-items: flex-start;">
            <img src="${avatarUrl}" alt="Avatar" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px; border: 2px solid #eee;">
            
            <div style="max-width: 80%;">
                <div style="font-size: 0.8em; color: #555; margin-bottom: 2px; margin-left: 2px;">
                    <b>${msg.from}</b> <span style="color: #aaa;">[${msg.time}]</span>
                </div>
                
                <div class="chat-bubble" style="background-color: ${bgColor}; 
                            border: 1px solid ${borderColor}; 
                            padding: 10px 15px; 
                            border-radius: 12px; 
                            border-top-left-radius: 2px;
                            position: relative;">
                    ${lockIcon}${msg.content}
                </div>
            </div>
        </div>
    `;
    
    box.appendChild(div);

    // Mise à jour de la mémoire
    lastSender = msg.from;
    lastTimeMinutes = currentMinutes;
    lastTypePrivate = isPrivate;

    box.scrollTop = box.scrollHeight;
}

function showSystemMessage(text) {
    const box = document.getElementById("chat-box");
    
    // On réinitialise le "dernier envoyeur" pour empêcher de coller un futur message à ce message système
    lastSender = null; 

    const div = document.createElement("div");
    div.style.color = "#888"; 
    div.style.fontStyle = "italic"; 
    div.style.fontSize = "0.85em";
    div.style.marginBottom = "10px";
    div.style.textAlign = "center";
    div.innerText = text;
    
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

// --- GESTION SIDEBAR ---
function getStatusColor(status) {
    if (status === 'BUSY') return '#e74c3c';
    if (status === 'AWAY') return '#f39c12';
    return '#2ecc71';
}

function addUserToSidebar(username, status = 'ONLINE') {
    const list = document.getElementById("users-list");

    // 1. Mise à jour si existe déjà
    if (document.getElementById("user-" + username)) {
        updateUserStatus(username, status);
        return;
    }

    // 2. Création de l'élément (identique à avant)
    const li = document.createElement("li");
    li.id = "user-" + username;
    li.style.cursor = "pointer";
    li.style.display = "flex";
    li.style.alignItems = "center";
    li.style.padding = "10px";
    li.style.borderRadius = "4px";
    li.style.marginBottom = "2px";
    li.style.transition = "background 0.2s";

    const dot = document.createElement("span");
    dot.id = "status-dot-" + username;
    dot.style.height = "10px";
    dot.style.width = "10px";
    dot.style.backgroundColor = getStatusColor(status);
    dot.style.borderRadius = "50%";
    dot.style.marginRight = "10px";
    
    const text = document.createElement("span");
    text.innerText = username;
    text.style.color = "white";

    // 3. Style Spécial "Moi"
    if (username === currentUserGlobal) {
        text.style.fontWeight = "bold";
        text.style.color = "#f1c40f"; // Jaune
        text.innerText += " (Moi)";
        li.style.border = "1px solid rgba(241, 196, 15, 0.5)";
    }

    li.appendChild(dot);
    li.appendChild(text);

    // 4. Gestion du Clic (identique à avant)
    li.onclick = function() {
        if (selectedUser === username) {
            selectedUser = null;
            li.style.backgroundColor = "transparent";
            document.getElementById("chat-header").innerText = "Chat Général";
        } else {
            document.querySelectorAll("#users-list li").forEach(el => {
                el.style.backgroundColor = "transparent";
            });
            selectedUser = username;
            li.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
            document.getElementById("chat-header").innerText = "🔒 Privé avec " + username;

            if (userStatuses[username] === 'BUSY') {
                showSystemMessage("⚠️ Attention : " + username + " est occupé(e).");
            }
        }
    };

    // --- C'EST ICI QUE CA CHANGE ---
    // Si c'est MOI -> Je me mets tout en haut (prepend)
    // Si c'est les AUTRES -> Ils vont à la suite (appendChild)
    if (username === currentUserGlobal) {
        list.prepend(li); 
    } else {
        list.appendChild(li);
    }
}

function removeUserFromSidebar(username) {
    const li = document.getElementById("user-" + username);
    if (li) li.remove();
    if (selectedUser === username) {
        selectedUser = null;
        document.getElementById("chat-header").innerText = "Chat Général";
    }
}

function updateUserStatus(username, newStatus) {
    const dot = document.getElementById("status-dot-" + username);
    if (dot) dot.style.backgroundColor = getStatusColor(newStatus);
    userStatuses[username] = newStatus;
}