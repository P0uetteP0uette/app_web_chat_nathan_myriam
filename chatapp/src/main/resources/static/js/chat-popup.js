/* ================================================================
   LOGIQUE CHAT PRIVÉ + GESTION SONORE (CORRIGÉ)
   ================================================================ */

let currentFriend = null;
let popupStompClient = null;
let pendingMessages = {}; 

// --- GESTION DU SON ---
// On récupère la préférence de l'utilisateur (par défaut : ON)
let soundEnabled = localStorage.getItem("chatSoundEnabled") !== "false";

document.addEventListener("DOMContentLoaded", function() {
    // 1. Initialiser le bouton de son (si on est sur l'accueil)
    updateSoundButtonUI();

    const savedFriend = localStorage.getItem("openChatFriend");
    if (savedFriend) openChat(savedFriend);

    // 2. Détection connexion
    if (document.getElementById("chat-box")) {
        console.log("🔗 Popup : Mode Accueil (Écoute chat.js)");
        window.addEventListener('private-message-received', function(e) {
            onPopupMessageReceived(e.detail);
        });
    } else {
        console.log("🔌 Popup : Mode Autonome (Connexion manuelle)");
        connectStandalone();
    }
});

// --- FONCTIONS SONORES (SÉCURISÉES) ---

function toggleSound() {
    soundEnabled = !soundEnabled; // On inverse
    localStorage.setItem("chatSoundEnabled", soundEnabled); // On sauvegarde
    updateSoundButtonUI(); // On change l'icône
}

// C'est ici que ça plantait ("Cannot read properties of null")
function updateSoundButtonUI() {
    const btnIcon = document.getElementById("sound-icon");
    const btnText = document.getElementById("sound-text");
    const btn = document.getElementById("toggle-sound-btn");
    
    // On met à jour chaque élément SÉPARÉMENT et seulement s'il existe
    if (btnIcon) {
        btnIcon.className = soundEnabled ? "bi bi-volume-up-fill" : "bi bi-volume-mute-fill";
    }

    if (btnText) {
        btnText.innerText = soundEnabled ? "Son: ON" : "Son: OFF";
    }

    if (btn) {
        // La ligne qui faisait planter le script est maintenant protégée
        btn.style.opacity = soundEnabled ? "1" : "0.6";
    }
}

function playNotificationSound() {
    if (!soundEnabled) return; // Si muet, on ne fait RIEN.

    const audio = document.getElementById("notification-sound");
    if (audio) {
        audio.currentTime = 0; 
        audio.play().catch(e => console.log("Son bloqué (interaction requise)"));
    }
}

// --- LOGIQUE CHAT ---

function connectStandalone() {
    var socket = new SockJS('/chat-websocket');
    popupStompClient = Stomp.over(socket);
    // popupStompClient.debug = null; // Décommenter pour cacher les logs
    popupStompClient.connect({}, function () {
        popupStompClient.subscribe('/user/queue/private', function (payload) {
            onPopupMessageReceived(JSON.parse(payload.body));
        });
    });
}

function onPopupMessageReceived(message) {
    // 1. SÉCURITÉ ANTI-ÉCHO : Si c'est MOI qui ai envoyé, STOP.
    // On vérifie currentUserGlobal (défini dans le HTML ou chat.js)
    if (typeof currentUserGlobal !== 'undefined' && message.sender === currentUserGlobal) {
        return; 
    }

    // 2. JOUE LE SON (Seulement si ce n'est pas moi)
    playNotificationSound();

    let conversationPartner = (message.sender === currentUserGlobal) ? message.recipient : message.sender;
    
    // Si la fenêtre est ouverte sur cette personne, on affiche direct
    if (currentFriend && currentFriend === conversationPartner) {
        displayMessage(message);
        scrollToBottom();
        return;
    }
    
    // Sinon, on stocke et on notifie
    if (!pendingMessages[conversationPartner]) {
        pendingMessages[conversationPartner] = [];
    }
    pendingMessages[conversationPartner].push(message);
    showNotification(conversationPartner);
}

