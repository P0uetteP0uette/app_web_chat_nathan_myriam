/**
 * @file chat.js
 * @description Contrôleur principal pour l'interface du Chat Général.
 * Gère les connexions WebSocket (Stomp), la logique du chat public, les notifications globales,
 * la gestion du son et les mises à jour de statut des utilisateurs en temps réel.
 */

/* ================================================================
   VARIABLES GLOBALES & CONFIGURATION
   ================================================================ */

/** @type {Object|null} Client Stomp pour la communication WebSocket. */
let stompClient = null;

/** @type {Object.<string, string>} Stocke le statut des utilisateurs (ex: {'User1': 'ONLINE'}). */
let userStatuses = {};

/** @type {string|null} Garde en mémoire l'expéditeur du dernier message pour le regroupement visuel. */
let lastSender = null;

/** @type {number} Timestamp (en minutes) du dernier message pour la logique de regroupement. */
let lastTimeMinutes = -1;

// --- Variables pour l'indicateur de frappe ---
let isTyping = false;
let typingTimeout = null;
let typingDisplayTimeout = null;

// --- Variables pour les notifications & le son ---
let unreadCount = 0;
let originalTitle = document.title;

/** @type {boolean} État du son (activé/désactivé), persisté dans le localStorage. */
let isSoundOn = localStorage.getItem("chatSound") !== "false";

/* ================================================================
   GESTION DU SON
   ================================================================ */

/**
 * Active ou désactive le son global et sauvegarde la préférence.
 */
function toggleSound() {
    isSoundOn = !isSoundOn;
    localStorage.setItem("chatSound", isSoundOn);
    updateSoundIcon();
}

/**
 * Met à jour l'icône et le texte du bouton de son dans l'interface selon l'état actuel.
 */
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

/**
 * Joue le son de notification si l'option est activée.
 */
function playNotificationSound() {
    if (!isSoundOn) return;
    const audio = document.getElementById("notification-sound");
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {}); // Catch pour éviter les erreurs si le navigateur bloque l'autoplay
    }
}

/* ================================================================
   INITIALISATION & ÉCOUTEURS D'ÉVÉNEMENTS
   ================================================================ */

/**
 * Initialise l'application de chat au chargement complet du DOM.
 * Configure les WebSockets, les écouteurs d'événements et récupère les données initiales.
 */
