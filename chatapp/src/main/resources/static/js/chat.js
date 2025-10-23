let stompClient = null;
let username = null;

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
    const content = document.getElementById("message").value.trim();
    if (content && stompClient) {
        const chatMessage = { from: username, content: content };
        stompClient.send("/app/sendMessage", {}, JSON.stringify(chatMessage));
        document.getElementById("message").value = '';
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
