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
import org.springframework.ui.Model;

/**
 * Contrôleur principal de l'application de Chat.
 * Gère les interactions WebSocket (STOMP) pour la messagerie temps réel
 * ainsi que les endpoints REST et l'affichage des vues HTML.
 */
@Controller
public class ChatController {

    /**
     * Stocke les statuts des utilisateurs connectés en mémoire vive.
     * Structure : "Pseudo" -> "Statut" (ex: "Toto" -> "ONLINE").
     */
    private static final Map<String, String> userStatuses = new ConcurrentHashMap<>();

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private SimpMessagingTemplate simpMessagingTemplate;

    /**
     * Affiche la page d'accueil de l'application.
     * Injecte le nom de l'utilisateur connecté dans le modèle pour utilisation par le client (JavaScript).
     *
     * @param model Le modèle Thymeleaf pour passer des données à la vue.
     * @param principal L'objet représentant l'utilisateur connecté via Spring Security.
     * @return Le nom de la vue "index".
     */
    @GetMapping("/")
    public String index(Model model, Principal principal) {
        if (principal != null) {
            model.addAttribute("username", principal.getName());
        }
        return "index";
    }

    /**
     * Gère l'envoi de messages publics.
     * Le message est sauvegardé en base de données puis diffusé à tous les abonnés.
     *
     * @param chatMessage Le message reçu du client.
     * @param principal L'utilisateur expéditeur.
     * @return Le message complété à diffuser sur /topic/public.
     */
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

    /**
     * Gère l'envoi de messages privés (1-to-1).
     * Le message est envoyé spécifiquement au destinataire et renvoyé à l'expéditeur pour confirmation visuelle.
     *
     * @param message Le message contenant le contenu et le destinataire.
     * @param principal L'utilisateur expéditeur.
     */
    @MessageMapping("/chat.private")
    public void sendPrivateMessage(@Payload ChatMessage message, Principal principal) {
        String sender = principal.getName();
        String recipient = message.getRecipient();
        String time = getCurrentTime();

        message.setFrom(sender);
        message.setTime(time);
        message.setType(MessageType.CHAT);

        // Envoi au destinataire
        simpMessagingTemplate.convertAndSendToUser(recipient, "/queue/private", message);

        // Envoi à l'expéditeur (pour affichage dans sa propre fenêtre)
        simpMessagingTemplate.convertAndSendToUser(sender, "/queue/private", message);
    }

    /**
     * Gère l'arrivée d'un nouvel utilisateur dans le chat.
     * Définit son statut par défaut à "ONLINE" et diffuse l'événement.
     *
     * @param message Le message de connexion.
     * @param headerAccessor Accesseur aux en-têtes WebSocket.
     * @param principal L'utilisateur qui se connecte.
     * @return Le message de type JOIN à diffuser sur /topic/public.
     */
    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public ChatMessage addUser(ChatMessage message, SimpMessageHeaderAccessor headerAccessor, Principal principal) {
        String username = principal.getName();
        
        // Par défaut, le nouveau est ONLINE
        userStatuses.put(username, "ONLINE");
        
        message.setType(MessageType.JOIN);
        message.setFrom(username);
        message.setContent("ONLINE"); // On transporte le statut initial
        message.setTime(getCurrentTime());
        
        return message;
    }

    /**
     * Permet à un utilisateur de changer manuellement son statut (Occupé, Absent, En ligne).
     *
     * @param message Le message contenant le nouveau statut dans le champ 'content'.
     * @param principal L'utilisateur qui change de statut.
     * @return Le message de type STATUS à diffuser pour mettre à jour les interfaces des autres clients.
     */
    @MessageMapping("/chat.changeStatus")
    @SendTo("/topic/public")
    public ChatMessage changeStatus(ChatMessage message, Principal principal) {
        String username = principal.getName();
        String newStatus = message.getContent(); // "ONLINE", "BUSY", "AWAY"
        
        userStatuses.put(username, newStatus);
        
        message.setType(MessageType.STATUS);
        message.setFrom(username);
        
        return message;
    }

    /**
     * API REST pour récupérer la liste des utilisateurs connectés et leurs statuts actuels.
     * Utilisé par le client JavaScript au chargement de la page pour initialiser la barre latérale.
     *
     * @return Une map contenant les pseudos et les statuts.
     */
    @GetMapping("/api/users")
    @ResponseBody
    public Map<String, String> getOnlineUsers() {
        return userStatuses;
    }

    /**
     * API REST pour récupérer l'historique des derniers messages.
     * Renvoie les 50 derniers messages stockés en base de données.
     *
     * @return Une liste d'objets Message triée chronologiquement.
     */
    @GetMapping("/api/history")
    @ResponseBody
    public List<Message> getChatHistory() {
        List<Message> messages = messageRepository.findTop50ByOrderByIdDesc();
        Collections.reverse(messages); // Remet dans l'ordre chronologique pour l'affichage
        return messages;
    }

    // --- Méthodes utilitaires ---

    /**
     * Obtient l'heure actuelle formatée.
     * @return L'heure sous format "HH:mm".
     */
    private String getCurrentTime() {
        return LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));
    }

    /**
     * Supprime un utilisateur de la liste des connectés.
     * Méthode statique appelée par le WebSocketEventListener lors d'une déconnexion.
     *
     * @param username Le pseudo de l'utilisateur à retirer.
     */
    public static void removeUser(String username) {
        userStatuses.remove(username);
    }
}