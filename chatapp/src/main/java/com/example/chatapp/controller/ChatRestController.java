package com.example.chatapp.controller;

import com.example.chatapp.model.Message;
import com.example.chatapp.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController // <--- Important : Répond en JSON, pas en HTML
@RequestMapping("/api/chat")
public class ChatRestController {

    @Autowired
    private MessageRepository messageRepository;

    // 1. Charger l'historique avec un ami
    @GetMapping("/history/{friendUsername}")
    public List<Message> getChatHistory(@PathVariable String friendUsername, Principal principal) {
        String myUsername = principal.getName();
        
        // On cherche la conversation dans les deux sens (Moi->Lui ou Lui->Moi)
        return messageRepository.findBySenderAndRecipientOrSenderAndRecipientOrderByTimestampAsc(
                myUsername, friendUsername, friendUsername, myUsername
        );
    }

    // 2. Envoyer un message privé
    @PostMapping("/send")
    public Message sendMessage(@RequestParam String recipient, @RequestParam String content, Principal principal) {
        String myUsername = principal.getName();
        
        // On crée le message (la date est mise auto dans le constructeur de Message)
        Message msg = new Message(myUsername, recipient, content);
        
        return messageRepository.save(msg);
    }
}