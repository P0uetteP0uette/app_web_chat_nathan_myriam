package com.example.chatapp.service;

import com.example.chatapp.model.Friendship;
import com.example.chatapp.model.FriendshipStatus;
import com.example.chatapp.model.User;
import com.example.chatapp.repository.FriendshipRepository;
import com.example.chatapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class FriendshipService {

    @Autowired
    private FriendshipRepository friendshipRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Vérifie si deux utilisateurs (par pseudo) sont amis confirmés (ACCEPTED).
     * @param username1 Pseudo de l'expéditeur
     * @param username2 Pseudo du destinataire
     * @return true si amis, false sinon.
     */
    public boolean areFriends(String username1, String username2) {
        // 1. Récupérer les utilisateurs
        User u1 = userRepository.findByUsername(username1).orElse(null);
        User u2 = userRepository.findByUsername(username2).orElse(null);

        if (u1 == null || u2 == null) {
            return false; // L'un des deux n'existe pas
        }

        // 2. Chercher la relation (dans les deux sens grâce à ta requête @Query)
        Optional<Friendship> friendshipOpt = friendshipRepository.findFriendshipBetween(u1, u2);

        // 3. Vérifier si elle existe ET si le statut est ACCEPTED
        if (friendshipOpt.isPresent()) {
            Friendship friendship = friendshipOpt.get();
            return friendship.getStatus() == FriendshipStatus.ACCEPTED;
        }

        return false; // Pas de relation trouvée
    }

    /**
     * Tente d'envoyer une demande d'ami.
     * Renvoie TRUE si ça a marché, FALSE si c'était impossible (déjà amis, user introuvable...).
     */
    public boolean sendRequest(String senderUsername, String receiverUsername) {
        // 1. On récupère les deux utilisateurs
        Optional<User> senderOpt = userRepository.findByUsername(senderUsername);
        Optional<User> receiverOpt = userRepository.findByUsername(receiverUsername);

        // Si l'un des deux n'existe pas, on arrête
        if (senderOpt.isEmpty() || receiverOpt.isEmpty()) {
            return false;
        }

        User sender = senderOpt.get();
        User receiver = receiverOpt.get();

        // 2. On vérifie si une relation existe déjà (dans un sens OU dans l'autre)
        boolean alreadyLinked = friendshipRepository.existsByRequesterAndFriend(sender, receiver) 
                             || friendshipRepository.existsByRequesterAndFriend(receiver, sender);

        if (alreadyLinked) {
            return false; // Déjà amis ou demande déjà envoyée
        }

        // 3. On crée la demande
        // (Le statut par défaut doit être WAITING ou PENDING selon ton constructeur)
        Friendship newFriendship = new Friendship(sender, receiver);
        friendshipRepository.save(newFriendship);

        return true;
    }
}