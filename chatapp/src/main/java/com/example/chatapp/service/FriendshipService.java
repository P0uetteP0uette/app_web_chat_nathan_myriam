package com.example.chatapp.service;

import com.example.chatapp.model.Friendship;
import com.example.chatapp.model.FriendshipStatus;
import com.example.chatapp.model.User;
import com.example.chatapp.repository.FriendshipRepository;
import com.example.chatapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Service gérant la logique métier liée aux relations d'amitié.
 *
 * Ce service permet de vérifier le statut d'une relation entre deux utilisateurs
 * et de gérer l'envoi de nouvelles demandes d'ajout.
 */
@Service
public class FriendshipService {

    @Autowired
    private FriendshipRepository friendshipRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Vérifie si deux utilisateurs sont amis confirmés (statut ACCEPTED).
     *
     * @param username1 Pseudo du premier utilisateur.
     * @param username2 Pseudo du second utilisateur.
     * @return true si une amitié validée existe entre les deux, false sinon.
     */
    public boolean areFriends(String username1, String username2) {
        User u1 = userRepository.findByUsername(username1).orElse(null);
        User u2 = userRepository.findByUsername(username2).orElse(null);

        if (u1 == null || u2 == null) {
            return false;
        }

        // Recherche d'une relation existante peu importe la direction (expéditeur/destinataire)
        Optional<Friendship> friendshipOpt = friendshipRepository.findFriendshipBetween(u1, u2);

        if (friendshipOpt.isPresent()) {
            Friendship friendship = friendshipOpt.get();
            return friendship.getStatus() == FriendshipStatus.ACCEPTED;
        }

        return false;
    }

    /**
     * Tente d'envoyer une demande d'ami d'un utilisateur à un autre.
     *
     * La méthode vérifie d'abord l'existence des utilisateurs et s'assure
     * qu'aucune relation (en attente ou acceptée) n'existe déjà entre eux.
     *
     * @param senderUsername Pseudo de l'expéditeur de la demande.
     * @param receiverUsername Pseudo du destinataire.
     * @return true si la demande a été créée avec succès, false sinon (utilisateurs introuvables ou relation existante).
     */
    public boolean sendRequest(String senderUsername, String receiverUsername) {
        Optional<User> senderOpt = userRepository.findByUsername(senderUsername);
        Optional<User> receiverOpt = userRepository.findByUsername(receiverUsername);

        if (senderOpt.isEmpty() || receiverOpt.isEmpty()) {
            return false;
        }

        User sender = senderOpt.get();
        User receiver = receiverOpt.get();

        // Vérification si une relation existe déjà (dans un sens ou dans l'autre)
        boolean alreadyLinked = friendshipRepository.existsByRequesterAndFriend(sender, receiver) 
                             || friendshipRepository.existsByRequesterAndFriend(receiver, sender);

        if (alreadyLinked) {
            return false; 
        }

        // Création de la nouvelle demande (Statut par défaut défini dans le constructeur ou l'entité)
        Friendship newFriendship = new Friendship(sender, receiver);
        friendshipRepository.save(newFriendship);

        return true;
    }
}