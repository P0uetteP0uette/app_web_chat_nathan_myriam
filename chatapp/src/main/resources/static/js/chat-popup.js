/* ================================================================
   LOGIQUE CHAT PRIVÉ - CORRIGÉ (Messages en temps réel)
   ================================================================ */

let currentFriend = null;
let popupStompClient = null;
let pendingMessages = {}; // Stocke les messages non lus par conversation

document.addEventListener("DOMContentLoaded", function() {
    const savedFriend = localStorage.getItem("openChatFriend");
    if (savedFriend) openChat(savedFriend);

    // 1. DÉTECTION INTELLIGENTE DE LA CONNEXION
    if (document.getElementById("chat-box")) {
        // Mode ACCUEIL : On écoute le chef (chat.js)
        console.log("🔗 Popup : Mode Accueil (Écoute chat.js)");
        window.addEventListener('private-message-received', function(e) {
            onPopupMessageReceived(e.detail);
        });
    } else {
        // Mode AMIS : On se débrouille tout seul
        console.log("🔌 Popup : Mode Autonome (Connexion manuelle)");
        connectStandalone();
    }
});

// Connexion de secours (pour find-friends.html)
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

// 2. RÉCEPTION DU MESSAGE (Venant du serveur)
function onPopupMessageReceived(message) {
    console.log("📨 Message reçu:", message);
    
    // Déterminer qui est l'autre personne dans la conversation
    let conversationPartner = message.sender === currentUserGlobal 
        ? message.recipient 
        : message.sender;
    
    // Si la popup est ouverte avec cette personne
    if (currentFriend && currentFriend === conversationPartner) {
        // ✅ CAS 1: La popup est ouverte avec le bon contact
        
        // Si c'est MOI qui ai envoyé, on ignore (déjà affiché immédiatement)
        if (message.sender === currentUserGlobal) {
            console.log("✓ Mon message, déjà affiché");
            return;
        }
        
        // Si c'est l'autre qui parle, on affiche
        console.log("✓ Message de " + message.sender + ", affichage...");
        displayMessage(message);
        scrollToBottom();
        
    } else {
        // ✅ CAS 2: La popup est fermée ou ouverte sur un autre contact
        
        // Si c'est moi qui ai envoyé, on ignore complètement
        if (message.sender === currentUserGlobal) {
            return;
        }
        
        // Si c'est quelqu'un d'autre, on stocke pour plus tard
        console.log("💾 Message mis en attente de " + conversationPartner);
        if (!pendingMessages[conversationPartner]) {
            pendingMessages[conversationPartner] = [];
        }
        pendingMessages[conversationPartner].push(message);
        
        // Optionnel: Afficher une notification visuelle
        showNotification(conversationPartner);
    }
}

// 3. ENVOYER UN MESSAGE
function sendPrivateMessage() {
    const input = document.getElementById("popup-chat-input");
    const content = input.value.trim();
    
    if (!content || !currentFriend) return;

    // A. AFFICHAGE IMMÉDIAT (Pour que ça ne disparaisse pas !)
    const tempMsg = {
        sender: currentUserGlobal,
        content: content,
        timestamp: new Date().toISOString()
    };
    displayMessage(tempMsg);
    scrollToBottom();

    // B. ENVOI RÉEL (En arrière-plan)
    // On trouve le bon canal (chat.js ou autonome)
    let activeClient = null;
    if (typeof stompClient !== 'undefined' && stompClient && stompClient.connected) {
        activeClient = stompClient;
        console.log("✅ Utilisation de stompClient (chat.js)");
    } else if (popupStompClient && popupStompClient.connected) {
        activeClient = popupStompClient;
        console.log("✅ Utilisation de popupStompClient (autonome)");
    }

    if (activeClient) {
        const chatMessage = {
            sender: currentUserGlobal,
            recipient: currentFriend,
            content: content,
            type: 'CHAT'
        };
        activeClient.send("/app/chat.private", {}, JSON.stringify(chatMessage));
        
        input.value = "";
        input.focus();
    } else {
        console.error("❌ Pas de connexion WebSocket active!");
        alert("Erreur de connexion. Le message n'a pas pu être envoyé.");
    }
}

// 4. OUVERTURE / FERMETURE
function openChat(friendName) {
    currentFriend = friendName;
    document.getElementById("popup-friend-name").innerText = friendName;
    document.getElementById("popup-window").style.display = "block";
    localStorage.setItem("openChatFriend", friendName);
    
    // Charger l'historique
    loadMessages();
    
    // Afficher les messages en attente
    if (pendingMessages[friendName] && pendingMessages[friendName].length > 0) {
        console.log("📬 Affichage de " + pendingMessages[friendName].length + " messages en attente");
        setTimeout(() => {
            pendingMessages[friendName].forEach(msg => {
                displayMessage(msg);
            });
            scrollToBottom();
            delete pendingMessages[friendName];
        }, 300); // Petit délai pour que l'historique se charge d'abord
    }
    
    setTimeout(() => {
         const input = document.getElementById("popup-chat-input");
         if(input) input.focus();
    }, 100);
    
    // Retirer l'indicateur de notification
    clearNotification(friendName);
}

function closeChat() {
    document.getElementById("popup-window").style.display = "none";
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
        })
        .catch(err => {
            console.error("Erreur chargement historique:", err);
        });
}

// 5. FONCTION D'AFFICHAGE
function displayMessage(msg) {
    const chatBody = document.getElementById("popup-chat-body");
    if (!chatBody) return;

    let isMe = (msg.sender === currentUserGlobal);

    // Date
    let timeStr = "";
    try {
        if (msg.timestamp) timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        else if (msg.time) timeStr = msg.time;
    } catch(e) {}

    // HTML
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
    if (e.key === 'Enter') sendPrivateMessage();
}

// 6. SYSTÈME DE NOTIFICATIONS (Optionnel mais utile)
function showNotification(friendName) {
    // Trouver l'élément utilisateur dans la sidebar
    const userElement = document.getElementById("user-" + friendName);
    if (userElement && !userElement.querySelector('.notification-badge')) {
        const badge = document.createElement("span");
        badge.className = "notification-badge";
        badge.style.cssText = "background: #e74c3c; color: white; border-radius: 50%; width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.7em; margin-left: auto; font-weight: bold;";
        badge.innerText = "!";
        userElement.appendChild(badge);
    }
    
    // Badge dans la page find-friends si applicable
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
    // Retirer les badges de notification
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