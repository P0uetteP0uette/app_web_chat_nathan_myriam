package com.example.chatapp.model;

/**
 * Enumération des types de messages WebSocket pour distinguer les actions (chat, connexion, etc.).
 */
public enum MessageType {
    CHAT,   // Message textuel standard
    JOIN,   // Connexion d'un utilisateur
    LEAVE,  // Déconnexion d'un utilisateur
    STATUS  // Changement de statut (ex: Occupé)
}