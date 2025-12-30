package com.example.chatapp.service;

import com.example.chatapp.model.User;
import com.example.chatapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

/**
 * Service personnalisé pour l'authentification Spring Security.
 * Fait le lien entre les utilisateurs stockés en base de données et le système de sécurité de Spring.
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    /**
     * Charge les détails d'un utilisateur à partir de son nom d'utilisateur.
     * Cette méthode est appelée automatiquement par Spring Security lors de la tentative de connexion.
     *
     * @param username Le pseudo de l'utilisateur qui tente de se connecter.
     * @return Un objet UserDetails contenant les infos de l'utilisateur (pseudo, mot de passe, droits).
     * @throws UsernameNotFoundException Si l'utilisateur n'existe pas en base de données.
     */
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur non trouvé : " + username));

        // On passe "user.isEnabled()" à Spring Security
        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                user.isEnabled(), // <--- C'est ICI que la magie opère (true/false)
                true, // accountNonExpired (on s'en fiche pour l'instant, on met true)
                true, // credentialsNonExpired
                true, // accountNonLocked
                Collections.emptyList()
        );
    }
}