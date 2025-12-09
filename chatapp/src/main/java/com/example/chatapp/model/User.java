package com.example.chatapp.model;

import jakarta.persistence.*;

@Entity // Indique à Spring que cette classe correspond à une table
@Table(name = "users") // Nom de la table dans la BDD
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true) // Pseudo obligatoire et unique
    private String username;

    @Column(nullable = false)
    private String password; // On stockera le mot de passe hashé ici

    // Constructeurs
    public User() {}

    public User(String username, String password) {
        this.username = username;
        this.password = password;
    }

    // Getters et Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}