package com.example.chatapp.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // 1. Activer le Broker pour le Public (/topic) ET le Privé (/queue)
        config.enableSimpleBroker("/topic", "/queue");
        
        // 2. Préfixe pour les messages envoyés par le client (vers le serveur)
        config.setApplicationDestinationPrefixes("/app");

        // 3. IMPORTANT : C'est cette ligne qui manquait !
        // Elle permet de gérer les abonnements privés type "/user/queue/private"
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/chat-websocket").withSockJS();
    }
}