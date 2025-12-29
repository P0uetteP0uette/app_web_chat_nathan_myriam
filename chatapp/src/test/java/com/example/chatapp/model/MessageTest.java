package com.example.chatapp.model;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class MessageTest {

    @Test
    void testMessageCreation() {
        // 1. Préparation (Arrange)
        String sender = "Toto";
        String content = "Salut le monde";
        String time = "12:00";

        // 2. Action (Act)
        Message message = new Message(sender, content, time);

        // 3. Vérification (Assert)
        // On vérifie que l'objet a bien enregistré les infos
        assertNotNull(message);
        assertEquals("Toto", message.getSender());
        assertEquals("Salut le monde", message.getContent());
        assertEquals("12:00", message.getTime());
    }

    @Test
    void testSetters() {
        // Test que les setters fonctionnent aussi
        Message message = new Message();
        message.setSender("Titi");
        
        assertEquals("Titi", message.getSender());
    }
}