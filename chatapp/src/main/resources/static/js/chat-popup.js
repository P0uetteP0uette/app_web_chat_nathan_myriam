/**
 * @file chat-popup.js
 * @description Gestion de la logique du chat privé (popup), des notifications sonores,
 * de l'indicateur de frappe et de la modale d'ajout d'ami.
 * * Ce script gère l'interface WebSocket pour les messages privés (/user/queue/private)
 * et les interactions DOM pour la fenêtre de discussion flottante.
 */

// --- VARIABLES GLOBALES ---

/** @type {string|null} Pseudo de l'ami avec qui la discussion est ouverte. */
let currentFriend = null;

/** @type {Object|null} Client Stomp pour la connexion WebSocket autonome (si hors page principale). */
let popupStompClient = null;

/** @type {Object} Stockage temporaire des messages reçus pour les fenêtres fermées. */
let pendingMessages = {}; 

/** @type {string|null} Cible de la demande d'ami (pour la modale). */
let targetUserForRequest = null;

// --- VARIABLES INDICATEUR DE FRAPPE ---
let isPrivateTyping = false;
let privateTypingTimeout = null;
let privateDisplayTimeout = null;

/** @type {boolean} État du son (activé/désactivé), persisté dans le localStorage. */
let soundEnabled = localStorage.getItem("chatSoundEnabled") !== "false";

/**
 * Initialisation au chargement du DOM.
 * Restaure la session de chat, configure les écouteurs d'événements et le son.
 */
document.addEventListener("DOMContentLoaded", function() {
    updateSoundButtonUI();

    // Restaure le chat ouvert (lié spécifiquement à l'utilisateur connecté pour éviter les conflits)
    const savedFriend = localStorage.getItem("openChatFriend_" + currentUserGlobal);
    if (savedFriend) openChat(savedFriend);

    // Détection du mode de fonctionnement (Intégré vs Autonome)
    if (document.getElementById("chat-box")) {
        // Mode Intégré : On écoute l'événement relayé par chat.js
        window.addEventListener('private-message-received', function(e) {
            onPopupMessageReceived(e.detail);
        });
    } else {
        // Mode Autonome : Connexion manuelle au WebSocket
        connectStandalone();
    }

    // Gestion de l'input et de l'indicateur de frappe
    const popupInput = document.getElementById("popup-chat-input");
    if (popupInput) {
        popupInput.addEventListener("input", function() {
            if (!currentFriend) return;
            
            // Envoie le signal "TYPING" une seule fois au début de la frappe
            if (!isPrivateTyping) {
                isPrivateTyping = true;
                sendPrivateTypingSignal();
            }
            
            // Debounce : Réinitialise le statut après 2 secondes d'inactivité
            clearTimeout(privateTypingTimeout);
            privateTypingTimeout = setTimeout(() => {
                isPrivateTyping = false;
            }, 2000);
        });

        // Arrêt immédiat du typing lors de l'envoi (Entrée)
        popupInput.addEventListener("keydown", function(e) {
            if (e.key === "Enter") {
                isPrivateTyping = false;
                clearTimeout(privateTypingTimeout);
            }
        });
    }
});

/* ================================================================
   GESTION SONORE
   ================================================================ */

/**
 * Met à jour l'icône et le texte du bouton de son dans l'interface.
 */
function updateSoundButtonUI() {
    const btnIcon = document.getElementById("sound-icon");
    const btnText = document.getElementById("sound-text");
    const btn = document.getElementById("toggle-sound-btn");
    
    if (btnIcon) btnIcon.className = soundEnabled ? "bi bi-volume-up-fill" : "bi bi-volume-mute-fill";
    if (btnText) btnText.innerText = soundEnabled ? "Son: ON" : "Son: OFF";
    if (btn) btn.style.opacity = soundEnabled ? "1" : "0.6";
}

/**
 * Joue le son de notification si l'option est activée.
 */
function playNotificationSound() {
    if (!soundEnabled) return; 
    const audio = document.getElementById("notification-sound");
    if (audio) {
        audio.currentTime = 0; 
        audio.play().catch(() => {}); // Catch pour éviter les erreurs si le navigateur bloque l'autoplay
    }
}

/* ================================================================
   LOGIQUE CHAT & WEBSOCKET
   ================================================================ */

/**
 * Établit une connexion WebSocket indépendante (utilisé si la popup est détachée).
 */
function connectStandalone() {
    var socket = new SockJS('/chat-websocket');
    popupStompClient = Stomp.over(socket);
    popupStompClient.debug = null; 
    popupStompClient.connect({}, function () {
        popupStompClient.subscribe('/user/queue/private', function (payload) {
            onPopupMessageReceived(JSON.parse(payload.body));
        });
    });
}

