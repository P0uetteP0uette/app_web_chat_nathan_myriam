package com.example.chatapp.controller;

import com.example.chatapp.model.FriendshipStatus;
import com.example.chatapp.model.User;
import com.example.chatapp.repository.FriendshipRepository;
import com.example.chatapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

import java.util.Optional;

/**
 * Contrôleur global pour l'injection de données communes à toutes les vues.
 *
 * Grâce à l'annotation ControllerAdvice, cette classe permet d'ajouter des attributs
 * au modèle (Model) de manière transversale, pour qu'ils soient accessibles
 * dans n'importe quel template HTML (header, sidebar, etc.) sans avoir à modifier chaque contrôleur.
 */
@ControllerAdvice
public class GlobalControllerAdvice {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FriendshipRepository friendshipRepository;

    /**
     * Ajoute le nombre de demandes d'amis en attente au modèle global.
     *
     * Cette méthode est exécutée automatiquement avant chaque rendu de page.
     * Elle vérifie si l'utilisateur est connecté, et si oui, compte ses demandes
     * avec le statut WAITING pour afficher la pastille de notification rouge.
     *
     * @return Le nombre de demandes en attente (0 si non connecté).
     */
    @ModelAttribute("pendingRequestCount")
    public long addPendingRequestsToModel() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        // Si l'utilisateur est connecté et n'est pas "anonymousUser"
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            String username = auth.getName();
            Optional<User> me = userRepository.findByUsername(username);
            
            if (me.isPresent()) {
                // On compte les demandes en attente
                return friendshipRepository.countByFriendAndStatus(me.get(), FriendshipStatus.WAITING);
            }
        }
        return 0;
    }
}