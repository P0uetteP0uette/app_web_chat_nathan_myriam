package com.example.chatapp.repository;

import com.example.chatapp.model.VerificationToken;
import com.example.chatapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {
    VerificationToken findByToken(String token);
    VerificationToken findByUser(User user);
}