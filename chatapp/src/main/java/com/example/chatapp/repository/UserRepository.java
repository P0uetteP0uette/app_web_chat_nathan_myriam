package com.example.chatapp.repository;

import com.example.chatapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

/**
 * Interface de repository pour la gestion des utilisateurs en base de données.
 * Hérite de JpaRepository pour fournir les opérations CRUD standard.
 */
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Recherche un utilisateur spécifique via son pseudonyme.
     *
     * @param username Le pseudo de l'utilisateur à rechercher.
     * @return Un Optional contenant l'utilisateur s'il est trouvé, ou vide sinon.
     */
    Optional<User> findByUsername(String username);
}