document.addEventListener("DOMContentLoaded", function() {
    updateSoundIcon();

    // 1. Gestion du titre de l'onglet (Notifications)
    document.addEventListener("visibilitychange", function() {
        if (document.visibilityState === "visible") {
            unreadCount = 0;
            document.title = originalTitle;
        }
    });

    // 2. Gestion du bouton de défilement vers le bas
    const chatBox = document.getElementById("chat-box");
    const scrollBtn = document.getElementById("scroll-down-btn");

    if (chatBox) {
        chatBox.addEventListener("scroll", function() {
            // Affiche le bouton si l'utilisateur remonte de plus de 100px
            if (chatBox.scrollTop < (chatBox.scrollHeight - chatBox.clientHeight - 100)) {
                if(scrollBtn) scrollBtn.style.display = "block";
            } else {
                if(scrollBtn) scrollBtn.style.display = "none";
            }
        });
    }

    // 3. Récupération des utilisateurs connectés
    fetch('/api/users')
        .then(response => response.json())
        .then(usersMap => {
            for (const [username, status] of Object.entries(usersMap)) {
                userStatuses[username] = status;
                addUserToSidebar(username, status);
            }
        });

    // 4. Récupération de l'historique du chat public
    fetch('/api/history')
        .then(response => response.json())
        .then(messages => {
            messages.forEach(msg => showChatMessage(msg));
        });

    // 5. Initialisation de la connexion WebSocket
    const socket = new SockJS('/chat-websocket');
    stompClient = Stomp.over(socket);
    stompClient.debug = null; // Désactive les logs de débogage pour une console plus propre

    stompClient.connect({}, () => {
        // Abonnement au Chat Public
        stompClient.subscribe('/topic/public', (payload) => {
            onMessageReceived(JSON.parse(payload.body));
        });

        // Abonnement aux Messages Privés (Queue personnelle)
        stompClient.subscribe('/user/queue/private', (payload) => {
            const msg = JSON.parse(payload.body);
            // Déclenche un événement personnalisé pour que la popup (chat-popup.js) le gère
            const event = new CustomEvent('private-message-received', { detail: msg });
            window.dispatchEvent(event);
            
            const sender = msg.sender || msg.from;
            
            // Joue un son si le message ne vient pas de soi et n'est pas juste un signal de frappe
            if (isSoundOn && sender !== currentUserGlobal && msg.type !== 'TYPING') {
                playNotificationSound();
            }

            // Met à jour le titre de l'onglet pour les notifications en arrière-plan
            if (document.hidden && msg.type !== 'TYPING') {
                unreadCount++;
                document.title = `(${unreadCount}) Nouveaux messages`;
            }
        });

        // Abonnement aux Demandes d'amis (Mise à jour badge temps réel)
        stompClient.subscribe('/user/queue/friends', function (payload) {
            updateFriendRequestBadge();
        });

        // Notifie le serveur de la présence de l'utilisateur
        stompClient.send("/app/chat.addUser", {}, JSON.stringify({}));
    });

    // 6. Gestion de la zone de saisie & Emojis
    const msgInput = document.getElementById("message");
    
    if(msgInput) {
        // Envoi sur la touche Entrée
        msgInput.addEventListener("keydown", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                sendMessage();
                isTyping = false;
                clearTimeout(typingTimeout);
            }
        });

        // Logique de l'indicateur de frappe
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

        // Intégration du sélecteur d'émojis Picmo
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

            // Ferme le sélecteur si on clique à l'extérieur
            document.addEventListener('click', function(e) {
                if (!emojiBtn.contains(e.target) && !emojiContainer.contains(e.target)) {
                    emojiContainer.style.display = 'none';
                }
            });
        }
    }
});

/* ================================================================
   LOGIQUE D'ENVOI & RÉCEPTION
   ================================================================ */

/**
 * Envoie le message saisi dans l'input au serveur via WebSocket.
 */
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

/**
 * Envoie le changement de statut (En ligne, Occupé...) au serveur.
 */
function sendStatusChange() {
    const selector = document.getElementById("status-select");
    if(selector && stompClient) {
        const newStatus = selector.value;
        const msg = { content: newStatus, type: 'STATUS' };
        stompClient.send("/app/chat.changeStatus", {}, JSON.stringify(msg));
    }
}

/**
 * Traite les messages reçus du canal public WebSocket.
 * Gère l'affichage des messages, les changements de statut, et les événements système (Join/Leave).
 * @param {Object} msg - L'objet message reçu.
 */
function onMessageReceived(msg) {
    // Notification dans l'onglet uniquement pour les vrais messages de chat
    if (document.hidden && msg.type === 'CHAT') {
        unreadCount++;
        document.title = `(${unreadCount}) Nouveaux messages`;
    }

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

/* ================================================================
   FONCTIONS D'INTERFACE UTILISATEUR (UI)
   ================================================================ */

/**
 * Affiche l'indicateur "Untel est en train d'écrire..." temporairement.
 * @param {string} username - Pseudo de l'utilisateur qui écrit.
 */
function showTypingIndicator(username) {
    const indicator = document.getElementById("typing-indicator");
    if (!indicator) return;
    indicator.innerText = `${username} est en train d'écrire...`;
    if (typingDisplayTimeout) clearTimeout(typingDisplayTimeout);
    typingDisplayTimeout = setTimeout(() => {
        indicator.innerText = "";
    }, 3000);
}

/**
 * Convertit une chaîne de temps "HH:mm" en minutes totales pour la comparaison.
 * @param {string} timeStr - Heure au format "HH:mm".
 * @returns {number} Minutes totales depuis minuit.
 */
function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

/**
 * Formate le contenu du message : sécurisation HTML et mise en évidence des mentions.
 * @param {string} rawContent - Contenu brut du message.
 * @returns {string} HTML sécurisé avec mentions formatées.
 */
function formatMessageContent(rawContent) {
    let safeContent = escapeHtml(rawContent);
    // Transforme les @Pseudo en span stylisé
    safeContent = safeContent.replace(/@(\w+)/g, function(match, username) {
        if (username === currentUserGlobal) {
            return `<span class="mention mention-me">@${username}</span>`;
        } else {
            return `<span class="mention">@${username}</span>`;
        }
    });
    return safeContent;
}

/**
 * Crée et ajoute une bulle de message dans la zone de chat.
 * Gère le regroupement des messages consécutifs du même auteur.
 * @param {Object} msg - L'objet message à afficher.
 */
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
    // Regroupe si même auteur et moins de 5 minutes d'écart
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

    const bubble = div.querySelector(".chat-bubble");
    bubble.innerHTML = formatMessageContent(msg.content); 

    box.appendChild(div);
    lastSender = senderName;
    lastTimeMinutes = currentMinutes;
    box.scrollTop = box.scrollHeight;
}

