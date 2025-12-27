let stompClient = null;
let selectedUser = null; // Si null = Chat Public, sinon = Chat Privé

document.addEventListener("DOMContentLoaded", function() {
    
    // 1. Initialisation (Users + History)
    fetch('/api/users').then(res => res.json()).then(users => users.forEach(addUserToSidebar));
    fetch('/api/history').then(res => res.json()).then(msgs => {
        msgs.forEach(msg => {
            showChatMessage({from: msg.sender, content: msg.content, time: msg.time});
        });
    });

    // 2. Connexion
    const socket = new SockJS('/chat-websocket');
    stompClient = Stomp.over(socket);

    stompClient.connect({}, () => {
        // A. Abonnement au Public
        stompClient.subscribe('/topic/public', (payload) => {
            onMessageReceived(JSON.parse(payload.body));
        });

        // B. Abonnement au Privé (Ma boite aux lettres perso)
        stompClient.subscribe('/user/queue/private', (payload) => {
            onPrivateMessageReceived(JSON.parse(payload.body));
        });

        stompClient.send("/app/chat.addUser", {}, JSON.stringify({}));
    });

    // Gestion Entrée
    document.getElementById("message").addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); sendMessage(); }
    });
});

function sendMessage() {
    const input = document.getElementById("message");
    const content = input.value.trim();

    if (content && stompClient) {
        const chatMessage = { content: content, type: 'CHAT' };

        if (selectedUser) {
            // --- ENVOI PRIVÉ ---
            chatMessage.recipient = selectedUser;
            stompClient.send("/app/chat.private", {}, JSON.stringify(chatMessage));
        } else {
            // --- ENVOI PUBLIC ---
            stompClient.send("/app/sendMessage", {}, JSON.stringify(chatMessage));
        }
        input.value = '';
        input.focus();
    }
}

// Réception message PUBLIC
function onMessageReceived(msg) {
    if (msg.type === 'JOIN') {
        addUserToSidebar(msg.from);
        showSystemMessage(msg.from + " a rejoint.");
    } else if (msg.type === 'LEAVE') {
        removeUserFromSidebar(msg.from);
        showSystemMessage(msg.from + " a quitté.");
    } else {
        showChatMessage(msg);
    }
}

// Réception message PRIVÉ
function onPrivateMessageReceived(msg) {
    // On l'affiche avec un style différent
    showChatMessage(msg, true);
}

function showChatMessage(msg, isPrivate = false) {
    const box = document.getElementById("chat-box");
    const div = document.createElement("div");

    // Style spécial pour le privé
    if (isPrivate) {
        div.style.backgroundColor = "#ffefc1"; // Fond jaune clair pour distinguer
        div.style.border = "1px solid #e1c563";
        div.innerHTML = `🔒 <b>[Privé] ${msg.from}</b> [${msg.time}]: ${msg.content}`;
    } else {
        div.innerHTML = `<b>${msg.from}</b> [${msg.time}]: ${msg.content}`;
    }
    
    div.style.padding = "5px";
    div.style.marginBottom = "5px";
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

function showSystemMessage(text) {
    const box = document.getElementById("chat-box");
    const div = document.createElement("div");
    div.style.color = "#888"; div.style.fontStyle = "italic"; div.innerText = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

// --- GESTION DE LA SIDEBAR ---

function addUserToSidebar(username) {
    const list = document.getElementById("users-list");
    if (!document.getElementById("user-" + username)) {
        const li = document.createElement("li");
        li.id = "user-" + username;
        li.innerText = username;
        li.style.cursor = "pointer"; // Indique qu'on peut cliquer
        
        // CLIC SUR UN UTILISATEUR
        li.onclick = function() {
            // Si on clique sur le même, on désélectionne (retour au public)
            if (selectedUser === username) {
                selectedUser = null;
                li.style.fontWeight = "normal";
                li.style.color = "white";
                document.getElementById("chat-header").innerText = "Chat Général";
            } else {
                // Sinon on sélectionne
                // Reset visuel des autres
                document.querySelectorAll("#users-list li").forEach(el => {
                    el.style.fontWeight = "normal";
                    el.style.color = "white";
                });
                
                selectedUser = username;
                li.style.fontWeight = "bold";
                li.style.color = "#f1c40f"; // Jaune pour dire "sélectionné"
                document.getElementById("chat-header").innerText = "🔒 Privé avec " + username;
            }
        };
        
        list.appendChild(li);
    }
}

function removeUserFromSidebar(username) {
    const li = document.getElementById("user-" + username);
    if (li) li.remove();
    // Si la personne à qui on parlait part, on repasse en public
    if (selectedUser === username) {
        selectedUser = null;
        document.getElementById("chat-header").innerText = "Chat Général";
    }
}