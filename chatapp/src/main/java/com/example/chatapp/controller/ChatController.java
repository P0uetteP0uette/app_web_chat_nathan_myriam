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
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.util.HtmlUtils;
import org.springframework.web.bind.annotation.RequestParam;

import java.security.Principal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

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

    @Autowired
    private FriendshipService friendshipService;

    /**
     * Affiche la page d'accueil de l'application.
     * Injecte le nom de l'utilisateur connecté dans le modèle pour utilisation par le client (JavaScript).
     */
    @GetMapping("/")
    public String index(Model model, Principal principal) {
        if (principal != null) {
            model.addAttribute("username", principal.getName());
        }

        // --- AJOUT : CHARGER L'HISTORIQUE PUBLIC ---
        // On récupère les 50 derniers messages SANS destinataire (donc publics)
        List<Message> history = messageRepository.findTop50ByRecipientIsNullOrderByTimestampDesc();
        
        // On inverse la liste pour les afficher du plus vieux au plus récent (Haut vers Bas)
        Collections.reverse(history);
        
        // On donne la liste à la page HTML
        model.addAttribute("history", history);
        // -------------------------------------------

        return "index";
    }

    /**
     * Gère l'envoi de messages publics.
     * Le message est sauvegardé en base de données puis diffusé à tous les abonnés.
     */
    @MessageMapping("/sendMessage")
    @SendTo("/topic/public")
    public ChatMessage broadcast(ChatMessage chatMessage, Principal principal) {
        String username = principal.getName();
        String time = getCurrentTime();

        // 🛡️ SÉCURITÉ XSS (Clean Code) : On nettoie le message avant tout traitement
        if (chatMessage.getContent() != null) {
            String cleanContent = HtmlUtils.htmlEscape(chatMessage.getContent());
            chatMessage.setContent(cleanContent);
        }

        // Préparation du message pour le WebSocket (Affichage immédiat)
        chatMessage.setType(MessageType.CHAT);
        chatMessage.setFrom(username);
        chatMessage.setTime(time);
        
        // --- CORRECTION IMPORTANTE ---
        // Pour la BDD, on utilise le nouveau constructeur : Message(sender, recipient, content)
        // On met 'null' en recipient pour dire que c'est PUBLIC
        // Note: le content est déjà nettoyé (sanitized) juste au-dessus
        Message dbMessage = new Message(username, null, chatMessage.getContent());
        
        messageRepository.save(dbMessage); 
        // -----------------------------

        return chatMessage;
    }

    /**
     * Gère l'envoi de messages privés (1-to-1).
     * Le message est envoyé spécifiquement au destinataire et renvoyé à l'expéditeur pour confirmation visuelle.
     */

    @MessageMapping("/chat.private")
    public void sendPrivateMessage(@Payload ChatMessage message, Principal principal) {
        String sender = principal.getName();
        String recipient = message.getRecipient();
        String time = getCurrentTime();

        // --- 🔒 VÉRIFICATION AMITIÉ (Exigence Itération 3) ---
        // Avant tout traitement, on vérifie si l'expéditeur et le destinataire sont amis.
        // Si ta méthode s'appelle autrement (ex: checkFriendship), change le nom ici.
        if (!friendshipService.areFriends(sender, recipient)) {
            System.out.println("⛔ ERREUR SÉCURITÉ : " + sender + " a tenté d'écrire à " + recipient + " sans être ami.");
            return; // 🛑 ON ARRÊTE TOUT ICI. Le message n'est ni sauvegardé, ni envoyé.
        }
        // ----------------------------------------------------

        // 🛡️ SÉCURITÉ XSS (Clean Code) : On nettoie le message privé aussi
        String rawContent = message.getContent();
        String sanitizedContent = (rawContent != null) ? HtmlUtils.htmlEscape(rawContent) : "";
        message.setContent(sanitizedContent); // On met à jour l'objet entrant

        System.out.println("📨 Message privé reçu de: " + sender + " vers: " + recipient);

        // 1. Préparer le message pour WebSocket
        ChatMessage wsMessage = new ChatMessage();
        wsMessage.setSender(sender);        
        wsMessage.setRecipient(recipient);  
        wsMessage.setContent(sanitizedContent); // Contenu sécurisé
        wsMessage.setType(MessageType.CHAT);
        wsMessage.setTime(time);
        wsMessage.setTimestamp(LocalDateTime.now()); 

        // 2. SAUVEGARDER EN BDD
        Message dbMessage = new Message(sender, recipient, sanitizedContent);
        messageRepository.save(dbMessage);
        System.out.println("💾 Message sauvegardé en BDD");

        // 3. ENVOYER AU DESTINATAIRE
        System.out.println("📤 Envoi à " + recipient + " via /user/" + recipient + "/queue/private");
        simpMessagingTemplate.convertAndSendToUser(recipient, "/queue/private", wsMessage);

        // 4. ENVOYER A L'EXPÉDITEUR (Pour confirmation immédiate)
        System.out.println("📤 Envoi à " + sender + " (confirmation) via /user/" + sender + "/queue/private");
        simpMessagingTemplate.convertAndSendToUser(sender, "/queue/private", wsMessage);
        
        System.out.println("✅ Message privé envoyé avec succès");
    }

    /**
     * Gère l'arrivée d'un nouvel utilisateur dans le chat.
     */
    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public ChatMessage addUser(ChatMessage message, SimpMessageHeaderAccessor headerAccessor, Principal principal) {
        String username = principal.getName();
        
        // Par défaut, le nouveau est ONLINE
        userStatuses.put(username, "ONLINE");
        
        message.setType(MessageType.JOIN);
        message.setFrom(username);
        message.setContent("ONLINE"); 
        message.setTime(getCurrentTime());
        
        return message;
    }

    /**
     * Permet à un utilisateur de changer manuellement son statut.
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

    // --- INDICATEUR DE FRAPPE (Chat Public) ---
    @MessageMapping("/chat.typing")
    @SendTo("/topic/public")
    public ChatMessage typing(ChatMessage chatMessage) {
        // On renvoie juste le signal "C'est un type TYPING"
        chatMessage.setType(MessageType.TYPING);
        return chatMessage;
    }

    // --- INDICATEUR DE FRAPPE (Chat Privé) ---
    @MessageMapping("/chat.private.typing") 
    public void privateTyping(ChatMessage chatMessage) {
        // On s'assure que le type est bien TYPING
        chatMessage.setType(MessageType.TYPING);
        
        // On l'envoie UNIQUEMENT au destinataire (recipient)
        // Correction ici : on utilise 'simpMessagingTemplate' qui est déjà déclaré plus haut
        simpMessagingTemplate.convertAndSendToUser(
            chatMessage.getRecipient(), 
            "/queue/private", 
            chatMessage
        );
    }

    /**
     * API REST pour récupérer la liste des utilisateurs connectés.
     */
    @GetMapping("/api/users")
    @ResponseBody
    public Map<String, String> getOnlineUsers() {
        return userStatuses;
    }

    /**
     * API REST pour récupérer l'historique des derniers messages.
     */
    @GetMapping("/api/history")
    @ResponseBody
    public List<Message> getChatHistory() {
        List<Message> messages = messageRepository.findTop50ByRecipientIsNullOrderByTimestampDesc();
        Collections.reverse(messages); 
        return messages;
    }

    /**
     * API pour vérifier si deux utilisateurs sont amis.
     * Appelée par le JavaScript avant d'ouvrir la popup.
     */
    @GetMapping("/api/friends/check")
    @ResponseBody
    public boolean checkFriendship(@RequestParam String target, Principal principal) {
        String me = principal.getName();
        
        // On utilise ton service existant pour vérifier
        return friendshipService.areFriends(me, target);
    }

// Dans ChatController.java

    @PostMapping("/api/friends/add")
    @ResponseBody
    public String sendFriendRequest(@RequestParam String receiverUsername, Principal principal) {
        String sender = principal.getName();
        boolean success = friendshipService.sendRequest(sender, receiverUsername);

        if (success) {
            // --- NOUVEAU : NOTIFICATION TEMPS RÉEL ---
            // On envoie un signal sur le canal "/queue/friends" de l'utilisateur cible
            simpMessagingTemplate.convertAndSendToUser(
                receiverUsername, 
                "/queue/friends", 
                "NEW_REQUEST" // Le message importe peu, c'est le signal qui compte
            );
            // -----------------------------------------
            
            return "Demande envoyée avec succès !";
        } else {
            return "Erreur : Demande en attente.";
        }
    }

    // --- Méthodes utilitaires ---

    private String getCurrentTime() {
        return LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));
    }

    public static void removeUser(String username) {
        userStatuses.remove(username);
    }
}