/**
 * Fait défiler la zone de chat vers le bas pour afficher les derniers messages.
 */
function scrollToBottom() {
    const box = document.getElementById("chat-box");
    if(box) box.scrollTop = box.scrollHeight;
}

/**
 * Affiche un message système centré (ex: Connexion/Déconnexion).
 * @param {string} text - Le texte à afficher.
 */
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

/**
 * Retourne la couleur hexadécimale associée à un statut.
 * @param {string} status - Le statut (ONLINE, BUSY, AWAY).
 * @returns {string} Code couleur hex.
 */
function getStatusColor(status) {
    if (status === 'BUSY') return '#e74c3c';
    if (status === 'AWAY') return '#f39c12';
    return '#2ecc71';
}

/**
 * Ajoute un utilisateur à la barre latérale ou met à jour son statut s'il existe déjà.
 * @param {string} username - Pseudo de l'utilisateur.
 * @param {string} status - Statut de l'utilisateur.
 */
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

    // Clic utilisateur : Ouvre le chat ou la demande d'ami via chat-popup.js
    li.onclick = function() {
        if (typeof openChat === "function") {
            openChat(username);
        } else if (typeof window.openChat === "function") {
            window.openChat(username);
        }
    };

    if (username === currentUserGlobal) list.prepend(li);
    else list.appendChild(li);
}

/**
 * Retire un utilisateur de la barre latérale (lorsqu'il quitte).
 * @param {string} username - Pseudo de l'utilisateur.
 */
function removeUserFromSidebar(username) {
    const li = document.getElementById("user-" + username);
    if (li) li.remove();
}

/**
 * Met à jour la couleur du point de statut d'un utilisateur.
 * @param {string} username - Pseudo de l'utilisateur.
 * @param {string} newStatus - Nouveau statut.
 */
function updateUserStatus(username, newStatus) {
    const dot = document.getElementById("status-dot-" + username);
    if (dot) dot.style.backgroundColor = getStatusColor(newStatus);
    userStatuses[username] = newStatus;
}

/**
 * Échappe les caractères HTML spéciaux pour prévenir les failles XSS.
 * @param {string} text - Texte brut.
 * @returns {string} Texte sécurisé.
 */
function escapeHtml(text) {
    if (!text) return text;
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

/**
 * Met à jour le badge de notification (compteur rouge) sur le bouton "Trouver des amis".
 * Appelé lors de la réception d'une nouvelle demande d'ami.
 */
function updateFriendRequestBadge() {
    const btn = document.querySelector('a[href="/find-friends"]');
    if (!btn) return;

    let badge = btn.querySelector("span");
    if (badge) {
        let count = parseInt(badge.innerText);
        badge.innerText = count + 1;
    } else {
        badge = document.createElement("span");
        badge.innerText = "1";
        badge.style.cssText = `
            position: absolute; top: -8px; right: -8px;
            background-color: #e74c3c; color: white;
            border-radius: 50%; width: 22px; height: 22px;
            display: flex; align-items: center; justify-content: center;
            font-size: 0.8rem; font-weight: bold;
            border: 2px solid #2c3e50; box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;
        btn.appendChild(badge);
    }
}