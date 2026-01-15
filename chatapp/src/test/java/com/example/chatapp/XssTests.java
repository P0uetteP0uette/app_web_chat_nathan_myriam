package com.example.chatapp;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.web.util.HtmlUtils;

/**
 * Classe de tests unitaires dédiée à la vérification de la sécurité.
 *
 * Elle se concentre principalement sur la prévention des failles XSS (Cross-Site Scripting)
 * en s'assurant que les utilitaires de nettoyage fonctionnent comme prévu.
 */
public class XssTests {

    /**
     * Teste la méthode d'échappement HTML utilisée dans les contrôleurs.
     *
     * Le but est de vérifier qu'une tentative d'injection de script (balises script)
     * est bien neutralisée en convertissant les caractères spéciaux en entités HTML.
     */
    @Test
    void testXssProtectionInController() {
        // Simulation d'un message malveillant contenant du JavaScript
        String maliciousInput = "<script>alert('Hacked')</script>Bonjour";
        
        // On utilise la classe utilitaire de Spring pour échapper le HTML
        // C'est cette même méthode qui est utilisée dans le ChatController
        String cleaned = HtmlUtils.htmlEscape(maliciousInput);
        
        // Vérification 1 : La chaîne nettoyée doit être différente de l'originale
        assertNotEquals(maliciousInput, cleaned);
        
        // Vérification 2 : Les chevrons ouvrants (<) doivent être convertis en &lt;
        assertTrue(cleaned.contains("&lt;script&gt;")); 
        
        System.out.println("Test XSS Réussi : " + cleaned);
    }
}