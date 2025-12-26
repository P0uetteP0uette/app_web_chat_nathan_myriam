package com.example.chatapp.service;

import com.example.chatapp.model.User;
import com.example.chatapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Regex pour : Min 8 char, 1 maj, 1 min, 1 chiffre, 1 char spécial
    //private static final String PASSWORD_REGEX = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$";
    
    // Version simplifiée pour le dev (accepte tout tant que c'est > 3 caractères)
    private static final String PASSWORD_REGEX = "^.{4,}$";
    private static final Pattern PATTERN = Pattern.compile(PASSWORD_REGEX);

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