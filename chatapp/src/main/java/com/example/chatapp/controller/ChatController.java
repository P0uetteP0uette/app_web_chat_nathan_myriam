package com.example.chatapp.controller;

import com.example.chatapp.model.ChatMessage;
import com.example.chatapp.model.Message; // Ton entité BDD
import com.example.chatapp.model.MessageType;
import com.example.chatapp.repository.MessageRepository; // Ton repo
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.security.Principal;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Collections;

@Controller
public class ChatController {

    private static final Set<String> onlineUsers = ConcurrentHashMap.newKeySet();

    @Autowired
    private MessageRepository messageRepository; // <--- Injection du repo

    // 1. Envoi de message + SAUVEGARDE
    @MessageMapping("/sendMessage")
    @SendTo("/topic/public")
    public ChatMessage broadcast(ChatMessage chatMessage, Principal principal) {
        String username = principal.getName();
        String time = getCurrentTime();

        // A. On prépare le message pour le WebSocket (Temps réel)
        chatMessage.setType(MessageType.CHAT);
        chatMessage.setFrom(username);
        chatMessage.setTime(time);

        // B. On le sauvegarde en Base de Données (Historique)
        Message dbMessage = new Message(username, chatMessage.getContent(), time);
        messageRepository.save(dbMessage); // <--- Sauvegarde ici !

        return chatMessage;
    }

    // 2. Nouvel utilisateur (Pas de changement ici, sauf qu'on ne sauvegarde pas les JOIN)
    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public ChatMessage addUser(ChatMessage message, SimpMessageHeaderAccessor headerAccessor, Principal principal) {
        String username = principal.getName();
        onlineUsers.add(username);
        
        message.setType(MessageType.JOIN);
        message.setFrom(username);
        message.setTime(getCurrentTime());
        
        return message;
    }

    // 3. API pour récupérer les utilisateurs connectés
    @GetMapping("/api/users")
    @ResponseBody
    public Set<String> getOnlineUsers() {
        return onlineUsers;
    }

    // 4. NOUVELLE API : Récupérer l'historique des messages
    @GetMapping("/api/history")
    @ResponseBody
    public List<Message> getChatHistory() {
        // 1. Récupérer les 50 derniers (du plus récent au plus vieux)
        List<Message> messages = messageRepository.findTop50ByOrderByIdDesc();
        
        // 2. Inverser la liste pour les avoir dans l'ordre chronologique (Vieux -> Récent)
        // Sinon le dernier message sera tout en haut du chat !
        Collections.reverse(messages);
        
        return messages;
    }

    private String getCurrentTime() {
        return LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));
    }

    public static void removeUser(String username) {
        onlineUsers.remove(username);
    }
}