package com.example.chatapp.controller;

import com.example.chatapp.model.ChatMessage;
import com.example.chatapp.model.Message;
import com.example.chatapp.model.MessageType;
import com.example.chatapp.repository.MessageRepository;
import com.example.chatapp.service.FriendshipService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.util.HtmlUtils;

import java.security.Principal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Contrôleur principal de l'application de chat.
 *
 * Il gère à la fois les requêtes HTTP (pour les pages et l'API REST)
 * et les événements WebSocket (STOMP) pour la communication en temps réel.
 */
@Controller
public class ChatController {

    /**
     * Stockage en mémoire des statuts des utilisateurs connectés (ONLINE, BUSY, AWAY).
     * Utilise une ConcurrentHashMap pour gérer les accès simultanés (Thread-safe).
     */
    private static final Map<String, String> userStatuses = new ConcurrentHashMap<>();

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private SimpMessagingTemplate simpMessagingTemplate;

    @Autowired
    private FriendshipService friendshipService;

    // --- PAGE D'ACCUEIL ---

    /**
     * Charge la page principale de l'application.
     *
     * Cette méthode récupère l'historique récent du chat public (50 derniers messages)
     * et l'injecte dans le modèle pour qu'il soit affiché au chargement de la page.
     *
     * @param model Le modèle Spring pour passer des données à la vue Thymeleaf.
     * @param principal L'utilisateur actuellement connecté.
     * @return Le nom du template HTML à afficher (index).
     */
    @GetMapping("/")
    public String index(Model model, Principal principal) {
        if (principal != null) {
            model.addAttribute("username", principal.getName());
        }
        // Chargement de l'historique public et inversion pour l'ordre chronologique
        List<Message> history = messageRepository.findTop50ByRecipientIsNullOrderByTimestampDesc();
        Collections.reverse(history);
        model.addAttribute("history", history);

        return "index";
    }

    // --- GESTION MESSAGES PUBLICS ---

    /**
     * Gère l'envoi de messages publics.
     *
     * Le message est nettoyé (échappement HTML pour éviter les failles XSS),
     * sauvegardé en base de données, puis diffusé à tous les abonnés du topic public.
     *
     * @param chatMessage Le message reçu via WebSocket.
     * @param principal L'expéditeur.
     * @return Le message traité qui sera diffusé.
     */
    @MessageMapping("/sendMessage")
    @SendTo("/topic/public")
    public ChatMessage broadcast(ChatMessage chatMessage, Principal principal) {
        String username = principal.getName();
        String time = getCurrentTime();

        // Sécurité : Nettoyage du contenu pour prévenir les injections XSS
        if (chatMessage.getContent() != null) {
            String cleanContent = HtmlUtils.htmlEscape(chatMessage.getContent());
            chatMessage.setContent(cleanContent);
        }

        chatMessage.setType(MessageType.CHAT);
        chatMessage.setFrom(username);
        chatMessage.setTime(time);
        
        // Persistance du message public (recipient = null)
        Message dbMessage = new Message(username, null, chatMessage.getContent());
        messageRepository.save(dbMessage); 

        return chatMessage;
    }

    // --- GESTION MESSAGES PRIVÉS ---

    /**
     * Gère l'envoi de messages privés entre deux utilisateurs.
     *
     * Vérifie d'abord si les deux utilisateurs sont amis. Si oui, le message est sauvegardé
     * et envoyé spécifiquement aux files d'attente (queues) de l'expéditeur et du destinataire.
     *
     * @param message Le message privé contenant le destinataire.
     * @param principal L'expéditeur.
     */
    @MessageMapping("/chat.private")
    public void sendPrivateMessage(@Payload ChatMessage message, Principal principal) {
        String sender = principal.getName();
        String recipient = message.getRecipient();
        String time = getCurrentTime();

        // Sécurité : Seuls les amis peuvent s'envoyer des messages privés
        if (!friendshipService.areFriends(sender, recipient)) {
            return; 
        }

        // Sécurité XSS
        String rawContent = message.getContent();
        String sanitizedContent = (rawContent != null) ? HtmlUtils.htmlEscape(rawContent) : "";
        message.setContent(sanitizedContent);

        // Construction du message WebSocket
        ChatMessage wsMessage = new ChatMessage();
        wsMessage.setSender(sender);        
        wsMessage.setRecipient(recipient);  
        wsMessage.setContent(sanitizedContent);
        wsMessage.setType(MessageType.CHAT);
        wsMessage.setTime(time);
        wsMessage.setTimestamp(LocalDateTime.now()); 

        // Sauvegarde en base de données
        Message dbMessage = new Message(sender, recipient, sanitizedContent);
        messageRepository.save(dbMessage);

        // Diffusion ciblée : à l'expéditeur (pour confirmation) et au destinataire
        simpMessagingTemplate.convertAndSendToUser(recipient, "/queue/private", wsMessage);
        simpMessagingTemplate.convertAndSendToUser(sender, "/queue/private", wsMessage);
    }

    // --- GESTION UTILISATEURS (Connexion/Statut) ---

    /**
     * Enregistre un nouvel utilisateur connecté.
     *
     * Ajoute l'utilisateur à la map des statuts et diffuse un message de type JOIN
     * pour que les autres clients puissent mettre à jour leur liste d'utilisateurs.
     */
    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public ChatMessage addUser(ChatMessage message, SimpMessageHeaderAccessor headerAccessor, Principal principal) {
        String username = principal.getName();
        userStatuses.put(username, "ONLINE");
        
        message.setType(MessageType.JOIN);
        message.setFrom(username);
        message.setContent("ONLINE"); 
        message.setTime(getCurrentTime());
        
        return message;
    }

    /**
     * Met à jour le statut d'un utilisateur (En ligne, Occupé, Absent).
     */
    @MessageMapping("/chat.changeStatus")
    @SendTo("/topic/public")
    public ChatMessage changeStatus(ChatMessage message, Principal principal) {
        String username = principal.getName();
        String newStatus = message.getContent(); 
        userStatuses.put(username, newStatus);
        
        message.setType(MessageType.STATUS);
        message.setFrom(username);
        return message;
    }

    // --- INDICATEURS DE FRAPPE ---

    /**
     * Diffuse l'événement "est en train d'écrire" sur le chat public.
     */
    @MessageMapping("/chat.typing")
    @SendTo("/topic/public")
    public ChatMessage typing(ChatMessage chatMessage) {
        chatMessage.setType(MessageType.TYPING);
        return chatMessage;
    }

    /**
     * Envoie l'événement "est en train d'écrire" uniquement au destinataire privé.
     */
    @MessageMapping("/chat.private.typing") 
    public void privateTyping(ChatMessage chatMessage) {
        chatMessage.setType(MessageType.TYPING);
        simpMessagingTemplate.convertAndSendToUser(
            chatMessage.getRecipient(), "/queue/private", chatMessage
        );
    }

    // --- API REST ---

    /**
     * API pour récupérer la liste des utilisateurs connectés et leur statut.
     * @return Une map JSON { "pseudo": "STATUT" }.
     */
    @GetMapping("/api/users")
    @ResponseBody
    public Map<String, String> getOnlineUsers() {
        return userStatuses;
    }

    /**
     * API pour récupérer l'historique récent du chat public.
     * @return Une liste JSON de messages.
     */
    @GetMapping("/api/history")
    @ResponseBody
    public List<Message> getChatHistory() {
        List<Message> messages = messageRepository.findTop50ByRecipientIsNullOrderByTimestampDesc();
        Collections.reverse(messages); 
        return messages;
    }

    /**
     * Vérifie si deux utilisateurs sont amis (utilisé par le JS pour ouvrir la popup de chat).
     */
    @GetMapping("/api/friends/check")
    @ResponseBody
    public boolean checkFriendship(@RequestParam String target, Principal principal) {
        return friendshipService.areFriends(principal.getName(), target);
    }

    /**
     * Envoie une demande d'ami et notifie le destinataire en temps réel via WebSocket.
     *
     * Si la demande est créée avec succès, un message système est poussé vers le client
     * cible pour faire apparaître la pastille rouge de notification instantanément.
     */
    @PostMapping("/api/friends/add")
    @ResponseBody
    public String sendFriendRequest(@RequestParam String receiverUsername, Principal principal) {
        String sender = principal.getName();
        boolean success = friendshipService.sendRequest(sender, receiverUsername);

        if (success) {
            // Notification WebSocket en temps réel à la cible (pour le badge rouge)
            simpMessagingTemplate.convertAndSendToUser(
                receiverUsername, "/queue/friends", "NEW_REQUEST"
            );
            return "Demande envoyée avec succès !";
        } else {
            return "Erreur : Déjà amis ou demande en attente.";
        }
    }

    // --- UTILITAIRES ---

    /**
     * Retourne l'heure actuelle au format HH:mm.
     */
    private String getCurrentTime() {
        return LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));
    }

    /**
     * Supprime un utilisateur de la liste des connectés.
     * Cette méthode statique est généralement appelée par l'écouteur de déconnexion WebSocket.
     */
    public static void removeUser(String username) {
        userStatuses.remove(username);
    }
}