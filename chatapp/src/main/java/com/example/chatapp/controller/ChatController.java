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
import org.springframework.messaging.simp.SimpMessagingTemplate; // <--- IMPORTANT
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.security.Principal;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Controller
public class ChatController {

    private static final Set<String> onlineUsers = ConcurrentHashMap.newKeySet();

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private SimpMessagingTemplate simpMessagingTemplate; // <--- L'outil pour les MP

    // --- CHAT PUBLIC (Inchangé) ---
    @MessageMapping("/sendMessage")
    @SendTo("/topic/public")
    public ChatMessage broadcast(ChatMessage chatMessage, Principal principal) {
        String username = principal.getName();
        String time = getCurrentTime();

        chatMessage.setType(MessageType.CHAT);
        chatMessage.setFrom(username);
        chatMessage.setTime(time);
        chatMessage.setRecipient("All"); // Pour dire que c'est public

        // Sauvegarde BDD
        Message dbMessage = new Message(username, chatMessage.getContent(), time);
        messageRepository.save(dbMessage);

        return chatMessage;
    }

    // --- NOUVEAU : CHAT PRIVÉ ---
    @MessageMapping("/chat.private")
    public void sendPrivateMessage(@Payload ChatMessage message, Principal principal) {
        String sender = principal.getName();
        String recipient = message.getRecipient();
        String time = getCurrentTime();

        message.setFrom(sender);
        message.setTime(time);
        message.setType(MessageType.CHAT);

        // 1. Envoyer au Destinataire
        // Spring va transformer "/queue/private" en "/user/{destinataire}/queue/private"
        simpMessagingTemplate.convertAndSendToUser(recipient, "/queue/private", message);

        // 2. Envoyer aussi à l'Expéditeur (pour qu'il voie son propre message s'afficher)
        simpMessagingTemplate.convertAndSendToUser(sender, "/queue/private", message);
        
        // (Optionnel : On pourrait aussi sauvegarder en BDD ici avec un flag "private")
    }

    // --- LE RESTE (Users, History, Join) ---
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

    @GetMapping("/api/users")
    @ResponseBody
    public Set<String> getOnlineUsers() { return onlineUsers; }

    @GetMapping("/api/history")
    @ResponseBody
    public List<Message> getChatHistory() {
        List<Message> messages = messageRepository.findTop50ByOrderByIdDesc();
        Collections.reverse(messages);
        return messages;
    }

    private String getCurrentTime() {
        return LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));
    }

    public static void removeUser(String username) { onlineUsers.remove(username); }
}