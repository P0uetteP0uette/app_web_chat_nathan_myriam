package com.example.chatapp.model;

import jakarta.persistence.*;

/**
 * Entité JPA représentant un utilisateur.
 * Mappée sur la table 'users'.
 */
@Entity
@Table(name = "users")
public class User {

    /** Identifiant unique (Clé primaire auto-générée). */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Pseudonyme de l'utilisateur (Unique et obligatoire). */
    @Column(nullable = false, unique = true)
    private String username;

    /** Mot de passe de l'utilisateur (stocké sous forme hashée). */
    @Column(nullable = false)
    private String password;

    @Column(name = "enabled")
    private boolean enabled = false; // Par défaut, le compte n'est pas activé

    /**
     * Constructeur vide requis par JPA.
     */
    public User() {}

    /**
     * Constructeur pour créer un nouvel utilisateur.
     * @param username Le pseudo.
     * @param password Le mot de passe.
     */
    public User(String username, String password) {
        this.username = username;
        this.password = password;
    }

    // --- Getters et Setters ---

    /** @return L'identifiant de l'utilisateur. */
    public Long getId() { return id; }
    /** @param id Le nouvel identifiant. */
    public void setId(Long id) { this.id = id; }

    /** @return Le pseudonyme. */
    public String getUsername() { return username; }
    /** @param username Le nouveau pseudonyme. */
    public void setUsername(String username) { this.username = username; }

    /** @return Le mot de passe hashé. */
    public String getPassword() { return password; }
    /** @param password Le nouveau mot de passe. */
    public void setPassword(String password) { this.password = password; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
}