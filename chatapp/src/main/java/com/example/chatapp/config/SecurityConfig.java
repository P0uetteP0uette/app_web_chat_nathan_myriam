package com.example.chatapp.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests((requests) -> requests
                .requestMatchers("/", "/register", "/css/**", "/js/**").permitAll() // Autorise l'accès à l'accueil et l'inscription
                .anyRequest().authenticated() // Le reste nécessite d'être connecté (on verra ça après)
            )
            .formLogin((form) -> form.disable()) // On désactive le formulaire par défaut pour l'instant
            .csrf((csrf) -> csrf.disable()); // Désactive CSRF pour simplifier les tests (à réactiver en prod)

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(); // C'est ici qu'on définit l'outil de hachage
    }
}