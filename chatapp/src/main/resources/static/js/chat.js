let stompClient = null;

document.addEventListener("DOMContentLoaded", function() {
    
    // 1. Récupérer ceux qui sont DÉJÀ là via l'API REST
    fetch('/api/users')
        .then(response => response.json())
        .then(users => {
            users.forEach(user => addUserToSidebar(user));
        });

    // 2. Se connecter au WebSocket
    const socket = new SockJS('/chat-websocket');
    stompClient = Stomp.over(socket);

    stompClient.connect({}, () => {
        // S'abonner aux messages
        stompClient.subscribe('/topic/public', (messageOutput) => {
            const msg = JSON.parse(messageOutput.body);
            onMessageReceived(msg);
        });

        // Dire "Je suis là" (JOIN)
        stompClient.send("/app/chat.addUser", {}, JSON.stringify({}));
    });

    // Touche Entrée pour envoyer
    const messageInput = document.getElementById("message");
    messageInput.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            sendMessage();
        }
    });
});

function sendMessage() {
    const messageInput = document.getElementById("message");
    const content = messageInput.value.trim();

    if (content && stompClient) {
        const chatMessage = { content: content, type: 'CHAT' };
        stompClient.send("/app/sendMessage", {}, JSON.stringify(chatMessage));
        messageInput.value = '';
        messageInput.focus();
    }
}

function onMessageReceived(msg) {
    if (msg.type === 'JOIN') {
        addUserToSidebar(msg.from);
        showSystemMessage(msg.from + " a rejoint le chat.");
    } 
    else if (msg.type === 'LEAVE') {
        removeUserFromSidebar(msg.from);
        showSystemMessage(msg.from + " a quitté le chat.");
    } 
    else {
        showChatMessage(msg);
    }
}

// Affiche un message normal
function showChatMessage(msg) {
    const box = document.getElementById("chat-box");
    const div = document.createElement("div");
    div.innerHTML = `<b>${msg.from}</b> [${msg.time}]: ${msg.content}`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

// Affiche un message système (Gris)
function showSystemMessage(text) {
    const box = document.getElementById("chat-box");
    const div = document.createElement("div");
    div.style.color = "#888";
    div.style.fontStyle = "italic";
    div.style.fontSize = "0.9em";
    div.innerText = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

// Ajoute un nom dans la liste HTML
function addUserToSidebar(username) {
    const list = document.getElementById("users-list");
    // Évite les doublons
    if (!document.getElementById("user-" + username)) {
        const li = document.createElement("li");
        li.id = "user-" + username;
        li.innerText = username;
        list.appendChild(li);
    }
}

// Retire un nom de la liste HTML
function removeUserFromSidebar(username) {
    const li = document.getElementById("user-" + username);
    if (li) {
        li.remove();
    }
}