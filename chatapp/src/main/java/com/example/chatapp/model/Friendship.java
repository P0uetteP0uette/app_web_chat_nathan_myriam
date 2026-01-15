package com.example.chatapp.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entité JPA représentant une relation d'amitié entre deux utilisateurs.
 *
 * Cette classe modélise le lien social, en stockant qui a fait la demande,
 * qui l'a reçue, depuis quand, et quel est l'état actuel de cette demande (en attente, acceptée, refusée).
 */
@Entity
public class Friendship {

    /**
     * Identifiant unique de la relation (Clé primaire auto-générée).
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * L'utilisateur qui est à l'origine de la demande d'ami.
     */
    @ManyToOne
    @JoinColumn(name = "requester_id")
    private User requester; 

    /**
     * L'utilisateur qui reçoit la demande d'ami.
     */
    @ManyToOne
    @JoinColumn(name = "friend_id")
    private User friend;    
    private LocalDateTime since;

    @Enumerated(EnumType.STRING)
    private FriendshipStatus status;

    /**
     * Constructeur par défaut requis par JPA.
     */
    public Friendship() {}

    /**
     * Constructeur principal pour initier une nouvelle demande d'amitié.
     *
     * Initialise automatiquement la date à l'instant présent et le statut à WAITING (En attente).
     *
     * @param requester L'utilisateur qui envoie la demande.
     * @param friend L'utilisateur destinataire.
     */
    public Friendship(User requester, User friend) {
        this.requester = requester;
        this.friend = friend;
        this.since = LocalDateTime.now();
        this.status = FriendshipStatus.WAITING; // Statut initial par défaut
    }

    // --- GETTERS & SETTERS ---

    public Long getId() { 
        return id; 
    }

    public User getRequester() { 
        return requester; 
    }

    public User getFriend() { 
        return friend; 
    }

    public FriendshipStatus getStatus() { 
        return status; 
    }

    public void setStatus(FriendshipStatus status) { 
        this.status = status; 
    }
}