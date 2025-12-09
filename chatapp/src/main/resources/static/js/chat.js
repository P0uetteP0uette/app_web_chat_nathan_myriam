let stompClient = null;
let username = null;

// Ajout : Écouteur d'événement pour la touche "Entrée" sur le champ de message
document.addEventListener("DOMContentLoaded", function() {
    const messageInput = document.getElementById("message");
    
    // Quand une touche est enfoncée dans la zone de texte
    messageInput.addEventListener("keypress", function(event) {
        // Si la touche est "Entrée" (Enter)
        if (event.key === "Enter") {
            event.preventDefault(); // Empêche le saut de ligne par défaut
            sendMessage(); // Envoie le message
        }
    });
});

function connect() {
    username = document.getElementById("username").value.trim();
    if (!username) {
        document.getElementById("error").innerText = "Veuillez entrer un pseudo.";
        return;
    }

    document.getElementById("login-page").style.display = "none";
    document.getElementById("chat-page").style.display = "block";

    const socket = new SockJS('/chat-websocket');
    stompClient = Stomp.over(socket);

    stompClient.connect({}, () => {
        stompClient.subscribe('/topic/public', (messageOutput) => {
            const msg = JSON.parse(messageOutput.body);
            showMessage(msg);
        });
    });
}

function sendMessage() {
    const messageInput = document.getElementById("message"); // On récupère l'élément
    const content = messageInput.value.trim();

    if (content && stompClient) {
        const chatMessage = { from: username, content: content };
        stompClient.send("/app/sendMessage", {}, JSON.stringify(chatMessage));
        
        messageInput.value = ''; // Vide la zone de texte
        messageInput.focus();    // <-- C'est ici qu'on remet le focus (le curseur)
    }
}

function showMessage(msg) {
    const box = document.getElementById("chat-box");
    const div = document.createElement("div");
    div.innerHTML = `<b>${msg.from}</b> [${msg.time}]: ${msg.content}`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

function disconnect() {
    if (stompClient) stompClient.disconnect();
    document.getElementById("chat-page").style.display = "none";
    document.getElementById("login-page").style.display = "block";
}