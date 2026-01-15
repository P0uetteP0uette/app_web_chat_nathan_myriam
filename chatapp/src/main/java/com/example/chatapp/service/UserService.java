package com.example.chatapp.service;

import com.example.chatapp.model.User;
import com.example.chatapp.model.VerificationToken;
import com.example.chatapp.repository.UserRepository;
import com.example.chatapp.repository.VerificationTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

/**
 * Service gérant le cycle de vie des utilisateurs.
 *
 * Ce service s'occupe de l'inscription (avec validation de mot de passe complexe),
 * de la création des tokens de vérification et de l'activation des comptes par email.
 */
@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VerificationTokenRepository tokenRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Expression régulière pour valider la complexité du mot de passe.
     * Exige : 8 caractères min, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial.
     */
    private static final String PASSWORD_REGEX = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!.*])(?=\\S+$).{8,}$";
    
    private static final Pattern PATTERN = Pattern.compile(PASSWORD_REGEX);

    /**
     * Inscrit un nouvel utilisateur dans le système.
     *
     * Le compte est créé avec le statut désactivé (enabled = false).
     * Un email contenant un lien d'activation est envoyé à l'utilisateur.
     *
     * @param username Le nom d'utilisateur (doit être unique et au format email valide).
     * @param password Le mot de passe brut (sera hashé avant stockage).
     * @throws Exception Si le pseudo est déjà pris ou si le mot de passe ne respecte pas les critères de sécurité.
     */
    public void registerUser(String username, String password) throws Exception {
        // Vérification de l'unicité du pseudo
        if (userRepository.findByUsername(username).isPresent()) {
            throw new Exception("Ce pseudo est déjà pris !");
        }

        // Validation de la complexité du mot de passe
        if (!PATTERN.matcher(password).matches()) {
            throw new Exception("Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.");
        }

        // Création de l'utilisateur (INACTIF par défaut)
        User newUser = new User(username, passwordEncoder.encode(password));
        newUser.setEnabled(false);
        userRepository.save(newUser);

        // Génération et sauvegarde du token de vérification
        VerificationToken token = new VerificationToken(newUser);
        tokenRepository.save(token);

        // Envoi de l'email d'activation
        emailService.sendVerificationEmail(username, token.getToken());
    }

    /**
     * Active le compte d'un utilisateur via son token de vérification.
     *
     * Une fois le compte activé, le token est supprimé de la base de données pour empêcher sa réutilisation.
     *
     * @param token La chaîne de caractères du token reçu par email.
     * @throws Exception Si le token est introuvable ou invalide.
     */
    public void activateAccount(String token) throws Exception {
        VerificationToken verificationToken = tokenRepository.findByToken(token);

        if (verificationToken == null) {
            throw new Exception("Lien d'activation invalide ou expiré !");
        }

        User user = verificationToken.getUser();
        user.setEnabled(true); // Activation effective du compte
        userRepository.save(user);

        // Nettoyage : suppression du token consommé
        tokenRepository.delete(verificationToken);
    }
}