/**
 * Traite les messages entrants (Chat ou Typing).
 * @param {Object} message - L'objet message reçu du WebSocket.
 */
function onPopupMessageReceived(message) {
    // Ignore ses propres messages (écho)
    if (typeof currentUserGlobal !== 'undefined' && message.sender === currentUserGlobal) return;

    // Gestion de l'indicateur de frappe
    if (message.type === 'TYPING') {
        if (currentFriend && message.sender === currentFriend) {
            showPrivateTypingIndicator();
        }
        return; 
    }

    // Nouveau message réel reçu
    playNotificationSound();

    let conversationPartner = (message.sender === currentUserGlobal) ? message.recipient : message.sender;
    
    // Si la fenêtre est ouverte sur la bonne personne, on affiche directement
    if (currentFriend && currentFriend === conversationPartner) {
        hidePrivateTypingIndicator(); 
        displayMessage(message);
        scrollToBottom();
        return;
    }
    
    // Sinon, on stocke en attente et on affiche une notification visuelle
    if (!pendingMessages[conversationPartner]) {
        pendingMessages[conversationPartner] = [];
    }
    pendingMessages[conversationPartner].push(message);
    showNotification(conversationPartner);
}

/* ================================================================
   ENVOI DE MESSAGES
   ================================================================ */

/**
 * Envoie un signal "TYPING" au destinataire via WebSocket.
 */
function sendPrivateTypingSignal() {
    let activeClient = (typeof stompClient !== 'undefined' && stompClient && stompClient.connected) ? stompClient : popupStompClient;

    if (activeClient && currentFriend) {
        const msg = { sender: currentUserGlobal, recipient: currentFriend, type: 'TYPING' };
        activeClient.send("/app/chat.private.typing", {}, JSON.stringify(msg));
    }
}

/**
 * Récupère le texte de l'input, l'affiche localement et l'envoie au serveur.
 */
function sendPrivateMessage() {
    const input = document.getElementById("popup-chat-input");
    const content = input.value.trim();
    
    if (!content || !currentFriend) return;

    // Affichage optimiste (immédiat)
    const tempMsg = {
        sender: currentUserGlobal,
        content: content,
        timestamp: new Date().toISOString()
    };
    displayMessage(tempMsg);
    scrollToBottom();
    
    input.value = "";
    input.focus();

    // Sélection du client WebSocket actif
    let activeClient = (typeof stompClient !== 'undefined' && stompClient && stompClient.connected) ? stompClient : popupStompClient;

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

/* ================================================================
   INDICATEUR DE FRAPPE (UI)
   ================================================================ */

/**
 * Affiche le texte "En train d'écrire..." pendant 3.5 secondes max.
 */
function showPrivateTypingIndicator() {
    const indicator = document.getElementById("private-typing-indicator");
    if (!indicator) return;

    indicator.innerText = "En train d'écrire...";
    indicator.style.display = "block";
    
    if (privateDisplayTimeout) clearTimeout(privateDisplayTimeout);
    privateDisplayTimeout = setTimeout(() => { hidePrivateTypingIndicator(); }, 3500);
}

/**
 * Masque l'indicateur de frappe.
 */
function hidePrivateTypingIndicator() {
    const indicator = document.getElementById("private-typing-indicator");
    if (indicator) indicator.innerText = "";
}

/* ================================================================
   OUVERTURE CHAT & LOGIQUE AMITIÉ
   ================================================================ */

/**
 * Tente d'ouvrir un chat privé. Vérifie d'abord l'amitié côté serveur.
 * @param {string} friendName - Le pseudo de l'utilisateur cible.
 */
async function openChat(friendName) {
    if (friendName === currentUserGlobal) return;

    try {
        // Vérification AJAX de l'amitié
        const response = await fetch(`/api/friends/check?target=${friendName}`);
        const areFriends = await response.json();

        if (areFriends) {
            startChatLogic(friendName);
        } else {
            // Si pas amis, ouvre la modale de demande d'ajout
            openAddFriendModal(friendName);
        }
    } catch (e) {
        console.error("Erreur API Check Friend", e);
        alert("Impossible de vérifier l'amitié.");
    }
}
window.openChat = openChat; // Exposition globale pour appel depuis chat.js

/**
 * Initialise l'interface de chat une fois l'amitié validée.
 * Charge l'historique et gère la persistance (localStorage).
 * @param {string} friendName - Le pseudo de l'ami.
 */
function startChatLogic(friendName) {
    currentFriend = friendName;
    const nameLabel = document.getElementById("popup-friend-name");
    if(nameLabel) nameLabel.innerText = friendName;

    const win = document.getElementById("popup-window");
    if(win) win.style.display = "block";

    // Sauvegarde la session chat liée à l'utilisateur courant
    localStorage.setItem("openChatFriend_" + currentUserGlobal, friendName);
    
    hidePrivateTypingIndicator();
    loadMessages();
    
    // Affiche les messages reçus pendant que la fenêtre était fermée
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

/**
 * Ferme la fenêtre de chat et nettoie le localStorage.
 */
function closeChat() {
    const win = document.getElementById("popup-window");
    if(win) win.style.display = "none";
    currentFriend = null;
    localStorage.removeItem("openChatFriend_" + currentUserGlobal);
}

/* ================================================================
   MODAL AJOUT D'AMI
   ================================================================ */

/**
 * Ouvre la modale proposant d'ajouter un utilisateur en ami.
 * @param {string} username - Pseudo de l'utilisateur à ajouter.
 */
function openAddFriendModal(username) {
    targetUserForRequest = username;
    const modalTargetText = document.getElementById("modal-target-user");
    if(modalTargetText) modalTargetText.innerText = username;
    
    const feedback = document.getElementById("modal-feedback");
    if (feedback) {
        feedback.innerText = "";
        feedback.style.color = "inherit";
    }

    const modal = document.getElementById("add-friend-modal");
    if(modal) modal.style.display = "flex";
}

/**
 * Ferme la modale d'ajout d'ami.
 */
function closeAddFriendModal() {
    const modal = document.getElementById("add-friend-modal");
    if(modal) modal.style.display = "none";
    targetUserForRequest = null;
}

/**
 * Envoie la requête POST pour créer une demande d'ami.
 * Met à jour l'interface avec le retour du serveur.
 */
function confirmAddFriend() {
    if (!targetUserForRequest) return;

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
        if (feedbackZone) {
            feedbackZone.innerText = msg;
            if (msg.includes("succès") || msg.includes("sent")) {
                feedbackZone.style.color = "green";
                // Fermeture automatique après succès
                setTimeout(() => {
                    closeAddFriendModal();
                    feedbackZone.innerText = "";
                }, 1500);
            } else {
                feedbackZone.style.color = "red";
            }
        }
    })
    .catch(err => {
        if (feedbackZone) {
            feedbackZone.innerText = "Erreur technique.";
            feedbackZone.style.color = "red";
        }
    });
}

