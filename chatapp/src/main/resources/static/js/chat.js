/* ================================================================
   CHAT GÉNÉRAL (Main Controller) - VERSION "EXPÉRIENCE UTILISATEUR"
   (Avec Mentions, Titre Dynamique et Scroll Button)
   ================================================================ */

let stompClient = null;
let selectedUser = null;
let userStatuses = {};
let lastSender = null;
let lastTimeMinutes = -1;

let isTyping = false;
let typingTimeout = null;
let typingDisplayTimeout = null;

// --- VARIABLES GLOBALES (NOUVEAU) ---
let unreadCount = 0;
let originalTitle = document.title;

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

    // --- 1. GESTION DU TITRE D'ONGLET (NOUVEAU) ---
    // Quand l'utilisateur revient sur la page, on remet le titre normal
    document.addEventListener("visibilitychange", function() {
        if (document.visibilityState === "visible") {
            unreadCount = 0;
            document.title = originalTitle;
        }
    });

    // --- 2. GESTION DU SCROLL BUTTON (NOUVEAU) ---
    const chatBox = document.getElementById("chat-box");
    const scrollBtn = document.getElementById("scroll-down-btn");

    if (chatBox) {
        chatBox.addEventListener("scroll", function() {
            // Si on remonte de plus de 100px, on affiche le bouton
            if (chatBox.scrollTop < (chatBox.scrollHeight - chatBox.clientHeight - 100)) {
                if(scrollBtn) scrollBtn.style.display = "block";
            } else {
                if(scrollBtn) scrollBtn.style.display = "none";
            }
        });
    }

    // 3. Charger Users
    fetch('/api/users')
        .then(response => response.json())
        .then(usersMap => {
            for (const [username, status] of Object.entries(usersMap)) {
                userStatuses[username] = status;
                addUserToSidebar(username, status);
            }
        });

    // 4. Charger Historique
    fetch('/api/history')
        .then(response => response.json())
        .then(messages => {
            messages.forEach(msg => showChatMessage(msg));
        });

    // 5. WebSocket
    const socket = new SockJS('/chat-websocket');
    stompClient = Stomp.over(socket);

    stompClient.connect({}, () => {
        stompClient.subscribe('/topic/public', (payload) => {
            onMessageReceived(JSON.parse(payload.body));
        });

        stompClient.subscribe('/user/queue/private', (payload) => {
            const msg = JSON.parse(payload.body);
            const event = new CustomEvent('private-message-received', { detail: msg });
            window.dispatchEvent(event);
            const sender = msg.sender || msg.from;
            if (document.hidden && msg.type !== 'TYPING') {
                unreadCount++;
                document.title = `(${unreadCount}) Nouveaux messages`;
            }
            if (isSoundOn && sender !== currentUserGlobal && msg.type === 'CHAT') {
                playNotificationSound();
            }
        });

        stompClient.subscribe('/user/queue/friends', function (payload) {
            console.log("🔔 Nouvelle demande d'ami reçue !");
            updateFriendRequestBadge(); // On appelle la fonction qui gère l'affichage
        });

        stompClient.send("/app/chat.addUser", {}, JSON.stringify({}));
    });

    // 6. Gestion de la zone de saisie (Input + Emojis)
    const msgInput = document.getElementById("message");
    
    if(msgInput) {
        // A. Gestion Entrée + Typing Indicator
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
                    const typingMsg = { sender: currentUserGlobal, type: 'TYPING' };
                    stompClient.send("/app/chat.typing", {}, JSON.stringify(typingMsg));
                }
            }
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => { isTyping = false; }, 2000);
        });

        // B. GESTION DU SÉLECTEUR D'EMOJIS
        const emojiBtn = document.getElementById('emoji-btn');
        const emojiContainer = document.getElementById('emoji-picker-container');

        if (emojiBtn && emojiContainer && window.picmo) {
            const picker = picmo.createPicker({
                rootElement: emojiContainer,
                locale: 'fr',
                autoFocus: 'search',
                theme: 'light'
            });

            emojiBtn.addEventListener('click', function(e) {
                e.stopPropagation(); 
                if (emojiContainer.style.display === 'none' || emojiContainer.style.display === '') {
                    emojiContainer.style.display = 'block';
                } else {
                    emojiContainer.style.display = 'none';
                }
            });

            picker.addEventListener('emoji:select', function(event) {
                msgInput.value += event.emoji;
                msgInput.focus();
                msgInput.dispatchEvent(new Event('input')); 
            });

            document.addEventListener('click', function(e) {
                if (!emojiBtn.contains(e.target) && !emojiContainer.contains(e.target)) {
                    emojiContainer.style.display = 'none';
                }
            });
        }
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
        const emojiContainer = document.getElementById('emoji-picker-container');
        if (emojiContainer) emojiContainer.style.display = 'none';
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

