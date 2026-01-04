/* ================================================================
   LOGIQUE CHAT PRIVÉ - MESSAGES EN TEMPS RÉEL
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
        console.log("✅ Popup WebSocket connecté (autonome)");
        popupStompClient.subscribe('/user/queue/private', function (payload) {
            onPopupMessageReceived(JSON.parse(payload.body));
        });
    });
}

// 2. RÉCEPTION DU MESSAGE EN TEMPS RÉEL
function onPopupMessageReceived(message) {
    console.log("📨 Message privé reçu:", message);
    
    // Déterminer qui est l'interlocuteur dans cette conversation
    let conversationPartner;
    if (message.sender === currentUserGlobal) {
        // C'est moi qui ai envoyé, l'autre c'est le destinataire
        conversationPartner = message.recipient;
    } else {
        // C'est l'autre qui a envoyé
        conversationPartner = message.sender;
    }
    
    console.log("👤 Conversation avec:", conversationPartner, "| Popup ouverte avec:", currentFriend);
    
    // CAS 1: La popup est ouverte avec la bonne personne
    if (currentFriend && currentFriend === conversationPartner) {
        console.log("✅ Popup ouverte avec le bon contact");
        
        // Si c'est MOI qui ai envoyé ce message
        if (message.sender === currentUserGlobal) {
            console.log("⏭️ Mon propre message, déjà affiché en optimiste");
            return; // On l'ignore car déjà affiché de manière optimiste
        }
        
        // Si c'est L'AUTRE qui a envoyé
        console.log("💬 Message de l'autre personne, affichage immédiat...");
        displayMessage(message);
        scrollToBottom();
        return;
    }
    
    // CAS 2: La popup est fermée OU ouverte avec quelqu'un d'autre
    console.log("💾 Popup fermée ou avec quelqu'un d'autre");
    
    // Si c'est moi qui ai envoyé, on ignore (message déjà géré)
    if (message.sender === currentUserGlobal) {
        console.log("⏭️ Mon propre message vers quelqu'un d'autre, ignoré");
        return;
    }
    
    // Si c'est quelqu'un d'autre, on stocke pour plus tard
    console.log("📬 Message stocké pour " + conversationPartner);
    if (!pendingMessages[conversationPartner]) {
        pendingMessages[conversationPartner] = [];
    }
    pendingMessages[conversationPartner].push(message);
    
    // Afficher une notification visuelle
    showNotification(conversationPartner);
}

// 3. ENVOYER UN MESSAGE
function sendPrivateMessage() {
    const input = document.getElementById("popup-chat-input");
    const content = input.value.trim();
    
    if (!content || !currentFriend) return;

    console.log("📤 Envoi de message à:", currentFriend);

    // A. AFFICHAGE OPTIMISTE IMMÉDIAT (pour ne pas attendre le serveur)
    const tempMsg = {
        sender: currentUserGlobal,
        content: content,
        timestamp: new Date().toISOString()
    };
    displayMessage(tempMsg);
    scrollToBottom();
    input.value = "";
    input.focus();

    // B. ENVOI RÉEL AU SERVEUR (en arrière-plan)
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
        console.log("✅ Message envoyé au serveur");
    } else {
        console.error("❌ Pas de connexion WebSocket active!");
        alert("Erreur de connexion. Le message est affiché mais pourrait ne pas être envoyé.");
    }
}

// 4. OUVERTURE / FERMETURE DE LA POPUP
function openChat(friendName) {
    console.log("🔓 Ouverture de la popup avec:", friendName);
    currentFriend = friendName;
    document.getElementById("popup-friend-name").innerText = friendName;
    document.getElementById("popup-window").style.display = "block";
    localStorage.setItem("openChatFriend", friendName);
    
    // Charger l'historique depuis la base de données
    loadMessages();
    
    // Afficher les messages en attente (reçus pendant que la popup était fermée)
    if (pendingMessages[friendName] && pendingMessages[friendName].length > 0) {
        console.log("📬 Affichage de " + pendingMessages[friendName].length + " messages en attente");
        setTimeout(() => {
            pendingMessages[friendName].forEach(msg => {
                displayMessage(msg);
            });
            scrollToBottom();
            delete pendingMessages[friendName];
        }, 500); // Petit délai pour que l'historique se charge d'abord
    }
    
    // Focus sur l'input
    setTimeout(() => {
         const input = document.getElementById("popup-chat-input");
         if(input) input.focus();
    }, 100);
    
    // Retirer les notifications
    clearNotification(friendName);
}

function closeChat() {
    console.log("🔒 Fermeture de la popup");
    document.getElementById("popup-window").style.display = "none";
    currentFriend = null;
    localStorage.removeItem("openChatFriend");
}

// 5. CHARGER L'HISTORIQUE DEPUIS LA BDD
function loadMessages() {
    if (!currentFriend) return;
    console.log("📚 Chargement de l'historique avec:", currentFriend);
    
    const chatBody = document.getElementById("popup-chat-body");
    fetch('/api/chat/history/' + currentFriend)
        .then(res => res.json())
        .then(messages => {
            console.log("✅ Historique chargé:", messages.length, "messages");
            if(chatBody) {
                chatBody.innerHTML = "";
                messages.forEach(msg => displayMessage(msg));
                scrollToBottom();
            }
        })
        .catch(err => {
            console.error("❌ Erreur chargement historique:", err);
        });
}

// 6. AFFICHER UN MESSAGE DANS LA POPUP
function displayMessage(msg) {
    const chatBody = document.getElementById("popup-chat-body");
    if (!chatBody) return;

    let isMe = (msg.sender === currentUserGlobal);

    // Formater l'heure
    let timeStr = "";
    try {
        if (msg.timestamp) {
            timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (msg.time) {
            timeStr = msg.time;
        }
    } catch(e) {
        console.error("Erreur formatage heure:", e);
    }

    // Créer le conteneur du message
    const container = document.createElement("div");
    container.className = "msg-container " + (isMe ? "sent" : "received");
    if (isMe) container.classList.add("message-sent");
    else container.classList.add("message-received");

    // Heure
    const timeDiv = document.createElement("div");
    timeDiv.className = "msg-time";
    timeDiv.innerText = timeStr;

    // Bulle de message
    const bubbleDiv = document.createElement("div");
    bubbleDiv.className = "message-bubble";
    bubbleDiv.innerText = msg.content;

    container.appendChild(timeDiv);
    container.appendChild(bubbleDiv);
    chatBody.appendChild(container);
}

// 7. SCROLL AUTOMATIQUE VERS LE BAS
function scrollToBottom() {
    const chatBody = document.getElementById("popup-chat-body");
    if(chatBody) {
        chatBody.scrollTop = chatBody.scrollHeight;
    }
}

// 8. GESTION DE LA TOUCHE ENTRÉE
function handleKeyPress(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        sendPrivateMessage();
    }
}

// 9. SYSTÈME DE NOTIFICATIONS
function showNotification(friendName) {
    console.log("🔔 Affichage notification pour:", friendName);
    
    // Notification dans la sidebar (page d'accueil)
    const userElement = document.getElementById("user-" + friendName);
    if (userElement && !userElement.querySelector('.notification-badge')) {
        const badge = document.createElement("span");
        badge.className = "notification-badge";
        badge.style.cssText = "background: #e74c3c; color: white; border-radius: 50%; width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.7em; margin-left: auto; font-weight: bold;";
        badge.innerText = "!";
        userElement.appendChild(badge);
    }
    
    // Notification dans la page find-friends
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
    console.log("🔕 Suppression notification pour:", friendName);
    
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