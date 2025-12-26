package com.example.chatapp.controller;

import com.example.chatapp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class AuthController {

    @Autowired
    private UserService userService;

    // Affiche la page d'inscription
    @GetMapping("/register")
    public String showRegisterForm() {
        return "register";
    }

    // Traite le formulaire
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

    @GetMapping("/login")
    public String showLoginForm() {
        return "login";
    }
}