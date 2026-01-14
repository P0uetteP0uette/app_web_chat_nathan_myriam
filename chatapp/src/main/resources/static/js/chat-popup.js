/* ================================================================
   LOGIQUE CHAT PRIVÉ + GESTION SONORE + INDICATEUR DE FRAPPE
   ================================================================ */

let currentFriend = null;
let popupStompClient = null;
let pendingMessages = {}; 

// --- VARIABLES INDICATEUR DE FRAPPE (Nouveau) ---
let isPrivateTyping = false;
let privateTypingTimeout = null;     // Timer pour l'envoi
let privateDisplayTimeout = null;    // Timer pour l'affichage

// --- GESTION DU SON ---
// On récupère la préférence de l'utilisateur (par défaut : ON)
let soundEnabled = localStorage.getItem("chatSoundEnabled") !== "false";

document.addEventListener("DOMContentLoaded", function() {
    // 1. Initialiser le bouton de son
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

    // 3. GESTION DE LA FRAPPE (DETECTEUR)
    const popupInput = document.getElementById("popup-chat-input");
    if (popupInput) {
        popupInput.addEventListener("input", function() {
            // Si aucun ami sélectionné, on ne fait rien
            if (!currentFriend) return;

            // Si on n'est pas déjà marqué comme "écrivant", on envoie le signal
            if (!isPrivateTyping) {
                isPrivateTyping = true;
                sendPrivateTypingSignal();
            }

            // On reset le timer d'arrêt
            clearTimeout(privateTypingTimeout);
            
            // Après 2 secondes sans frappe, on considère qu'on a arrêté
            privateTypingTimeout = setTimeout(() => {
                isPrivateTyping = false;
            }, 2000);
        });

        // Si on appuie sur Entrée, on arrête direct l'indicateur
        popupInput.addEventListener("keydown", function(e) {
            if (e.key === "Enter") {
                isPrivateTyping = false;
                clearTimeout(privateTypingTimeout);
            }
        });
    }
});

// --- FONCTIONS SONORES (SÉCURISÉES) ---

function toggleSound() {
    soundEnabled = !soundEnabled; // On inverse
    localStorage.setItem("chatSoundEnabled", soundEnabled); // On sauvegarde
    updateSoundButtonUI(); // On change l'icône
}

function updateSoundButtonUI() {
    const btnIcon = document.getElementById("sound-icon");
    const btnText = document.getElementById("sound-text");
    const btn = document.getElementById("toggle-sound-btn");
    
    if (btnIcon) {
        btnIcon.className = soundEnabled ? "bi bi-volume-up-fill" : "bi bi-volume-mute-fill";
    }
    if (btnText) {
        btnText.innerText = soundEnabled ? "Son: ON" : "Son: OFF";
    }
    if (btn) {
        btn.style.opacity = soundEnabled ? "1" : "0.6";
    }
}

function playNotificationSound() {
    if (!soundEnabled) return; 

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
    // popupStompClient.debug = null; 
    popupStompClient.connect({}, function () {
        popupStompClient.subscribe('/user/queue/private', function (payload) {
            onPopupMessageReceived(JSON.parse(payload.body));
        });
    });
}

function onPopupMessageReceived(message) {
    // 1. SÉCURITÉ ANTI-ÉCHO
    if (typeof currentUserGlobal !== 'undefined' && message.sender === currentUserGlobal) {
        return; 
    }

    // --- GESTION "EN TRAIN D'ÉCRIRE" ---
    if (message.type === 'TYPING') {
        // Si la fenêtre est ouverte sur cette personne, on affiche l'indicateur
        if (currentFriend && message.sender === currentFriend) {
            showPrivateTypingIndicator();
        }
        return; // STOP ICI
    }

    // 2. MESSAGE STANDARD
    playNotificationSound(); // Son joué car ce n'est pas moi

    let conversationPartner = (message.sender === currentUserGlobal) ? message.recipient : message.sender;
    
    // Si la fenêtre est ouverte sur cette personne
    if (currentFriend && currentFriend === conversationPartner) {
        hidePrivateTypingIndicator(); // On efface "écrit..." car le vrai message est là
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

// --- FONCTIONS D'ENVOI ---

// Envoi du signal "Je suis en train d'écrire"
function sendPrivateTypingSignal() {
    // On cherche quel client WebSocket est actif (Main ou Popup)
    let activeClient = null;
    if (typeof stompClient !== 'undefined' && stompClient && stompClient.connected) {
        activeClient = stompClient;
    } else if (popupStompClient && popupStompClient.connected) {
        activeClient = popupStompClient;
    }

    if (activeClient && currentFriend) {
        const msg = { 
            sender: currentUserGlobal, 
            recipient: currentFriend, 
            type: 'TYPING' 
        };
        activeClient.send("/app/chat.private.typing", {}, JSON.stringify(msg));
    }
}

function sendPrivateMessage() {
    const input = document.getElementById("popup-chat-input");
    const content = input.value.trim();
    
    if (!content || !currentFriend) return;

    // Affichage immédiat
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

// --- UI & AFFICHAGE ---

// Affiche "Machin écrit..."
function showPrivateTypingIndicator() {
    const indicator = document.getElementById("private-typing-indicator");
    if (!indicator) return; // Si la div n'est pas dans le HTML, on sort

    indicator.innerText = "En train d'écrire...";
    indicator.style.display = "block";

    // On efface le timer précédent s'il y en a un
    if (privateDisplayTimeout) clearTimeout(privateDisplayTimeout);

    // On efface le texte après 3.5 secondes si pas de nouveau signal
    privateDisplayTimeout = setTimeout(() => {
        hidePrivateTypingIndicator();
    }, 3500);
}

// Cache "Machin écrit..."
function hidePrivateTypingIndicator() {
    const indicator = document.getElementById("private-typing-indicator");
    if (indicator) {
        indicator.innerText = "";
        // indicator.style.display = "none"; // Optionnel
    }
}

function openChat(friendName) {
    currentFriend = friendName;
    const nameLabel = document.getElementById("popup-friend-name");
    if(nameLabel) nameLabel.innerText = friendName;

    const win = document.getElementById("popup-window");
    if(win) win.style.display = "block";

    localStorage.setItem("openChatFriend", friendName);
    
    hidePrivateTypingIndicator(); // Reset indicateur à l'ouverture
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

    // 1. Création du conteneur avec la NOUVELLE classe
    const container = document.createElement("div");
    // "popup-msg-container" au lieu de "msg-container"
    container.className = "popup-msg-container " + (isMe ? "sent" : "received");
    
    // On ajoute aussi une classe helper pour la couleur
    if (isMe) container.classList.add("message-sent");
    else container.classList.add("message-received");

    // 2. L'heure (avec nouvelle classe)
    const timeDiv = document.createElement("div");
    timeDiv.className = "popup-msg-time"; // Au lieu de msg-time
    timeDiv.innerText = timeStr;

    // 3. La bulle (avec NOUVELLE classe)
    const bubbleDiv = document.createElement("div");
    bubbleDiv.className = "popup-bubble"; // Au lieu de message-bubble <--- C'EST CA QUI SAUVE TOUT
    bubbleDiv.innerText = msg.content;

    // Ordre d'ajout (Heure en premier ou dernier selon tes goûts, ici comme avant)
    container.appendChild(timeDiv);
    container.appendChild(bubbleDiv);
    
    chatBody.appendChild(container);
    scrollToBottom();
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