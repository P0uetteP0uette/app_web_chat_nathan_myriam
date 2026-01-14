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

@ControllerAdvice // <--- C'est la magie : ça s'applique à TOUS les contrôleurs
public class GlobalControllerAdvice {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FriendshipRepository friendshipRepository;

    // Cette méthode s'exécute avant chaque chargement de page HTML
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
        return 0; // 0 notification si pas connecté
    }
}