package com.example.chatapp.model;

/**
 * Objet de transfert de données (DTO) représentant un utilisateur enrichi.
 *
 * Ce DTO est utilisé pour transmettre les informations d'un utilisateur au front-end,
 * en y associant le contexte de la relation amicale (statut) vis-à-vis de l'utilisateur connecté.
 */
public class UserDTO {

    private User user;
    private String status;

    /**
     * Constructeur pour initialiser le DTO.
     *
     * @param user L'entité utilisateur contenant les infos de base (pseudo, etc.).
     * @param status Le code texte représentant l'état de l'amitié.
     */
    public UserDTO(User user, String status) {
        this.user = user;
        this.status = status;
    }

    public User getUser() { 
        return user; 
    }

    public String getStatus() { 
        return status; 
    }
}