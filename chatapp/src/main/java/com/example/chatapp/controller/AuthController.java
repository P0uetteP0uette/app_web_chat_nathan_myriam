package com.example.chatapp.controller;

import com.example.chatapp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

/**
 * Contrôleur gérant le processus d'authentification et d'inscription.
 *
 * Il gère l'affichage des formulaires (login/register), le traitement de la création
 * de compte et la validation finale via le lien envoyé par email.
 */
@Controller
public class AuthController {

    @Autowired
    private UserService userService;

    /**
     * Affiche la page de connexion.
     *
     * @return Le nom de la vue (template) "login".
     */
    @GetMapping("/login")
    public String loginPage() {
        return "login";
    }

    /**
     * Affiche la page d'inscription.
     *
     * @return Le nom de la vue (template) "register".
     */
    @GetMapping("/register")
    public String registerPage() {
        return "register";
    }

    /**
     * Traite la soumission du formulaire d'inscription.
     *
     * Cette méthode appelle le service pour créer l'utilisateur (validation mdp, hashage).
     * En cas de succès, elle renvoie vers la page de login avec une instruction de vérification d'email.
     * En cas d'erreur (pseudo pris, mot de passe trop simple), elle renvoie le formulaire avec le message d'erreur.
     *
     * @param username Le pseudo choisi par l'utilisateur.
     * @param password Le mot de passe choisi.
     * @param model Le modèle pour transmettre les messages de succès ou d'erreur à la vue.
     * @return La vue suivante (login ou register).
     */
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

    /**
     * Gère l'activation du compte lorsqu'un utilisateur clique sur le lien reçu par email.
     *
     * Cette méthode récupère le token dans l'URL, tente d'activer le compte via le service,
     * et redirige l'utilisateur vers la page de connexion.
     *
     * @param token Le jeton de validation unique extrait de l'URL.
     * @param model Le modèle pour afficher les erreurs en cas de lien invalide.
     * @return Une redirection vers la page de login (avec paramètre de succès ou message d'erreur).
     */
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