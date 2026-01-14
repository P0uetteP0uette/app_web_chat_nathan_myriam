package com.example.chatapp.service;

import com.example.chatapp.model.User;
import com.example.chatapp.model.VerificationToken;
import com.example.chatapp.repository.UserRepository;
import com.example.chatapp.repository.VerificationTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VerificationTokenRepository tokenRepository; // <--- AJOUTÉ

    @Autowired
    private EmailService emailService; // <--- AJOUTÉ

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Regex pour un mot de passe sécurisé
    private static final String PASSWORD_REGEX = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!.*])(?=\\S+$).{8,}$";
    private static final Pattern PATTERN = Pattern.compile(PASSWORD_REGEX);

    /**
     * Inscrit l'utilisateur mais NE L'ACTIVE PAS encore.
     * Envoie un mail de validation.
     */
    public void registerUser(String username, String password) throws Exception {
        // 1. Vérif existant
        if (userRepository.findByUsername(username).isPresent()) {
            throw new Exception("Ce pseudo est déjà pris !");
        }

        // 2. Vérif mdp avec message d'erreur
        if (!PATTERN.matcher(password).matches()) {
            throw new Exception("Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.");
        }

        // 3. Création de l'utilisateur (INACTIF par défaut)
        User newUser = new User(username, passwordEncoder.encode(password));
        newUser.setEnabled(false); // <--- Important : on force le compte inactif
        userRepository.save(newUser);

        // 4. Création du Token de vérification
        VerificationToken token = new VerificationToken(newUser);
        tokenRepository.save(token); // <--- C'est ça qui manquait dans tes logs !

        // 5. Envoi de l'email
        emailService.sendVerificationEmail(username, token.getToken());
    }

    /**
     * Valide le token reçu par mail et active le compte.
     */
    public void activateAccount(String token) throws Exception {
        VerificationToken verificationToken = tokenRepository.findByToken(token);

        if (verificationToken == null) {
            throw new Exception("Lien d'activation invalide !");
        }

        User user = verificationToken.getUser();
        user.setEnabled(true); // <--- ON ACTIVE LE COMPTE
        userRepository.save(user);

        // On supprime le token car il a servi
        tokenRepository.delete(verificationToken);
    }
}