function sendPrivateMessage() {
    const input = document.getElementById("popup-chat-input");
    const content = input.value.trim();
    
    if (!content || !currentFriend) return;

    // Affichage immédiat (Visuel seulement, pas de son ici)
    const tempMsg = {
        sender: currentUserGlobal,
        content: content,
        timestamp: new Date().toISOString()
    };
    displayMessage(tempMsg);
    scrollToBottom();
    input.value = "";
    input.focus();

    // Envoi serveur
    let activeClient = null;
    if (typeof stompClient !== 'undefined' && stompClient && stompClient.connected) {
        activeClient = stompClient;
    } else if (popupStompClient && popupStompClient.connected) {
        activeClient = popupStompClient;
    }

    if (activeClient) {
        const chatMessage = {
            sender: currentUserGlobal,
            recipient: currentFriend,
            content: content,
            type: 'CHAT'
        };
        activeClient.send("/app/chat.private", {}, JSON.stringify(chatMessage));
    }
}

function openChat(friendName) {
    currentFriend = friendName;
    const nameLabel = document.getElementById("popup-friend-name");
    if(nameLabel) nameLabel.innerText = friendName;

    const win = document.getElementById("popup-window");
    if(win) win.style.display = "block";

    localStorage.setItem("openChatFriend", friendName);
    loadMessages();
    
    if (pendingMessages[friendName] && pendingMessages[friendName].length > 0) {
        setTimeout(() => {
            pendingMessages[friendName].forEach(msg => displayMessage(msg));
            scrollToBottom();
            delete pendingMessages[friendName];
        }, 500);
    }
    
    setTimeout(() => {
         const input = document.getElementById("popup-chat-input");
         if(input) input.focus();
    }, 100);
    
    clearNotification(friendName);
}

function closeChat() {
    const win = document.getElementById("popup-window");
    if(win) win.style.display = "none";
    currentFriend = null;
    localStorage.removeItem("openChatFriend");
}

function loadMessages() {
    if (!currentFriend) return;
    const chatBody = document.getElementById("popup-chat-body");
    fetch('/api/chat/history/' + currentFriend)
        .then(res => res.json())
        .then(messages => {
            if(chatBody) {
                chatBody.innerHTML = "";
                messages.forEach(msg => displayMessage(msg));
                scrollToBottom();
            }
        });
}

function displayMessage(msg) {
    const chatBody = document.getElementById("popup-chat-body");
    if (!chatBody) return;

    let isMe = (msg.sender === currentUserGlobal);
    let timeStr = "";
    try {
        if (msg.timestamp) timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        else if (msg.time) timeStr = msg.time;
    } catch(e) {}

    const container = document.createElement("div");
    container.className = "msg-container " + (isMe ? "sent" : "received");
    if (isMe) container.classList.add("message-sent");
    else container.classList.add("message-received");

    const timeDiv = document.createElement("div");
    timeDiv.className = "msg-time";
    timeDiv.innerText = timeStr;

    const bubbleDiv = document.createElement("div");
    bubbleDiv.className = "message-bubble";
    bubbleDiv.innerText = msg.content;

    container.appendChild(timeDiv);
    container.appendChild(bubbleDiv);
    chatBody.appendChild(container);
}

function scrollToBottom() {
    const chatBody = document.getElementById("popup-chat-body");
    if(chatBody) chatBody.scrollTop = chatBody.scrollHeight;
}

function handleKeyPress(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        sendPrivateMessage();
    }
}

// Notifications Visuelles
function showNotification(friendName) {
    const userElement = document.getElementById("user-" + friendName);
    if (userElement && !userElement.querySelector('.notification-badge')) {
        const badge = document.createElement("span");
        badge.className = "notification-badge";
        badge.style.cssText = "background: #e74c3c; color: white; border-radius: 50%; width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.7em; margin-left: auto; font-weight: bold;";
        badge.innerText = "!";
        userElement.appendChild(badge);
    }
    
    const friendButtons = document.querySelectorAll(`[data-friend="${friendName}"]`);
    friendButtons.forEach(btn => {
        if (!btn.querySelector('.notification-badge')) {
            const badge = document.createElement("span");
            badge.className = "notification-badge";
            badge.style.cssText = "position: absolute; top: -5px; right: -5px; background: #e74c3c; color: white; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 0.7em; font-weight: bold;";
            badge.innerText = "!";
            btn.style.position = "relative";
            btn.appendChild(badge);
        }
    });
}

function clearNotification(friendName) {
    const userElement = document.getElementById("user-" + friendName);
    if (userElement) {
        const badge = userElement.querySelector('.notification-badge');
        if (badge) badge.remove();
    }
    const friendButtons = document.querySelectorAll(`[data-friend="${friendName}"]`);
    friendButtons.forEach(btn => {
        const badge = btn.querySelector('.notification-badge');
        if (badge) badge.remove();
    });
}