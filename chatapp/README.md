# 💬 Application Web de Chat

## 👥 Auteurs
- **Nathan Lyonnet**
- **Myriam Laborde Boy**

---

# 📅 Livrable 1 : Itération MVP

## 🧭 Présentation du projet

Ce projet s’inscrit dans le cadre du **Challenge Technique ESIEA – Projet Java**.  
L’objectif global est de concevoir une **application web de communication textuelle** en **Java Spring Boot**, permettant aux utilisateurs de discuter en temps réel dans un canal commun.

Cette première itération correspond à la **version MVP** (Minimum Viable Product), dont le but est de permettre aux utilisateurs :
- de rejoindre un chat via un **pseudonyme temporaire**,  
- d’envoyer et recevoir des messages en **temps réel**,  
- et de **quitter le chat** à tout moment.

## 🎯 Objectifs pédagogiques

- Travailler en **binôme** avec gestion Git professionnelle.
- Mettre en œuvre une **architecture MVC claire**.
- Comprendre les bases de la **communication en temps réel (WebSocket)**.
- Respecter les **bonnes pratiques de codage** et la **sécurisation des entrées**.
- Produire une **documentation complète** (README, commentaires, versioning).

## ⚙️ Technologies utilisées

| Technologie | Rôle |
|--------------|------|
| **Java 17** | Langage principal |
| **Spring Boot 3.3.x** | Framework de développement |
| **Spring WebSocket (STOMP + SockJS)** | Communication en temps réel |
| **Maven** | Gestionnaire de dépendances |
| **HTML / CSS / JavaScript** | Interface utilisateur |
| **VS Code** | IDE |
| **GitLab** | Hébergement du dépôt et collaboration |
| **SonarQube (optionnel)** | Analyse de la qualité du code |

### 💡 Description des composants

| Couche | Rôle |
|--------|------|
| **Model** | Contient les classes métier (ici : `ChatMessage`). |
| **Controller** | Gère les échanges entre client et serveur via WebSocket. |
| **Service** | Contient la logique applicative (stockage temporaire). |
| **View** | Interface HTML/JS qui communique via WebSocket. |

## 💬 Fonctionnalités de l’itération 1

### ✅ Fonctionnelles

1. **Connexion via pseudonyme temporaire**
   - L’utilisateur entre un pseudonyme non vide.
   - Il accède ensuite au canal commun.

2. **Canal de discussion commun**
   - Envoi de messages visibles par tous en temps réel.
   - Affichage des messages reçus avec :
     - le **pseudonyme de l’expéditeur**,
     - l’**heure d’envoi**,
     - le **contenu du message**.

3. **Déconnexion**
   - L’utilisateur peut quitter le chat et revenir à la page d’accueil.

### ⚙️ Techniques

- Communication en **temps réel** via **Spring WebSocket** (STOMP + SockJS).
- **Stockage temporaire** des messages en mémoire (pas de BDD pour cette version).
- **Validation des entrées** côté client et serveur.
- **Protection minimale contre XSS** (échappement des caractères spéciaux).
- **Interface responsive et minimaliste.**

## 🔒 Sécurité

- Vérification du pseudonyme non vide avant connexion.
- Nettoyage des messages côté serveur pour éviter le script injection (XSS).
- Empêchement d’envoi de messages vides.
- Aucun stockage persistant (pas de fuite de données).

# 📅 Livrable 2

## Évolution du projet

Cette seconde itération fait évoluer le MVP vers une application robuste en intégrant une **base de données relationnelle** et un système d'**authentification sécurisé**. L'anonymat laisse place à des comptes utilisateurs persistants et l'interface s'enrichit d'une gestion dynamique des présences.

## 🎯 Nouveaux Objectifs pédagogiques

- Mettre en place une base de données **MySQL**.
- Utiliser **Spring Data JPA** pour la persistance des données.
- Sécuriser l'application avec **Spring Security** (Inscription/Connexion).
- Gérer les événements WebSocket avancés (Connexion/Déconnexion).

## ⚙️ Nouvelles Technologies intégrées

| Technologie | Rôle |
|--------------|------|
| **MySQL** | Base de données relationnelle (via XAMPP) |
| **Spring Data JPA** | Gestion de la persistance (Hibernate) |
| **Spring Security** | Gestion de l'authentification et hachage |
| **Thymeleaf Extras** | Intégration de la sécurité dans les vues |

## ✨ Fonctionnalités implémentées

### 🔐 Authentification & Sécurité
- **Gestion des utilisateurs** : Inscription et Connexion.
- **Sécurité des mots de passe** : Hashing automatique avec **BCrypt** (Spring Security).
- **Protection XSS** : Les messages sont nettoyés côté client (JavaScript) avant d'être affichés pour empêcher l'injection de scripts malveillants (ex: `<script>alert('Hack')</script>`).
- **Protection des routes** : Redirection automatique vers le login si l'utilisateur n'est pas connecté.

### 🧪 Qualité & Tests
- **Tests Unitaires** : Intégration de **JUnit 5**.
- **Couverture** : Test de l'entité `Message` (`MessageTest.java`) pour vérifier la cohérence des données (constructeurs, getters, setters) avant persistance.

### 💬 Chat Temps Réel
- **Chat Public** : Diffusion instantanée via WebSocket.
- **Chat Privé** : Messagerie 1-to-1 sécurisée (routage `convertAndSendToUser`).
- **Indicateurs visuels** : Cadenas 🔒 pour les messages privés.

### 💾 Persistance des données
- Base de données **MySQL**.
- Sauvegarde automatique de l'historique des conversations.
- Chargement des 50 derniers messages à la connexion.

### 👤 Expérience Utilisateur (UX)
- **Barre latérale dynamique** : Liste des utilisateurs mise à jour en temps réel.
- **Mise en avant** : L'utilisateur courant ("Moi") apparaît en haut de la liste, en **gras et jaune**.
- **Gestion des Statuts** : En ligne 🟢, Occupé 🔴, Absent 🟠.
- **Design** : Interface responsive, avatars automatiques (DiceBear), et regroupement des messages successifs.

---

## 🛠️ Stack Technique
- **Backend** : Java 17, Spring Boot 3, Spring Security, Spring Data JPA.
- **Frontend** : Thymeleaf, JavaScript (Vanilla), SockJS, Stomp.js.
- **Base de données** : MySQL.
- **Tests** : JUnit 5.

## 🚀 Comment lancer le projet

1. Créer une base de données MySQL nommée `chatapp_db`.
2. Configurer les accès (`root` / password) dans `src/main/resources/application.properties`.
3. Lancer l'application :
   ```bash
   mvn spring-boot:run
   ```
4. Pour lancer les tests unitaires :
    ```bash
    mvn test
    ```
5. Accéder à l'application : `http://localhost:8080`

Si une autre personne souhaite accéder aussi à l'application, le plus simple est que vous soyez connecté sur le meme réseau. Ensuite il lui suffira de taper dans l'url `http://*votre@IP*:8080`
