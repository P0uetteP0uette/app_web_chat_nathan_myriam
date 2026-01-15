package com.example.chatapp.repository;

import com.example.chatapp.model.Friendship;
import com.example.chatapp.model.FriendshipStatus;
import com.example.chatapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * Interface d'accès aux données pour les relations d'amitié.
 *
 * Cette interface gère les interactions avec la base de données concernant
 * les demandes d'amis, les acceptations et la liste des amis d'un utilisateur.
 */
public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    /**
     * Vérifie si une demande d'amitié spécifique existe déjà dans ce sens précis.
     *
     * @param requester L'utilisateur qui a envoyé la demande.
     * @param friend L'utilisateur qui a reçu la demande.
     * @return true si la relation existe, false sinon.
     */
    boolean existsByRequesterAndFriend(User requester, User friend);
    
    /**
     * Récupère la liste des demandes reçues par un utilisateur avec un statut donné.
     * Généralement utilisé pour afficher les demandes en attente (WAITING).
     *
     * @param friend L'utilisateur destinataire des demandes.
     * @param status Le statut recherché (ex: FriendshipStatus.WAITING).
     * @return Une liste de relations d'amitié correspondant aux critères.
     */
    List<Friendship> findByFriendAndStatus(User friend, FriendshipStatus status);

    /**
     * Recherche une relation d'amitié entre deux utilisateurs, quelle que soit la direction.
     *
     * Cette méthode est utile pour vérifier si deux personnes sont liées,
     * que la demande vienne de l'utilisateur A vers B ou de B vers A.
     *
     * @param u1 Le premier utilisateur.
     * @param u2 Le second utilisateur.
     * @return Un Optional contenant la relation trouvée, ou vide si aucune relation n'existe.
     */
    @Query("SELECT f FROM Friendship f WHERE (f.requester = :u1 AND f.friend = :u2) OR (f.requester = :u2 AND f.friend = :u1)")
    Optional<Friendship> findFriendshipBetween(@Param("u1") User u1, @Param("u2") User u2);
    
    /**
     * Récupère tous les amis confirmés d'un utilisateur.
     *
     * Cette requête sélectionne toutes les relations où l'utilisateur est soit l'expéditeur,
     * soit le destinataire, et où le statut est strictement 'ACCEPTED'.
     *
     * @param user L'utilisateur dont on veut les amis.
     * @return La liste des amitiés confirmées.
     */
    @Query("SELECT f FROM Friendship f WHERE (f.requester = :user OR f.friend = :user) AND f.status = 'ACCEPTED'")
    List<Friendship> findAllFriendsOf(@Param("user") User user);

    /**
     * Compte le nombre de relations reçues ayant un statut spécifique.
     * Principalement utilisé pour afficher le nombre de notifications (demandes en attente).
     *
     * @param friend L'utilisateur destinataire.
     * @param status Le statut à compter (ex: WAITING).
     * @return Le nombre total de demandes correspondantes.
     */
    long countByFriendAndStatus(User friend, FriendshipStatus status);
}