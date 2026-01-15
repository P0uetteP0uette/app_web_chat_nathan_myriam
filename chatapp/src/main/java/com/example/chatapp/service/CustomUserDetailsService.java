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
 *
 * Ce service implémente l'interface UserDetailsService pour faire le lien
 * entre les utilisateurs stockés en base de données (via UserRepository)
 * et le mécanisme d'authentification interne de Spring Security.
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    /**
     * Charge les détails d'un utilisateur à partir de son nom d'utilisateur.
     *
     * Cette méthode est appelée automatiquement par Spring Security lors du processus de login
     * pour vérifier si l'utilisateur existe et récupérer ses informations (mot de passe hashé, statut, rôles).
     *
     * @param username Le pseudo de l'utilisateur qui tente de se connecter.
     * @return Un objet UserDetails contenant les informations de l'utilisateur.
     * @throws UsernameNotFoundException Si aucun utilisateur ne correspond au pseudo fourni.
     */
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur non trouvé : " + username));

        // Conversion de notre entité User vers l'objet User de Spring Security
        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                user.isEnabled(), // Le compte est-il activé (email validé) ?
                true, // accountNonExpired
                true, // credentialsNonExpired
                true, // accountNonLocked
                Collections.emptyList() // Liste des rôles/autorisations (vide pour l'instant)
        );
    }
}