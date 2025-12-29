package com.example.chatapp.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Configuration principale de la sécurité de l'application.
 * Gère les permissions d'accès, le formulaire de connexion et le cryptage.
 */
@Configuration
public class SecurityConfig {

    /**
     * Configure la chaîne de filtres de sécurité HTTP.
     * Définit l'accès public pour l'inscription, exige l'authentification pour le reste
     * et configure le formulaire de login personnalisé.
     *
     * @param http L'objet de configuration de la sécurité web.
     * @return La chaîne de filtres de sécurité construite.
     * @throws Exception En cas d'erreur lors de la configuration.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) 
            .authorizeHttpRequests((requests) -> requests
                .requestMatchers("/register", "/css/**", "/js/**").permitAll()
                .anyRequest().authenticated()
            )
            .formLogin((form) -> form
                .loginPage("/login")
                .defaultSuccessUrl("/", true)
                .permitAll()
            )
            .logout((logout) -> logout.permitAll());

        return http.build();
    }

    /**
     * Définit le bean responsable du hachage des mots de passe.
     * Utilise l'algorithme BCrypt.
     *
     * @return L'instance de l'encodeur de mot de passe.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    /**
     * Expose le gestionnaire d'authentification pour Spring Security.
     *
     * @param authenticationConfiguration La configuration d'authentification injectée.
     * @return Le gestionnaire d'authentification.
     * @throws Exception Si le gestionnaire ne peut pas être récupéré.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
}