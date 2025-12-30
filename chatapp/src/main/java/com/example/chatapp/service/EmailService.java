package com.example.chatapp.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Service responsable de l'envoi des emails.
 * Utilise JavaMailSender configuré (ici avec MailTrap pour le développement).
 */
@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    /**
     * Envoie un email de vérification contenant un lien d'activation.
     *
     * @param to L'adresse email (ou pseudo) du destinataire.
     * @param token Le jeton de validation unique.
     */
    public void sendVerificationEmail(String to, String token) {
        
        System.out.println(">>> TENTATIVE D'ENVOI DE MAIL à : " + to);
        
        String activationLink = "http://localhost:8080/activate?token=" + token;
        String subject = "Activez votre compte ChatApp";
        String message = "Bonjour " + to + ",\n\n" +
                         "Lien d'activation : " + activationLink;

        SimpleMailMessage email = new SimpleMailMessage();

        // --- AJOUTE ÇA POUR CLIQUER DEPUIS LA CONSOLE ---
        System.out.println("------------------------------------------------");
        System.out.println("LIEN DE SECOURS (Clique ici) : " + activationLink);
        System.out.println("------------------------------------------------");

        // --- AJOUTE CETTE LIGNE ICI ---
        email.setFrom("noreply@chatapp.com"); 
        // ------------------------------

        email.setTo("test@test.com"); // (MailTrap redirige tout, peu importe cette adresse)
        email.setSubject(subject);
        email.setText(message);

        try {
            mailSender.send(email); // Cette fois, ça va partir !
            System.out.println(">>> MAIL ENVOYÉ AVEC SUCCÈS VIA MAILTRAP !");
        } catch (Exception e) {
            System.out.println(">>> ERREUR CRITIQUE D'ENVOI MAIL : " + e.getMessage());
            e.printStackTrace();
        }
    }
}