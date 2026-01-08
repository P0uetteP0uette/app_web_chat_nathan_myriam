/* ================================================================
   CHAT GÉNÉRAL (Main Controller) - VERSION AVEC DESIGN MODIFIÉ
   ================================================================ */

let stompClient = null;
let selectedUser = null;
let userStatuses = {};
let lastSender = null;
let lastTimeMinutes = -1;

let isTyping = false;
let typingTimeout = null;
let typingDisplayTimeout = null;

// --- GESTION DU SON ---
let isSoundOn = localStorage.getItem("chatSound") !== "false";

function toggleSound() {
    isSoundOn = !isSoundOn;
    localStorage.setItem("chatSound", isSoundOn);
    updateSoundIcon();
}

function updateSoundIcon() {
    const btn = document.getElementById("sound-toggle-btn");
    const icon = document.getElementById("sound-icon");
    const text = document.getElementById("sound-text");

    if (isSoundOn) {
        if (icon) icon.className = "bi bi-volume-up-fill";
        if (text) text.innerText = "Son: ON";
        if (btn) btn.style.opacity = "1";
    } else {
        if (icon) icon.className = "bi bi-volume-mute-fill";
        if (text) text.innerText = "Son: OFF";
        if (btn) btn.style.opacity = "0.7";
    }
}

function playNotificationSound() {
    if (!isSoundOn) return;
    const audio = document.getElementById("notification-sound");
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.log("Son bloqué"));
    }
}

// --- INITIALISATION ---
document.addEventListener("DOMContentLoaded", function() {
    updateSoundIcon();

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
            messages.forEach(msg => showChatMessage(msg));
        });

    // 3. WebSocket
    const socket = new SockJS('/chat-websocket');
    stompClient = Stomp.over(socket);
    // stompClient.debug = null;

    stompClient.connect({}, () => {
        stompClient.subscribe('/topic/public', (payload) => {
            onMessageReceived(JSON.parse(payload.body));
        });

        stompClient.subscribe('/user/queue/private', (payload) => {
            const msg = JSON.parse(payload.body);
            const event = new CustomEvent('private-message-received', { detail: msg });
            window.dispatchEvent(event);
            const sender = msg.sender || msg.from;
            if (isSoundOn && sender !== currentUserGlobal) {
                playNotificationSound();
            }
        });

        stompClient.send("/app/chat.addUser", {}, JSON.stringify({}));
    });

    // 4. Gestion de la zone de saisie
    const msgInput = document.getElementById("message");
    if(msgInput) {
        msgInput.addEventListener("keydown", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                sendMessage();
                isTyping = false;
                clearTimeout(typingTimeout);
            }
        });

        msgInput.addEventListener("input", function() {
            if (!isTyping) {
                isTyping = true;
                if (stompClient) {
                    const typingMsg = {
                        sender: currentUserGlobal,
                        type: 'TYPING'
                    };
                    stompClient.send("/app/chat.typing", {}, JSON.stringify(typingMsg));
                }
            }
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
                isTyping = false;
            }, 2000);
        });
    }
});

function sendMessage() {
    const input = document.getElementById("message");
    const content = input.value.trim();

    if (content && stompClient) {
        const chatMessage = { content: content, type: 'CHAT' };
        stompClient.send("/app/sendMessage", {}, JSON.stringify(chatMessage));
        input.value = '';
        input.focus();
    }
}

