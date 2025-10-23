package com.example.chatapp.controller;

import com.example.chatapp.model.ChatMessage;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

@Controller
public class ChatController {

    @MessageMapping("/sendMessage")      // quand un message arrive de /app/sendMessage
    @SendTo("/topic/public")             // on le renvoie à tous les clients connectés
    public ChatMessage broadcast(ChatMessage message) {
        String time = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));
        message.setTime(time);
        return message;
    }
}
