package com.example.chatapp.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Service responsable de la gestion et de l'envoi des emails de l'application.
 *
 * Ce service utilise JavaMailSender pour expédier les courriels.
 * Il est actuellement configuré pour un environnement de développement (ex: MailTrap)
 * et inclut des logs détaillés pour faciliter le débogage.
 */
@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    /**
     * Envoie un email de vérification contenant un lien d'activation unique.
     *
     * Cette méthode construit le lien d'activation, affiche des logs de secours
     * dans la console (pratique si le serveur mail n'est pas accessible),
     * et tente d'expédier l'email via le serveur SMTP configuré.
     *
     * @param to L'adresse email du destinataire (ou le pseudo dans ce contexte de test).
     * @param token Le jeton de validation unique associé à l'utilisateur.
     */
    public void sendVerificationEmail(String to, String token) {
        
        // Log de début pour tracer l'appel
        System.out.println(">>> TENTATIVE D'ENVOI DE MAIL à : " + to);
        
        // Construction du lien d'activation
        String activationLink = "http://localhost:8080/activate?token=" + token;
        String subject = "Activez votre compte ChatApp";
        String message = "Bonjour " + to + ",\n\n" +
                          "Lien d'activation : " + activationLink;

        SimpleMailMessage email = new SimpleMailMessage();

        // --- ZONE DE DEBUG ---
        // Affichage du lien dans la console pour permettre la validation manuelle
        // si le service d'envoi d'email échoue ou n'est pas configuré.
        System.out.println("------------------------------------------------");
        System.out.println("LIEN DE SECOURS (Clique ici) : " + activationLink);
        System.out.println("------------------------------------------------");
        // --------------------

        email.setFrom("noreply@chatapp.com"); // Adresse d'expédition par défaut

        // Note: En mode développement, on force l'envoi vers une boite de test
        // pour ne pas spammer de vraies adresses si 'to' est invalide.
        email.setTo("test@test.com");
        
        email.setSubject(subject);
        email.setText(message);

        try {
            // Tentative d'envoi via le serveur SMTP
            mailSender.send(email);
            System.out.println(">>> MAIL ENVOYÉ AVEC SUCCÈS VIA MAILTRAP !");
        } catch (Exception e) {
            // Gestion d'erreur critique (ex: serveur mail injoignable)
            System.out.println(">>> ERREUR CRITIQUE D'ENVOI MAIL : " + e.getMessage());
            e.printStackTrace();
        }
    }
}