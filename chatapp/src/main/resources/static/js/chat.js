let stompClient = null;

// Dès que la page est chargée, on se connecte automatiquement
document.addEventListener("DOMContentLoaded", function() {
    
    // 1. Connexion automatique au WebSocket
    const socket = new SockJS('/chat-websocket');
    stompClient = Stomp.over(socket);

    stompClient.connect({}, () => {
        // On s'abonne au canal public pour recevoir les messages
        stompClient.subscribe('/topic/public', (messageOutput) => {
            const msg = JSON.parse(messageOutput.body);
            showMessage(msg);
        });
    });

    // 2. Gestion de la touche "Entrée" pour envoyer
    const messageInput = document.getElementById("message");
    messageInput.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            event.preventDefault(); // Empêche le saut de ligne
            sendMessage();
        }
    });
});

function sendMessage() {
    const messageInput = document.getElementById("message");
    const content = messageInput.value.trim();

    // On vérifie qu'il y a du contenu et que la connexion est active
    if (content && stompClient) {
        // Note : On n'envoie plus le "username" ici. 
        // C'est le serveur Java qui va deviner qui tu es grâce à ta session (Principal).
        const chatMessage = { content: content };
        
        stompClient.send("/app/sendMessage", {}, JSON.stringify(chatMessage));
        
        messageInput.value = ''; // Vide la zone de texte
        messageInput.focus();    // Remet le curseur
    }
}

function showMessage(msg) {
    const box = document.getElementById("chat-box");
    const div = document.createElement("div");
    
    // On affiche le message avec le pseudo reçu du serveur
    div.innerHTML = `<b>${msg.from}</b> [${msg.time}]: ${msg.content}`;
    
    box.appendChild(div);
    box.scrollTop = box.scrollHeight; // Scroll automatique vers le bas
}