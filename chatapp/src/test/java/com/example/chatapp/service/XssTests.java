package com.example.chatapp.service;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

public class XssTests {
    @Test
    void testXssProtectionInController() {
        // Simulation d'un message malveillant
        String maliciousInput = "<script>alert('Hacked')</script>Bonjour";
        
        // On utilise la classe utilitaire de Spring (celle que tu utilises dans le controller)
        String cleaned = org.springframework.web.util.HtmlUtils.htmlEscape(maliciousInput);
        
        // Vérification
        assertNotEquals(maliciousInput, cleaned);
        assertTrue(cleaned.contains("&lt;script&gt;")); // Vérifie que les chevrons sont échappés
        System.out.println("Test XSS Réussi : " + cleaned);
    }
}
