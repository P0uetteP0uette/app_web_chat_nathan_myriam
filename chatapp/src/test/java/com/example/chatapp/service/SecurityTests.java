package com.example.chatapp.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrlPattern;

@SpringBootTest
@AutoConfigureMockMvc
class SecurityTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void testAccessDeniedForUnauthenticatedUser() throws Exception {
        // Test de sécurité : On essaie d'accéder à la liste des utilisateurs sans être connecté
        
        // CORRECTION : Spring Security redirige vers /login (Code 302) au lieu de renvoyer 403
        mockMvc.perform(get("/api/users"))
                .andExpect(status().is3xxRedirection()) // On vérifie que c'est une redirection (302)
                .andExpect(redirectedUrlPattern("**/login")); // On vérifie qu'on est redirigé vers le login
    }
}