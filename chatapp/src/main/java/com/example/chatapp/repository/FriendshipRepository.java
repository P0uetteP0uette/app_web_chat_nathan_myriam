package com.example.chatapp.repository;

import com.example.chatapp.model.Friendship;
import com.example.chatapp.model.FriendshipStatus;
import com.example.chatapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query; // <--- Import Important
import org.springframework.data.repository.query.Param; // <--- Import Important

import java.util.List;
import java.util.Optional;

public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    // Vérifie si le lien existe déjà (dans un sens simple)
    boolean existsByRequesterAndFriend(User requester, User friend);
    
    // Trouver les demandes reçues qui sont encore "WAITING"
    List<Friendship> findByFriendAndStatus(User friend, FriendshipStatus status);

    // --- LA MÉTHODE MANQUANTE ---
    // Elle cherche s'il existe une relation entre u1 et u2, peu importe qui a fait la demande.
    @Query("SELECT f FROM Friendship f WHERE (f.requester = :u1 AND f.friend = :u2) OR (f.requester = :u2 AND f.friend = :u1)")
    Optional<Friendship> findFriendshipBetween(@Param("u1") User u1, @Param("u2") User u2);
    
    // Trouver TOUS les amis confirmés (optionnel pour l'instant, mais utile pour plus tard)
    @Query("SELECT f FROM Friendship f WHERE (f.requester = :user OR f.friend = :user) AND f.status = 'ACCEPTED'")
    List<Friendship> findAllFriendsOf(@Param("user") User user);
}