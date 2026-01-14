package com.example.chatapp.service;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import com.example.chatapp.model.User;
import com.example.chatapp.repository.UserRepository;

@SpringBootTest
@Transactional
public class ServiceInscription {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Test
    void testUserRegistrationHashing() {
        // 1. Données de test
        String rawPassword = "Password123!";
        String username = "TestUserUnit";

        // 2. Action : On inscrit l'utilisateur via le service
        try {
            userService.registerUser(username, rawPassword);
        } catch (Exception e) {
            // Si l'utilisateur existe déjà, on ignore ou on gère
        }
        
        // 3. Vérification : On récupère l'utilisateur en base
        // --- CORRECTION ICI (Ligne 40) ---
        // On utilise .orElse(null) pour extraire le User de l'Optional
        User savedUser = userRepository.findByUsername(username).orElse(null);
        
        // Vérifions qu'il a bien été trouvé (qu'il n'est pas null)
        assertNotNull(savedUser, "L'utilisateur devrait être en base de données");

        // 4. Assertions sur le mot de passe
        // Vérifier que le mot de passe n'est PAS stocké en clair
        assertNotEquals(rawPassword, savedUser.getPassword(), "Le mot de passe ne doit pas être en clair !");
        
        // Vérifie que c'est du BCrypt (commence par $2a$)
        assertTrue(savedUser.getPassword().startsWith("$2a$"), "Le mot de passe doit être haché avec BCrypt");
    }
}