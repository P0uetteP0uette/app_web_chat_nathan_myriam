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

@Controller
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FriendshipRepository friendshipRepository;

    @GetMapping("/find-friends")
    public String findFriends(@RequestParam(required = false) String search, Model model, Principal principal) {
        String myUsername = principal.getName();
        User me = userRepository.findByUsername(myUsername).orElseThrow();

        // --- 1. RÉCUPÉRER MES AMIS (NOUVEAU) ---
        List<Friendship> friendships = friendshipRepository.findAllFriendsOf(me);
        List<User> myFriends = new ArrayList<>();
        
        for (Friendship f : friendships) {
            // Si je suis le demandeur, l'ami est 'friend', sinon c'est 'requester'
            if (f.getRequester().equals(me)) {
                myFriends.add(f.getFriend());
            } else {
                myFriends.add(f.getRequester());
            }
        }

        // --- 2. RECHERCHE D'UTILISATEURS (Comme avant) ---
        List<UserDTO> userResults = new ArrayList<>();
        if (search != null && !search.isEmpty()) {
            List<User> foundUsers = userRepository.findByUsernameContainingIgnoreCaseAndUsernameNot(search, myUsername);

            for (User u : foundUsers) {
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
        List<Friendship> receivedRequests = friendshipRepository.findByFriendAndStatus(me, FriendshipStatus.WAITING);

        // --- ENVOI A LA VUE ---
        model.addAttribute("myFriends", myFriends); // <--- On ajoute la liste d'amis
        model.addAttribute("users", userResults);
        model.addAttribute("search", search);
        model.addAttribute("requests", receivedRequests);

        return "find-friends";
    }

    // --- ENVOYER UNE DEMANDE ---
    @PostMapping("/add-friend")
    public String sendRequest(@RequestParam String username, Principal principal) {
        String myUsername = principal.getName();
        User me = userRepository.findByUsername(myUsername).orElseThrow();
        Optional<User> potentialFriend = userRepository.findByUsername(username);

        if (potentialFriend.isPresent()) {
            User friend = potentialFriend.get();

            // On vérifie que le lien n'existe pas déjà (peu importe le sens pour simplifier ici)
            if (!friendshipRepository.existsByRequesterAndFriend(me, friend) && 
                !friendshipRepository.existsByRequesterAndFriend(friend, me)) {
                
                // On crée avec le statut PENDING (défini dans le constructeur)
                Friendship newFriendship = new Friendship(me, friend);
                friendshipRepository.save(newFriendship);
                System.out.println(">>> DEMANDE D'AMI ENVOYÉE DE " + myUsername + " A " + username);
            }
        }
        return "redirect:/find-friends?sent";
    }

    // --- ACCEPTER UNE DEMANDE ---
    @PostMapping("/accept-friend")
    public String acceptRequest(@RequestParam Long friendshipId) {
        // On récupère la demande via son ID
        Optional<Friendship> friendshipOpt = friendshipRepository.findById(friendshipId);

        if (friendshipOpt.isPresent()) {
            Friendship friendship = friendshipOpt.get();
            friendship.setStatus(FriendshipStatus.ACCEPTED); // ON VALIDE !
            friendshipRepository.save(friendship);
            System.out.println(">>> AMITIÉ ACCEPTÉE !");
        }
        return "redirect:/find-friends?accepted";
    }
}