package com.example.chatapp.controller;

import com.example.chatapp.model.Message;
import com.example.chatapp.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * Contrôleur REST pour la gestion de l'historique des discussions privées.
 *
 * Contrairement au contrôleur WebSocket qui gère le temps réel, ce contrôleur
 * sert principalement à charger les anciens messages via des appels HTTP standards (JSON).
 */
@RestController // Répond en JSON, pas en HTML
@RequestMapping("/api/chat")
public class ChatRestController {

    @Autowired
    private MessageRepository messageRepository;

    /**
     * Récupère l'historique de conversation entre l'utilisateur connecté et un ami.
     *
     * La requête cherche tous les messages échangés dans les deux sens (A vers B et B vers A)
     * et les retourne triés par ordre chronologique pour l'affichage.
     *
     * @param friendUsername Le pseudo de l'ami dont on veut voir la discussion.
     * @param principal L'utilisateur connecté (sécurité Spring).
     * @return Une liste d'objets Message au format JSON.
     */
    @GetMapping("/history/{friendUsername}")
    public List<Message> getChatHistory(@PathVariable String friendUsername, Principal principal) {
        String myUsername = principal.getName();
        
        // On cherche la conversation dans les deux sens (moi -> lui OU lui -> moi)
        return messageRepository.findBySenderAndRecipientOrSenderAndRecipientOrderByTimestampAsc(
                myUsername, friendUsername, friendUsername, myUsername
        );
    }

    /**
     * Enregistre un nouveau message privé dans la base de données via une requête HTTP POST.
     *
     * Cette méthode permet de sauvegarder un message via une API REST classique.
     *
     * @param recipient Le pseudo du destinataire.
     * @param content Le contenu du message.
     * @param principal L'expéditeur (l'utilisateur connecté).
     * @return L'objet Message sauvegardé.
     */
    @PostMapping("/send")
    public Message sendMessage(@RequestParam String recipient, @RequestParam String content, Principal principal) {
        String myUsername = principal.getName();
        
        // Création et persistance du message
        Message msg = new Message(myUsername, recipient, content);
        
        return messageRepository.save(msg);
    }
}