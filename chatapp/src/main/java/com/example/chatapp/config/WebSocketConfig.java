package com.example.chatapp.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Configuration principale pour la gestion des WebSockets et du protocole STOMP.
 * Active le courtier de messages (Broker) pour permettre la communication temps réel.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    /**
     * Configure le courtier de messages (Message Broker) pour le routage.
     * Définit les destinations publiques (/topic), privées (/queue) et les préfixes d'application.
     *
     * @param config Le registre de configuration du broker.
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Active le broker en mémoire pour le Public (/topic) et le Privé (/queue)
        config.enableSimpleBroker("/topic", "/queue");
        
        // Préfixe pour les messages envoyés par le client vers le serveur (@MessageMapping)
        config.setApplicationDestinationPrefixes("/app");

        // Préfixe pour gérer les messages privés dirigés vers un utilisateur spécifique
        config.setUserDestinationPrefix("/user");
    }

    /**
     * Enregistre les points de terminaison (endpoints) STOMP.
     * Définit l'URL de connexion initiale pour les clients WebSocket.
     *
     * @param registry Le registre des points de terminaison.
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Ajoute l'endpoint de connexion et active le support SockJS (fallback)
        registry.addEndpoint("/chat-websocket").withSockJS();
    }
}