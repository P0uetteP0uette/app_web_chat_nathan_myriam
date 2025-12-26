package com.example.chatapp.controller;

import com.example.chatapp.model.ChatMessage;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.security.Principal; // Très important !
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

@Controller
public class ChatController {

    @MessageMapping("/sendMessage")
    @SendTo("/topic/public")
    public ChatMessage broadcast(ChatMessage message, Principal principal) {
        // 1. Récupérer le pseudo de l'utilisateur connecté via la sécurité
        String username = principal.getName();
        
        // 2. L'injecter dans le message (remplace le null)
        message.setFrom(username);
        
        // 3. Ajouter l'heure actuelle
        String time = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));
        message.setTime(time);
        
        return message;
    }
}