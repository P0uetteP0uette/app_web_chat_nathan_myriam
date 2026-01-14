/* ================================================================
   LOGIQUE CHAT PRIVÉ + GESTION SONORE + INDICATEUR DE FRAPPE
   + GESTION DES AMIS (Vérification et Demande)
   ================================================================ */

let currentFriend = null;
let popupStompClient = null;
let pendingMessages = {}; 

// --- NOUVEAU : Variable pour stocker le pseudo de la personne à ajouter ---
let targetUserForRequest = null;

// --- VARIABLES INDICATEUR DE FRAPPE ---
let isPrivateTyping = false;
let privateTypingTimeout = null;     // Timer pour l'envoi
let privateDisplayTimeout = null;    // Timer pour l'affichage

// --- GESTION DU SON ---
let soundEnabled = localStorage.getItem("chatSoundEnabled") !== "false";

document.addEventListener("DOMContentLoaded", function() {
    updateSoundButtonUI();

    const savedFriend = localStorage.getItem("openChatFriend_" + currentUserGlobal);
    if (savedFriend) openChat(savedFriend);

    // Détection connexion
    if (document.getElementById("chat-box")) {
        console.log("🔗 Popup : Mode Accueil (Écoute chat.js)");
        window.addEventListener('private-message-received', function(e) {
            onPopupMessageReceived(e.detail);
        });
    } else {
        console.log("🔌 Popup : Mode Autonome (Connexion manuelle)");
        connectStandalone();
    }

    // GESTION DE LA FRAPPE
    const popupInput = document.getElementById("popup-chat-input");
    if (popupInput) {
        popupInput.addEventListener("input", function() {
            if (!currentFriend) return;
            if (!isPrivateTyping) {
                isPrivateTyping = true;
                sendPrivateTypingSignal();
            }
            clearTimeout(privateTypingTimeout);
            privateTypingTimeout = setTimeout(() => {
                isPrivateTyping = false;
            }, 2000);
        });

        popupInput.addEventListener("keydown", function(e) {
            if (e.key === "Enter") {
                isPrivateTyping = false;
                clearTimeout(privateTypingTimeout);
            }
        });
    }
});

// --- FONCTIONS SONORES (Identiques à ton code) ---
function toggleSound() {
    soundEnabled = !soundEnabled; 
    localStorage.setItem("chatSoundEnabled", soundEnabled); 
    updateSoundButtonUI(); 
}

function updateSoundButtonUI() {
    const btnIcon = document.getElementById("sound-icon");
    const btnText = document.getElementById("sound-text");
    const btn = document.getElementById("toggle-sound-btn");
    
    if (btnIcon) btnIcon.className = soundEnabled ? "bi bi-volume-up-fill" : "bi bi-volume-mute-fill";
    if (btnText) btnText.innerText = soundEnabled ? "Son: ON" : "Son: OFF";
    if (btn) btn.style.opacity = soundEnabled ? "1" : "0.6";
}

function playNotificationSound() {
    if (!soundEnabled) return; 
    const audio = document.getElementById("notification-sound");
    if (audio) {
        audio.currentTime = 0; 
        audio.play().catch(e => console.log("Son bloqué"));
    }
}

// --- LOGIQUE CHAT ---
function connectStandalone() {
    var socket = new SockJS('/chat-websocket');
    popupStompClient = Stomp.over(socket);
    popupStompClient.connect({}, function () {
        popupStompClient.subscribe('/user/queue/private', function (payload) {
            onPopupMessageReceived(JSON.parse(payload.body));
        });
    });
}

function onPopupMessageReceived(message) {
    if (typeof currentUserGlobal !== 'undefined' && message.sender === currentUserGlobal) {
        return; 
    }

    if (message.type === 'TYPING') {
        if (currentFriend && message.sender === currentFriend) {
            showPrivateTypingIndicator();
        }
        return; 
    }

    playNotificationSound();

    let conversationPartner = (message.sender === currentUserGlobal) ? message.recipient : message.sender;
    
    if (currentFriend && currentFriend === conversationPartner) {
        hidePrivateTypingIndicator(); 
        displayMessage(message);
        scrollToBottom();
        return;
    }
    
    if (!pendingMessages[conversationPartner]) {
        pendingMessages[conversationPartner] = [];
    }
    pendingMessages[conversationPartner].push(message);
    showNotification(conversationPartner);
}

