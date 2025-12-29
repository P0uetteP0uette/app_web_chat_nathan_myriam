package com.example.chatapp.controller;

import com.example.chatapp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

/**
 * Contrôleur gérant les fonctionnalités d'authentification (Inscription et Connexion).
 * S'occupe de l'affichage des formulaires et du traitement de l'enregistrement des utilisateurs.
 */
@Controller
public class AuthController {

    @Autowired
    private UserService userService;

    /**
     * Affiche la page contenant le formulaire d'inscription.
     *
     * @return Le nom de la vue Thymeleaf "register".
     */
    @GetMapping("/register")
    public String showRegisterForm() {
        return "register";
    }

    /**
     * Traite la soumission du formulaire d'inscription.
     * Tente d'enregistrer l'utilisateur via le service. Si l'opération réussit,
     * l'utilisateur est redirigé vers l'accueil. Sinon, le formulaire est réaffiché avec une erreur.
     *
     * @param username Le nom d'utilisateur souhaité.
     * @param password Le mot de passe choisi.
     * @param model Le modèle UI pour transmettre les messages d'erreur à la vue.
     * @return Une redirection vers l'accueil ou le nom de la vue "register" en cas d'erreur.
     */
    @PostMapping("/register")
    public String registerUser(@RequestParam String username, 
                               @RequestParam String password, 
                               Model model) {
        try {
            userService.registerUser(username, password);
            return "redirect:/?success"; // Redirige vers l'accueil si ça marche
        } catch (Exception e) {
            model.addAttribute("error", e.getMessage()); // Affiche l'erreur si ça rate
            return "register";
        }
    }

    /**
     * Affiche la page de connexion personnalisée.
     * La logique de connexion elle-même est gérée automatiquement par Spring Security via la configuration.
     *
     * @return Le nom de la vue Thymeleaf "login".
     */
    @GetMapping("/login")
    public String showLoginForm() {
        return "login";
    }
}