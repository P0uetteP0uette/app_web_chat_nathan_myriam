package com.example.chatapp.controller;

import com.example.chatapp.model.ChatMessage;
import com.example.chatapp.model.Message;
import com.example.chatapp.model.MessageType;
import com.example.chatapp.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.security.Principal;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Controller
public class ChatController {

    // Stocke : "Pseudo" -> "Statut" (ex: Toto -> ONLINE)
    private static final Map<String, String> userStatuses = new ConcurrentHashMap<>();

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private SimpMessagingTemplate simpMessagingTemplate;

    // --- 1. CHAT PUBLIC (Sauvegardé en BDD) ---
    @MessageMapping("/sendMessage")
    @SendTo("/topic/public")
    public ChatMessage broadcast(ChatMessage chatMessage, Principal principal) {
        String username = principal.getName();
        String time = getCurrentTime();

        // Préparation du message
        chatMessage.setType(MessageType.CHAT);
        chatMessage.setFrom(username);
        chatMessage.setTime(time);
        chatMessage.setRecipient("All");

        // Sauvegarde dans la BDD (Table 'messages')
        Message dbMessage = new Message(username, chatMessage.getContent(), time);
        messageRepository.save(dbMessage);

        return chatMessage;
    }

    // --- 2. CHAT PRIVÉ (Routage direct + Statut Occupé) ---
// --- 2. CHAT PRIVÉ (Nettoyé) ---
    @MessageMapping("/chat.private")
    public void sendPrivateMessage(@Payload ChatMessage message, Principal principal) {
        String sender = principal.getName();
        String recipient = message.getRecipient();
        String time = getCurrentTime();

        // On a SUPPRIMÉ toute la partie "if recipientStatus == BUSY..."

        message.setFrom(sender);
        message.setTime(time);
        message.setType(MessageType.CHAT);

        // Envoi au destinataire
        simpMessagingTemplate.convertAndSendToUser(recipient, "/queue/private", message);

        // Envoi à l'expéditeur
        simpMessagingTemplate.convertAndSendToUser(sender, "/queue/private", message);
    }

    // --- 3. JOIN (Connexion) ---
    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public ChatMessage addUser(ChatMessage message, SimpMessageHeaderAccessor headerAccessor, Principal principal) {
        String username = principal.getName();
        
        // Par défaut, le nouveau est ONLINE
        userStatuses.put(username, "ONLINE");
        
        message.setType(MessageType.JOIN);
        message.setFrom(username);
        message.setContent("ONLINE"); // On transporte le statut
        message.setTime(getCurrentTime());
        
        return message;
    }

    // --- 4. CHANGEMENT DE STATUT ---
    @MessageMapping("/chat.changeStatus")
    @SendTo("/topic/public")
    public ChatMessage changeStatus(ChatMessage message, Principal principal) {
        String username = principal.getName();
        String newStatus = message.getContent(); // "ONLINE", "BUSY", "AWAY"
        
        userStatuses.put(username, newStatus);
        
        message.setType(MessageType.STATUS);
        message.setFrom(username);
        // Le content est déjà le nouveau statut
        return message;
    }

    // --- API : Récupérer les utilisateurs et leurs statuts ---
    @GetMapping("/api/users")
    @ResponseBody
    public Map<String, String> getOnlineUsers() {
        return userStatuses;
    }

    // --- API : Récupérer l'historique (50 derniers) ---
    @GetMapping("/api/history")
    @ResponseBody
    public List<Message> getChatHistory() {
        List<Message> messages = messageRepository.findTop50ByOrderByIdDesc();
        Collections.reverse(messages); // Remet dans l'ordre chronologique
        return messages;
    }

    // Utilitaires
    private String getCurrentTime() {
        return LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));
    }

    public static void removeUser(String username) {
        userStatuses.remove(username);
    }
}