// Fonction pour ajouter +1 à la notification sans recharger
function updateFriendRequestBadge() {
    // 1. On cherche le bouton "Trouver des amis"
    // (On cherche le lien qui contient href="/find-friends")
    const btn = document.querySelector('a[href="/find-friends"]');
    
    if (!btn) return; // Sécurité si on n'est pas sur la bonne page

    // 2. On regarde si la bulle existe déjà
    let badge = btn.querySelector("span");

    if (badge) {
        // CAS A : La bulle existe -> On augmente le chiffre
        let count = parseInt(badge.innerText);
        badge.innerText = count + 1;
    } else {
        // CAS B : Pas de bulle -> On la crée (avec le même style que Thymeleaf)
        badge = document.createElement("span");
        badge.innerText = "1";
        
        // On copie le style CSS qu'on a mis dans le HTML tout à l'heure
        badge.style.cssText = `
            position: absolute;
            top: -8px;
            right: -8px;
            background-color: #e74c3c;
            color: white;
            border-radius: 50%;
            width: 22px;
            height: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
            font-weight: bold;
            border: 2px solid #2c3e50;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;
        
        btn.appendChild(badge);
    }
    
    // Petit bonus : un son de notification si tu veux !
    // playNotificationSound(); 
}

function onMessageReceived(msg) {
    // --- MISE A JOUR DU TITRE D'ONGLET (NOUVEAU) ---
    if (document.hidden && msg.type === 'CHAT') {
        unreadCount++;
        document.title = `(${unreadCount}) Nouveaux messages`;
    }
    // -----------------------------------------------

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

// Fonction utilitaire pour traiter le texte (Sécurité + Mentions)
function formatMessageContent(rawContent) {
    // 1. Sécuriser le texte (empêche le HTML malveillant mais garde les emojis)
    let safeContent = escapeHtml(rawContent);

    // 2. Transformer les @Pseudo en span coloré (NOUVEAU)
    safeContent = safeContent.replace(/@(\w+)/g, function(match, username) {
        if (username === currentUserGlobal) {
            return `<span class="mention mention-me">@${username}</span>`;
        } else {
            return `<span class="mention">@${username}</span>`;
        }
    });

    return safeContent;
}

function showChatMessage(msg) {
    const box = document.getElementById("chat-box");
    if (!box) return;

    const senderName = msg.from || msg.sender || "Inconnu";
    const isMe = (senderName === currentUserGlobal);

    let displayTime = msg.time;
    if (!displayTime && msg.timestamp) {
        try { displayTime = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch(e) {}
    }
    if (!displayTime) displayTime = "";

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
                const borderColor = isMe ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.05)";
                const textColor = isMe ? "white" : "inherit";

                newTextLine.style.cssText = `margin-top:4px; padding-top:4px; border-top:1px solid ${borderColor}; color: ${textColor};`;
                
                // Utilisation de innerHTML avec contenu sécurisé pour afficher les mentions
                newTextLine.innerHTML = formatMessageContent(msg.content);

                bubble.appendChild(newTextLine);
                lastTimeMinutes = currentMinutes;
                box.scrollTop = box.scrollHeight;
                return;
            }
        }
    }

    // --- CAS 2 : NOUVEAU BLOC DE MESSAGE ---
    let flexDir, avatarMargin, textAlign, bubbleBg, bubbleColor, bubbleBorder, borderRadius;

    if (isMe) {
        flexDir = "row-reverse";
        avatarMargin = "margin-left: 10px;";
        textAlign = "right";
        bubbleBg = "#3b5998";
        bubbleColor = "white";
        bubbleBorder = "1px solid #2a4073";
        borderRadius = "12px 12px 2px 12px";
    } else {
        flexDir = "row";
        avatarMargin = "margin-right: 10px;";
        textAlign = "left";
        bubbleBg = "#f1f1f1";
        bubbleColor = "black";
        bubbleBorder = "1px solid #ddd";
        borderRadius = "12px 12px 12px 2px";
    }

    const div = document.createElement("div");
    div.className = "message-group";
    div.style.marginBottom = "15px";
    div.style.clear = "both";

    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${senderName}`;

    div.innerHTML = `
        <div style="display: flex; align-items: flex-start; flex-direction: ${flexDir};">
            <img src="${avatarUrl}" alt="Avatar" style="width: 40px; height: 40px; border-radius: 50%; ${avatarMargin}; border: 2px solid #eee;">
            <div style="max-width: 80%; text-align: ${textAlign};">
                <div style="font-size: 0.8em; color: #555; margin-bottom: 2px; margin-left: 2px;">
                    <b>${senderName}</b> <span style="color: #aaa;">[${displayTime}]</span>
                </div>
                <div class="chat-bubble" style="background-color: ${bubbleBg}; color: ${bubbleColor}; border: ${bubbleBorder}; padding: 10px 15px; border-radius: ${borderRadius}; position: relative; word-wrap: break-word; text-align: left;"></div>
            </div>
        </div>
    `;

    // Utilisation de innerHTML avec contenu sécurisé pour afficher les mentions
    const bubble = div.querySelector(".chat-bubble");
    bubble.innerHTML = formatMessageContent(msg.content); 

    box.appendChild(div);
    lastSender = senderName;
    lastTimeMinutes = currentMinutes;
    box.scrollTop = box.scrollHeight;
}

function scrollToBottom() {
    const box = document.getElementById("chat-box");
    if(box) {
        box.scrollTop = box.scrollHeight;
    }
}

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
        console.log("👇 [CHAT] Clic détecté sur :", username);
        
        // Test 1 : Est-ce que la fonction existe normalement ?
        console.log("🔍 [CHAT] Type of openChat :", typeof openChat);
        
        // Test 2 : Est-ce qu'elle existe sur window ?
        console.log("🔍 [CHAT] Type of window.openChat :", typeof window.openChat);

        if (typeof openChat === "function") {
            console.log("✅ [CHAT] Appel via openChat direct");
            openChat(username);
        } 
        else if (typeof window.openChat === "function") {
            console.log("✅ [CHAT] Appel via window.openChat (Secours)");
            window.openChat(username);
        } 
        else {
            console.error("❌ [CHAT] CRITIQUE : La fonction openChat est introuvable !");
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