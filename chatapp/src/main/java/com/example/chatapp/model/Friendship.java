package com.example.chatapp.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Friendship {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "requester_id")
    private User requester; // Celui qui demande

    @ManyToOne
    @JoinColumn(name = "friend_id")
    private User friend;    // Celui qui reçoit la demande

    private LocalDateTime since;

    // --- NOUVEAU CHAMP ---
    @Enumerated(EnumType.STRING)
    private FriendshipStatus status;

    public Friendship() {}

    public Friendship(User requester, User friend) {
        this.requester = requester;
        this.friend = friend;
        this.since = LocalDateTime.now();
        this.status = FriendshipStatus.WAITING; // Par défaut, c'est EN ATTENTE
    }

    // Getters et Setters
    public Long getId() { return id; }
    public User getRequester() { return requester; }
    public User getFriend() { return friend; }
    public FriendshipStatus getStatus() { return status; } // Nouveau getter

    public void setStatus(FriendshipStatus status) { this.status = status; } // Nouveau setter
}