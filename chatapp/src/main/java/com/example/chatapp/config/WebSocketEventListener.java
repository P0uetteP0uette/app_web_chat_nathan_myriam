package com.example.chatapp.config;

import com.example.chatapp.controller.ChatController;
import com.example.chatapp.model.ChatMessage;
import com.example.chatapp.model.MessageType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

/**
 * Écouteur d'événements pour les connexions WebSocket.
 * Cette classe permet de détecter quand un utilisateur se déconnecte (fermeture d'onglet, perte de réseau)
 * afin de mettre à jour l'état de l'application.
 */
@Component
public class WebSocketEventListener {

    @Autowired
    private SimpMessageSendingOperations messagingTemplate;

    /**
     * Gère l'événement de déconnexion d'une session WebSocket.
     * Lorsqu'un utilisateur quitte, cette méthode le retire de la liste des utilisateurs actifs
     * et diffuse un message public de type "LEAVE" pour avertir les autres clients.
     *
     * @param event L'événement de déconnexion contenant les informations de la session utilisateur.
     */
    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {

        if (event.getUser() != null) {
            String username = event.getUser().getName();
            
            // 1. On le supprime de la liste du Controller
            ChatController.removeUser(username);
            
            // 2. On envoie un message "LEAVE" à tout le monde
            ChatMessage chatMessage = new ChatMessage();
            chatMessage.setType(MessageType.LEAVE);
            chatMessage.setFrom(username);

            messagingTemplate.convertAndSend("/topic/public", chatMessage);
        }
    }
}