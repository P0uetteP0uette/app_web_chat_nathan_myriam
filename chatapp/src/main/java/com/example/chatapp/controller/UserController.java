package com.example.chatapp.controller;

import com.example.chatapp.model.Friendship;
import com.example.chatapp.model.FriendshipStatus;
import com.example.chatapp.model.User;
import com.example.chatapp.model.UserDTO;
import com.example.chatapp.repository.FriendshipRepository;
import com.example.chatapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.security.Principal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Contrôleur gérant les interactions liées aux utilisateurs et aux amis.
 *
 * Ce contrôleur gère la page de recherche d'amis, l'affichage de la liste d'amis,
 * ainsi que l'envoi, l'acceptation et le refus des demandes d'amitié.
 */
@Controller
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FriendshipRepository friendshipRepository;

    /**
     * Affiche la page "Trouver des amis".
     *
     * Cette méthode prépare toutes les données nécessaires pour la vue :
     * 1. La liste des amis actuels de l'utilisateur connecté.
     * 2. Les résultats de recherche si un terme est fourni.
     * 3. Les demandes d'amitié reçues et en attente.
     *
     * @param search Le terme de recherche (pseudo) saisi par l'utilisateur (optionnel).
     * @param model Le modèle Spring pour passer les données à la vue.
     * @param principal L'objet de sécurité contenant les infos de l'utilisateur connecté.
     * @return Le nom de la vue à afficher (find-friends).
     */
    @GetMapping("/find-friends")
    public String findFriends(@RequestParam(required = false) String search, Model model, Principal principal) {
        String myUsername = principal.getName();
        User me = userRepository.findByUsername(myUsername).orElseThrow();

        model.addAttribute("username", myUsername);

        // --- 1. RÉCUPÉRER MES AMIS ---
        List<Friendship> friendships = friendshipRepository.findAllFriendsOf(me);
        List<User> myFriends = new ArrayList<>();
        
        for (Friendship f : friendships) {
            // Dans une relation d'amitié, je peux être soit le demandeur, soit le receveur.
            // On ajoute l'autre personne à la liste.
            if (f.getRequester().equals(me)) {
                myFriends.add(f.getFriend());
            } else {
                myFriends.add(f.getRequester());
            }
        }

        // --- 2. RECHERCHE D'UTILISATEURS ---
        List<UserDTO> userResults = new ArrayList<>();
        if (search != null && !search.isEmpty()) {
            // Recherche insensible à la casse et exclusion de soi-même
            List<User> foundUsers = userRepository.findByUsernameContainingIgnoreCaseAndUsernameNot(search, myUsername);

            for (User u : foundUsers) {
                // On vérifie s'il existe déjà un lien (ami ou demande en cours) pour adapter l'affichage
                Optional<Friendship> link = friendshipRepository.findFriendshipBetween(me, u);
                String status = "NONE"; 
                
                if (link.isPresent()) {
                    Friendship f = link.get();
                    if (f.getStatus() == FriendshipStatus.ACCEPTED) {
                        status = "FRIEND";
                    } else if (f.getStatus() == FriendshipStatus.WAITING) {
                        status = "WAITING";
                    }
                }
                userResults.add(new UserDTO(u, status));
            }
        }

        // --- 3. DEMANDES REÇUES ---
        // Récupère uniquement les demandes où je suis le destinataire et qui sont "En attente"
        List<Friendship> receivedRequests = friendshipRepository.findByFriendAndStatus(me, FriendshipStatus.WAITING);

        // --- ENVOI A LA VUE ---
        model.addAttribute("myFriends", myFriends);
        model.addAttribute("users", userResults);
        model.addAttribute("search", search);
        model.addAttribute("requests", receivedRequests);

        return "find-friends";
    }

    /**
     * Envoie une demande d'ami à un autre utilisateur.
     *
     * @param username Le pseudo de l'utilisateur à ajouter.
     * @param principal L'utilisateur connecté.
     * @return Redirection vers la page de recherche avec un paramètre de succès.
     */
    @PostMapping("/add-friend")
    public String sendRequest(@RequestParam String username, Principal principal) {
        String myUsername = principal.getName();
        User me = userRepository.findByUsername(myUsername).orElseThrow();
        Optional<User> potentialFriend = userRepository.findByUsername(username);

        if (potentialFriend.isPresent()) {
            User friend = potentialFriend.get();

            // Vérification de sécurité : le lien ne doit pas déjà exister (dans un sens ou l'autre)
            if (!friendshipRepository.existsByRequesterAndFriend(me, friend) && 
                !friendshipRepository.existsByRequesterAndFriend(friend, me)) {
                
                // Création de la relation avec le statut initial (WAITING par défaut dans le constructeur)
                Friendship newFriendship = new Friendship(me, friend);
                friendshipRepository.save(newFriendship);
            }
        }
        return "redirect:/find-friends?sent";
    }

    /**
     * Accepte une demande d'ami reçue.
     *
     * @param friendshipId L'ID de la relation d'amitié à valider.
     * @return Redirection vers la page de recherche avec un paramètre de succès.
     */
    @PostMapping("/accept-friend")
    public String acceptRequest(@RequestParam Long friendshipId) {
        Optional<Friendship> friendshipOpt = friendshipRepository.findById(friendshipId);

        if (friendshipOpt.isPresent()) {
            Friendship friendship = friendshipOpt.get();
            friendship.setStatus(FriendshipStatus.ACCEPTED);
            friendshipRepository.save(friendship);
        }
        return "redirect:/find-friends?accepted";
    }

    /**
     * Refuse une demande d'ami reçue.
     *
     * Cette action supprime définitivement la ligne de la base de données,
     * permettant éventuellement une nouvelle demande future.
     *
     * @param friendshipId L'ID de la relation d'amitié à supprimer.
     * @return Redirection vers la page de recherche avec un paramètre de refus.
     */
    @PostMapping("/refuse-friend")
    public String refuseRequest(@RequestParam Long friendshipId) {
        friendshipRepository.deleteById(friendshipId);
        return "redirect:/find-friends?refused";
    }
}