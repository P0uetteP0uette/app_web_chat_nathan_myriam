package com.example.chatapp.repository;

import com.example.chatapp.model.VerificationToken;
import com.example.chatapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Interface d'accès aux données pour les jetons de vérification.
 *
 * Elle permet de gérer le cycle de vie des tokens d'activation envoyés par email,
 * en offrant des méthodes pour les retrouver par leur valeur ou par l'utilisateur associé.
 */
public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {

    /**
     * Recherche un jeton de vérification spécifique.
     *
     * @param token La chaîne de caractères du token (reçu par email).
     * @return L'objet VerificationToken correspondant, ou null s'il n'existe pas.
     */
    VerificationToken findByToken(String token);

    /**
     * Retrouve le jeton associé à un utilisateur donné.
     * Utile pour vérifier si un utilisateur a déjà une demande d'activation en cours.
     *
     * @param user L'utilisateur concerné.
     * @return Le jeton associé à cet utilisateur, ou null.
     */
    VerificationToken findByUser(User user);
}