package com.example.chatapp.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entité représentant le jeton de validation envoyé par email.
 * Lie un utilisateur à un code unique temporaire.
 */
@Entity
public class VerificationToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Le token unique (ex: "550e8400-e29b...")
    private String token;

    // L'utilisateur lié à ce token
    @OneToOne(targetEntity = User.class, fetch = FetchType.EAGER)
    @JoinColumn(nullable = false, name = "user_id")
    private User user;

    // Date d'expiration du lien
    private LocalDateTime expiryDate;

    public VerificationToken() {}

    public VerificationToken(User user) {
        this.user = user;
        this.expiryDate = LocalDateTime.now().plusHours(24); // Valide 24h
        this.token = UUID.randomUUID().toString(); // Génère un code aléatoire
    }

    // Getters et Setters
    public Long getId() { return id; }
    public String getToken() { return token; }
    public User getUser() { return user; }
    public LocalDateTime getExpiryDate() { return expiryDate; }
    
    public void setToken(String token) { this.token = token; }
    public void setUser(User user) { this.user = user; }
    public void setExpiryDate(LocalDateTime expiryDate) { this.expiryDate = expiryDate; }
}