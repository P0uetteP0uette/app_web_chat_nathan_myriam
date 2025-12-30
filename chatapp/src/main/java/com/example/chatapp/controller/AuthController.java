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

    @GetMapping("/login")
    public String loginPage() {
        return "login";
    }

    @GetMapping("/register")
    public String registerPage() {
        return "register";
    }

    @PostMapping("/register")
    public String registerUser(@RequestParam String username, @RequestParam String password, Model model) {
        try {
            userService.registerUser(username, password);
            // On renvoie vers login avec un message demandant de vérifier les mails
            model.addAttribute("success", "Compte créé ! Vérifiez vos emails pour l'activer.");
            return "login";
        } catch (Exception e) {
            model.addAttribute("error", e.getMessage());
            return "register";
        }
    }

    // --- C'EST ICI QUE ÇA SE JOUE ---
    @GetMapping("/activate")
    public String activateAccount(@RequestParam String token, Model model) {
        System.out.println("=============================================");
        System.out.println(">>> CLIC REÇU ! TENTATIVE D'ACTIVATION DU TOKEN : " + token);
        
        try {
            userService.activateAccount(token);
            System.out.println(">>> SUCCÈS : COMPTE ACTIVÉ DANS LA BDD !");
            return "redirect:/login?activated"; 
        } catch (Exception e) {
            System.out.println(">>> ÉCHEC ACTIVATION : " + e.getMessage());
            e.printStackTrace();
            model.addAttribute("error", "Le lien d'activation est invalide ou a expiré.");
            return "login";
        }
    }
}