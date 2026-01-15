package com.example.chatapp.model;

import jakarta.persistence.*;

/**
 * Entité JPA représentant un utilisateur de l'application.
 *
 * Cette classe stocke les informations d'identification (pseudo, mot de passe)
 * et l'état du compte (activé ou non).
 */
@Entity
@Table(name = "users")
public class User {

    /**
     * Identifiant unique de l'utilisateur (Clé primaire auto-générée).
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Pseudonyme de l'utilisateur.
     * Ce champ est obligatoire et doit être unique dans la base de données.
     */
    @Column(nullable = false, unique = true)
    private String username;

    /**
     * Mot de passe de l'utilisateur.
     * Il est stocké sous forme chiffrée (hash) pour des raisons de sécurité.
     */
    @Column(nullable = false)
    private String password;

    /**
     * État d'activation du compte.
     * Vaut false par défaut tant que l'utilisateur n'a pas validé son email.
     */
    @Column(name = "enabled")
    private boolean enabled = false;

    /**
     * Constructeur par défaut requis par la spécification JPA.
     */
    public User() {}

    /**
     * Constructeur principal pour créer un nouvel utilisateur.
     *
     * @param username Le pseudonyme choisi.
     * @param password Le mot de passe (qui doit être chiffré avant d'être passé ici).
     */
    public User(String username, String password) {
        this.username = username;
        this.password = password;
    }

    public Long getId() { 
        return id; 
    }

    public void setId(Long id) { 
        this.id = id; 
    }

    public String getUsername() { 
        return username; 
    }

    public void setUsername(String username) { 
        this.username = username; 
    }

    public String getPassword() { 
        return password; 
    }

    public void setPassword(String password) { 
        this.password = password; 
    }

    public boolean isEnabled() { 
        return enabled; 
    }

    public void setEnabled(boolean enabled) { 
        this.enabled = enabled; 
    }
}