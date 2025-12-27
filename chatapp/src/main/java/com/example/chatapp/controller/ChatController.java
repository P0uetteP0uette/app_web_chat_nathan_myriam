package com.example.chatapp.controller;

import com.example.chatapp.model.ChatMessage;
import com.example.chatapp.model.MessageType; // Import de ton Enum
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.security.Principal;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Controller
public class ChatController {

    // La fameuse liste des utilisateurs en ligne (Set évite les doublons)
    private static final Set<String> onlineUsers = ConcurrentHashMap.newKeySet();

    // 1. Quand on envoie un message normal
    @MessageMapping("/sendMessage")
    @SendTo("/topic/public")
    public ChatMessage broadcast(ChatMessage message, Principal principal) {
        message.setType(MessageType.CHAT);
        message.setFrom(principal.getName());
        message.setTime(getCurrentTime());
        return message;
    }

    // 2. Quand quelqu'un arrive (JOIN)
    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public ChatMessage addUser(ChatMessage message, SimpMessageHeaderAccessor headerAccessor, Principal principal) {
        String username = principal.getName();
        
        // On l'ajoute à la liste
        onlineUsers.add(username);
        
        // On prépare le message pour prévenir les autres
        message.setType(MessageType.JOIN);
        message.setFrom(username);
        message.setTime(getCurrentTime());
        
        return message;
    }

    // 3. API pour que le JavaScript récupère la liste complète au chargement
    @GetMapping("/api/users")
    @ResponseBody
    public Set<String> getOnlineUsers() {
        return onlineUsers;
    }

    // Petite méthode pour avoir l'heure
    private String getCurrentTime() {
        return LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));
    }

    // Méthode statique pour retirer quelqu'un (utilisée par le Listener juste après)
    public static void removeUser(String username) {
        onlineUsers.remove(username);
    }
}