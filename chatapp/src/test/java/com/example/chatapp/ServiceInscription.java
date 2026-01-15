package com.example.chatapp;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import com.example.chatapp.model.User;
import com.example.chatapp.repository.UserRepository;
import com.example.chatapp.service.UserService;

/**
 * Classe de test d'intégration pour le processus d'inscription.
 *
 * Elle charge le contexte Spring complet (@SpringBootTest) pour vérifier
 * que le service d'inscription interagit correctement avec la base de données
 * et les composants de sécurité (hachage de mot de passe).
 *
 * L'annotation @Transactional assure que les données créées pendant le test
 * sont annulées (rollback) à la fin, laissant la base propre.
 */
@SpringBootTest
@Transactional
public class ServiceInscription {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    /**
     * Vérifie que le mot de passe est bien haché lors de l'inscription.
     *
     * Le test effectue les étapes suivantes :
     * 1. Définit un mot de passe en clair.
     * 2. Inscrit l'utilisateur via le UserService.
     * 3. Récupère l'utilisateur enregistré en base de données.
     * 4. S'assure que le mot de passe stocké n'est pas égal au mot de passe en clair.
     * 5. Vérifie que le mot de passe stocké commence par le préfixe standard de BCrypt ($2a$).
     */
    @Test
    void testUserRegistrationHashing() {
        String rawPassword = "Password123!";
        String username = "TestUserUnit";

        // 2. Action : On inscrit l'utilisateur via le service
        try {
            userService.registerUser(username, rawPassword);
        } catch (Exception e) {
            // Si l'utilisateur existe déjà, on ignore ou on gère
        }
        
        // 3. Vérification : On récupère l'utilisateur en base
        User savedUser = userRepository.findByUsername(username).orElse(null);
        
        // Vérifions qu'il a bien été trouvé
        assertNotNull(savedUser, "L'utilisateur devrait être en base de données");

        // 4. Assertions sur le mot de passe
        assertNotEquals(rawPassword, savedUser.getPassword(), "Le mot de passe ne doit pas être en clair !");
        
        // Vérifie que c'est du BCrypt
        assertTrue(savedUser.getPassword().startsWith("$2a$"), "Le mot de passe doit être haché avec BCrypt");
    }
}