/* ================================================================
   CHARGEMENT HISTORIQUE ET RENDU DOM
   ================================================================ */

/**
 * Charge l'historique des messages privés depuis l'API.
 */
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

/**
 * Crée et insère une bulle de message dans le DOM.
 * @param {Object} msg - L'objet message contenant content, timestamp, sender, etc.
 */
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
    container.className = "popup-msg-container " + (isMe ? "sent" : "received");
    
    if (isMe) container.classList.add("message-sent");
    else container.classList.add("message-received");

    const timeDiv = document.createElement("div");
    timeDiv.className = "popup-msg-time"; 
    timeDiv.innerText = timeStr;

    const bubbleDiv = document.createElement("div");
    bubbleDiv.className = "popup-bubble"; 
    bubbleDiv.innerText = msg.content;

    container.appendChild(timeDiv);
    container.appendChild(bubbleDiv);
    
    chatBody.appendChild(container);
    scrollToBottom();
}

/**
 * Scrolle la fenêtre de chat vers le bas pour afficher le dernier message.
 */
function scrollToBottom() {
    const chatBody = document.getElementById("popup-chat-body");
    if(chatBody) chatBody.scrollTop = chatBody.scrollHeight;
}

/**
 * Gestionnaire d'événement pour la touche Entrée dans l'input.
 * @param {KeyboardEvent} e 
 */
function handleKeyPress(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        sendPrivateMessage();
    }
}

/* ================================================================
   NOTIFICATIONS SIDEBAR
   ================================================================ */

/**
 * Affiche une pastille "!" rouge sur l'utilisateur dans la liste d'amis.
 * @param {string} friendName - Pseudo de l'ami.
 */
function showNotification(friendName) {
    const userElement = document.getElementById("user-" + friendName);
    if (userElement && !userElement.querySelector('.notification-badge')) {
        const badge = document.createElement("span");
        badge.className = "notification-badge";
        badge.style.cssText = "background: #e74c3c; color: white; border-radius: 50%; width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.7em; margin-left: auto; font-weight: bold;";
        badge.innerText = "!";
        userElement.appendChild(badge);
    }
}

/**
 * Retire la pastille de notification.
 * @param {string} friendName - Pseudo de l'ami.
 */
function clearNotification(friendName) {
    const userElement = document.getElementById("user-" + friendName);
    if (userElement) {
        const badge = userElement.querySelector('.notification-badge');
        if (badge) badge.remove();
    }
}