function sendStatusChange() {
    const selector = document.getElementById("status-select");
    if(selector && stompClient) {
        const newStatus = selector.value;
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
    else if (msg.type === 'CHAT') {
        if (msg.from !== currentUserGlobal) {
            playNotificationSound();
        }
        showChatMessage(msg);
    }
    else if (msg.type === 'TYPING') {
        if (msg.from === currentUserGlobal) return;
        showTypingIndicator(msg.sender);
    }
}

function showTypingIndicator(username) {
    const indicator = document.getElementById("typing-indicator");
    if (!indicator) return;
    indicator.innerText = `${username} est en train d'écrire...`;
    if (typingDisplayTimeout) clearTimeout(typingDisplayTimeout);
    typingDisplayTimeout = setTimeout(() => {
        indicator.innerText = "";
    }, 3000);
}

function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

// =================================================================
// 👇 FONCTION MODIFIÉE POUR LE DESIGN (ALIGNEMENT ET COULEURS) 👇
// =================================================================
function showChatMessage(msg) {
    const box = document.getElementById("chat-box");
    if (!box) return;

    const senderName = msg.from || msg.sender || "Inconnu";
    // >>> NOUVEAU : On vérifie si c'est mon message <<<
    // (Assure-toi que currentUserGlobal est bien défini quelque part dans ton HTML)
    const isMe = (senderName === currentUserGlobal);

    let displayTime = msg.time;
    if (!displayTime && msg.timestamp) {
        try { displayTime = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch(e) {}
    }
    if (!displayTime) displayTime = "";

    const safeContent = escapeHtml(msg.content);
    const currentMinutes = timeToMinutes(displayTime);
    const timeDiff = currentMinutes - lastTimeMinutes;

    let shouldGroup = (senderName === lastSender) && (timeDiff >= 0 && timeDiff < 5);

    // --- CAS 1 : REGROUPEMENT DE MESSAGES ---
    if (shouldGroup) {
        const lastElement = box.lastElementChild;
        if (lastElement && lastElement.classList.contains('message-group')) {
            const bubble = lastElement.querySelector(".chat-bubble");
            if (bubble) {
                const newTextLine = document.createElement("div");
                // >>> MODIFIÉ : La couleur de la ligne de séparation et du texte dépend de isMe <<<
                const borderColor = isMe ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.05)";
                const textColor = isMe ? "white" : "inherit";

                newTextLine.style.cssText = `margin-top:4px; padding-top:4px; border-top:1px solid ${borderColor}; color: ${textColor};`;
                newTextLine.innerHTML = safeContent;
                bubble.appendChild(newTextLine);
                lastTimeMinutes = currentMinutes;
                box.scrollTop = box.scrollHeight;
                return;
            }
        }
    }

    // --- CAS 2 : NOUVEAU BLOC DE MESSAGE ---

    // >>> DÉFINITION DES STYLES DYNAMIQUES SELON L'EXPÉDITEUR <<<
    let flexDir, avatarMargin, textAlign, bubbleBg, bubbleColor, bubbleBorder, borderRadius;

    if (isMe) {
        // C'EST MOI : Alignement droite, Bleu foncé, Texte blanc, Avatar à droite
        flexDir = "row-reverse";
        avatarMargin = "margin-left: 10px;"; // Marge à gauche de l'avatar
        textAlign = "right";
        bubbleBg = "#3b5998"; // Le bleu demandé
        bubbleColor = "white";
        bubbleBorder = "1px solid #2a4073"; // Bordure légèrement plus foncée
        borderRadius = "12px 12px 2px 12px"; // Coin carré en bas à droite
    } else {
        // C'EST UN AUTRE : Alignement gauche (défaut), Gris clair, Texte noir
        flexDir = "row";
        avatarMargin = "margin-right: 10px;"; // Marge à droite de l'avatar
        textAlign = "left";
        bubbleBg = "#f1f1f1";
        bubbleColor = "black";
        bubbleBorder = "1px solid #ddd";
        borderRadius = "12px 12px 12px 2px"; // Coin carré en bas à gauche
    }

    const div = document.createElement("div");
    div.className = "message-group";
    div.style.marginBottom = "15px";
    // Ajout d'un clear pour éviter les soucis de flottement si jamais
    div.style.clear = "both";

    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${senderName}`;

    // >>> APPLICATION DES STYLES DANS LE HTML <<<
    // Note l'utilisation de flex-direction, text-align, background-color, color, etc.
    div.innerHTML = `
        <div style="display: flex; align-items: flex-start; flex-direction: ${flexDir};">
            <img src="${avatarUrl}" alt="Avatar" style="width: 40px; height: 40px; border-radius: 50%; ${avatarMargin}; border: 2px solid #eee;">
            <div style="max-width: 80%; text-align: ${textAlign};">
                <div style="font-size: 0.8em; color: #555; margin-bottom: 2px; margin-left: 2px;">
                    <b>${senderName}</b> <span style="color: #aaa;">[${displayTime}]</span>
                </div>
                <div class="chat-bubble" style="background-color: ${bubbleBg}; color: ${bubbleColor}; border: ${bubbleBorder}; padding: 10px 15px; border-radius: ${borderRadius}; position: relative; word-wrap: break-word; text-align: left;">
                    ${safeContent}
                </div>
            </div>
        </div>
    `;

    box.appendChild(div);
    lastSender = senderName;
    lastTimeMinutes = currentMinutes;
    box.scrollTop = box.scrollHeight;
}
// =================================================================
// 👆 FIN DE LA FONCTION MODIFIÉE 👆
// =================================================================


function showSystemMessage(text) {
    const box = document.getElementById("chat-box");
    if(!box) return;
    lastSender = null;
    const div = document.createElement("div");
    div.style.cssText = "color:#888; font-style:italic; font-size:0.85em; margin-bottom:10px; text-align:center; clear:both;";
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
    if (!list) return;
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
        if (typeof openChat === "function") openChat(username);
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