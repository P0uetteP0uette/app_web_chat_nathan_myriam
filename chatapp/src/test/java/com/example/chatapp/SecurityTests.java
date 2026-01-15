package com.example.chatapp;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrlPattern;

/**
 * Classe de tests d'intégration pour la configuration de sécurité.
 *
 * Elle utilise MockMvc pour simuler des requêtes HTTP et vérifier que les règles d'accès
 * définies dans SecurityConfig (authentification requise, redirections) sont bien appliquées.
 */
@SpringBootTest
@AutoConfigureMockMvc
class SecurityTests {

    @Autowired
    private MockMvc mockMvc;

    /**
     * Vérifie que l'accès aux ressources protégées est refusé aux utilisateurs non connectés.
     *
     * Le test tente d'accéder à l'endpoint "/api/users" sans authentification préalable.
     * Il s'attend à ce que le serveur réponde par une redirection (code 302)
     * pointant vers la page de connexion ("/login").
     *
     * @throws Exception En cas d'erreur technique lors de l'exécution de la requête simulée.
     */
    @Test
    void testAccessDeniedForUnauthenticatedUser() throws Exception {
        // Test de sécurité : On essaie d'accéder à la liste des utilisateurs sans être connecté
        mockMvc.perform(get("/api/users"))
                .andExpect(status().is3xxRedirection()) // On vérifie que c'est une redirection (302)
                .andExpect(redirectedUrlPattern("**/login")); // On vérifie qu'on est redirigé vers le login
    }
}