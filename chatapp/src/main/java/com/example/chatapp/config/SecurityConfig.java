package com.example.chatapp.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Classe de configuration principale de la sécurité Spring Security.
 *
 * Elle définit les règles d'accès aux différentes pages (URL), la gestion du formulaire de connexion,
 * la gestion de la déconnexion et les mécanismes de chiffrement des mots de passe.
 */
@Configuration
public class SecurityConfig {

    /**
     * Configure la chaîne de filtres de sécurité HTTP (SecurityFilterChain).
     *
     * Cette méthode définit :
     * 1. La désactivation du CSRF (pour simplifier le développement ou l'usage API).
     * 2. Les routes publiques (login, register, assets) vs les routes protégées.
     * 3. La page de login personnalisée.
     * 4. Le comportement de déconnexion.
     *
     * @param http L'objet HttpSecurity permettant de construire la configuration.
     * @return La chaîne de filtres construite.
     * @throws Exception En cas d'erreur lors de la configuration de la sécurité.
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // 1. Désactivation de la protection CSRF
            // (Souvent désactivé pour les API ou pour simplifier les tests en développement)
            .csrf(AbstractHttpConfigurer::disable) 

            // 2. Gestion des autorisations d'accès (ACL)
            .authorizeHttpRequests(auth -> auth
                // Pages et ressources accessibles à tous (sans connexion)
                .requestMatchers("/register", "/login", "/css/**", "/js/**", "/activate", "/sounds/**").permitAll()
                
                // Toutes les autres requêtes nécessitent d'être authentifié
                .anyRequest().authenticated()
            )
            // 3. Configuration du formulaire de Login
            .formLogin(form -> form
                .loginPage("/login") // URL de notre page de login personnalisée (AuthController)
                .defaultSuccessUrl("/", true) // Redirection vers l'accueil après succès
                .permitAll()
            )
            // 4. Configuration du Logout
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/login?logout") // Redirection après déconnexion
                .permitAll()
            );

        return http.build();
    }

    /**
     * Définit l'encodeur de mots de passe à utiliser dans l'application.
     *
     * @return Une instance de BCryptPasswordEncoder (algorithme de hachage fort et standard).
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Expose le gestionnaire d'authentification (AuthenticationManager) en tant que Bean.
     *
     * Cela permet d'injecter l'AuthenticationManager dans d'autres services si nécessaire
     * (par exemple pour authentifier un utilisateur manuellement après l'inscription).
     *
     * @param configuration La configuration d'authentification Spring.
     * @return Le gestionnaire d'authentification.
     * @throws Exception En cas d'erreur lors de la récupération du manager.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }
}