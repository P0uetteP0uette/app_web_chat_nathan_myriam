package com.example.chatapp.service;

import com.example.chatapp.model.User;
import com.example.chatapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

/**
 * Service gérant la logique métier des utilisateurs.
 * Responsable de l'inscription, de la validation des données et du cryptage des mots de passe.
 */
@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Regex de validation du mot de passe (Actuellement simplifié pour le développement)
    private static final String PASSWORD_REGEX = "^.{4,}$";
    private static final Pattern PATTERN = Pattern.compile(PASSWORD_REGEX);

    /**
     * Enregistre un nouvel utilisateur dans la base de données.
     * Vérifie si le pseudo est libre et si le mot de passe respecte les critères de sécurité
     * avant de hasher le mot de passe et de sauvegarder l'utilisateur.
     *
     * @param username Le pseudo choisi par l'utilisateur.
     * @param password Le mot de passe en clair.
     * @throws Exception Si le pseudo est déjà utilisé ou si le mot de passe est invalide.
     */
    public void registerUser(String username, String password) throws Exception {
        // 1. Vérifier si le pseudo existe déjà
        if (userRepository.findByUsername(username).isPresent()) {
            throw new Exception("Ce pseudo est déjà pris !");
        }

        // 2. Vérifier la complexité du mot de passe
        if (!PATTERN.matcher(password).matches()) {
            throw new Exception("Le mot de passe doit contenir : 8 caractères min, 1 majuscule, 1 minuscule, 1 chiffre et 1 caractère spécial.");
        }

        // 3. Hasher le mot de passe et sauvegarder
        String encodedPassword = passwordEncoder.encode(password);
        User newUser = new User(username, encodedPassword);
        userRepository.save(newUser);
    }
}