// --- FONCTIONS D'ENVOI ---
function sendPrivateTypingSignal() {
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

    const tempMsg = {
        sender: currentUserGlobal,
        content: content,
        timestamp: new Date().toISOString()
    };
    displayMessage(tempMsg);
    scrollToBottom();
    input.value = "";
    input.focus();

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
function showPrivateTypingIndicator() {
    const indicator = document.getElementById("private-typing-indicator");
    if (!indicator) return;

    indicator.innerText = "En train d'écrire...";
    indicator.style.display = "block";

    if (privateDisplayTimeout) clearTimeout(privateDisplayTimeout);

    privateDisplayTimeout = setTimeout(() => {
        hidePrivateTypingIndicator();
    }, 3500);
}

function hidePrivateTypingIndicator() {
    const indicator = document.getElementById("private-typing-indicator");
    if (indicator) {
        indicator.innerText = "";
    }
}

// --- MODIFICATION MAJEURE ICI : openChat devient ASYNC ---
async function openChat(friendName) {
    console.log("🚀 [POPUP] openChat appelée pour :", friendName); // LOG DE DEBUG

    // Si c'est nous-même, on arrête
    if (friendName === currentUserGlobal) return;

    // 1. On demande au serveur : "Est-ce qu'on est amis ?"
    try {
        const response = await fetch(`/api/friends/check?target=${friendName}`);
        const areFriends = await response.json();

        if (areFriends) {
            // A. OUI -> On ouvre le chat normalement (ta logique existante)
            startChatLogic(friendName);
        } else {
            // B. NON -> On ouvre la modal "Ajouter ami"
            openAddFriendModal(friendName);
        }
    } catch (e) {
        console.error("Erreur vérification amitié", e);
        // SECURITÉ : En cas d'erreur (serveur éteint, bug...), ON BLOQUE L'ACCÈS.
        alert("Impossible de vérifier l'amitié. Veuillez rafraîchir la page.");
        // startChatLogic(friendName); // <--- ON COMMENTE OU SUPPRIME CETTE LIGNE
    }
}

window.openChat = openChat;
console.log("✅ [POPUP] openChat est maintenant attachée à window et globale.");

// --- TA LOGIQUE D'OUVERTURE DE CHAT DÉPLACÉE ICI ---
function startChatLogic(friendName) {
    currentFriend = friendName;
    const nameLabel = document.getElementById("popup-friend-name");
    if(nameLabel) nameLabel.innerText = friendName;

    const win = document.getElementById("popup-window");
    if(win) win.style.display = "block";

    localStorage.setItem("openChatFriend_" + currentUserGlobal, friendName);
    
    hidePrivateTypingIndicator();
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
    localStorage.removeItem("openChatFriend_" + currentUserGlobal);
}

// --- NOUVELLES FONCTIONS POUR LA MODAL ---
function openAddFriendModal(username) {
    targetUserForRequest = username;
    const modalTargetText = document.getElementById("modal-target-user");
    if(modalTargetText) modalTargetText.innerText = username;
    
    const modal = document.getElementById("add-friend-modal");
    if(modal) modal.style.display = "flex";
}

function closeAddFriendModal() {
    const modal = document.getElementById("add-friend-modal");
    if(modal) modal.style.display = "none";
    targetUserForRequest = null;
}

function confirmAddFriend() {
    if (!targetUserForRequest) return;
    
    // Récupérer la zone de texte qu'on vient de créer
    const feedbackZone = document.getElementById("modal-feedback");
    if(feedbackZone) {
        feedbackZone.innerText = "Envoi en cours...";
        feedbackZone.style.color = "blue";
    }

    fetch('/api/friends/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `receiverUsername=${targetUserForRequest}`
    })
    .then(response => response.text())
    .then(msg => {
        // --- REMPLACEMENT DE L'ALERT ---
        if (feedbackZone) {
            feedbackZone.innerText = msg; // Affiche le message du serveur

            // Change la couleur selon le succès ou l'échec
            if (msg.includes("succès") || msg.includes("sent")) {
                feedbackZone.style.color = "green";
                // Optionnel : Fermer la modal automatiquement après 1.5 seconde si succès
                setTimeout(() => {
                    closeAddFriendModal();
                    feedbackZone.innerText = ""; // On vide pour la prochaine fois
                }, 1500);
            } else {
                feedbackZone.style.color = "red";
            }
        }
    })
    .catch(err => {
        console.error(err);
        if (feedbackZone) {
            feedbackZone.innerText = "Erreur technique.";
            feedbackZone.style.color = "red";
        }
    });
}
// -----------------------------------------

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

    // 1. Création du conteneur avec la classe CSS propre
    const container = document.createElement("div");
    container.className = "popup-msg-container " + (isMe ? "sent" : "received");
    
    if (isMe) container.classList.add("message-sent");
    else container.classList.add("message-received");

    // 2. L'heure
    const timeDiv = document.createElement("div");
    timeDiv.className = "popup-msg-time"; 
    timeDiv.innerText = timeStr;

    // 3. La bulle
    const bubbleDiv = document.createElement("div");
    bubbleDiv.className = "popup-bubble"; 
    bubbleDiv.innerText = msg.content;

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

// Notifications Visuelles (Identiques)
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