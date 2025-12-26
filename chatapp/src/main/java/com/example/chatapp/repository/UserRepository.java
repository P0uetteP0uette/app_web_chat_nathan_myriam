package com.example.chatapp.repository;

import com.example.chatapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    // Cette méthode permet de trouver un utilisateur par son pseudo
    Optional<User> findByUsername(String username);
}