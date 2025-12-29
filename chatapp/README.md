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
- Inscription et Connexion des utilisateurs (cryptage BCrypt).
- Protection des routes (impossible d'accéder au chat sans être connecté).
- Redirection automatique après login/logout.

### 💬 Chat Temps Réel
- **Chat Public** : Diffusion des messages à tous les utilisateurs connectés.
- **Chat Privé** : Messagerie 1-to-1 sécurisée (seul le destinataire reçoit le message).
- **Indicateurs visuels** : Cadenas 🔒 et fond jaune pour les messages privés.

### 💾 Persistance des données (MySQL)
- Sauvegarde de tous les messages publics en base de données.
- Chargement automatique de l'historique (50 derniers messages) à la connexion.

### 👤 Expérience Utilisateur (UX)
- **Liste des connectés** : Mise à jour en temps réel (Connexion/Déconnexion).
- **Statuts** : Gestion des états (🟢 En ligne, 🔴 Occupé, 🟠 Absent).
- **Tri intelligent** : L'utilisateur courant ("Moi") apparaît toujours en haut de la liste, en jaune et gras.
- **Avatars** : Génération automatique d'avatars via l'API DiceBear.
- **Regroupement** : Les messages successifs d'un même utilisateur sont groupés visuellement (style Discord).


## 🛠️ Stack Technique
- **Backend** : Java 17, Spring Boot 3, Spring Security, Spring Data JPA.
- **Frontend** : Thymeleaf, JavaScript (Vanilla), SockJS, Stomp.js.
- **Base de données** : MySQL.

## 🚀 Comment lancer le projet

1. Créer une base de données MySQL nommée `chatapp_db`.
2. Configurer les accès dans `src/main/resources/application.properties`.
3. Lancer l'application : `mvn spring-boot:run`.
4. Accéder à : `http://localhost:8080`.

Ainsi vous pourrez accéder à l'application.
Si une autre personne souhaite accéder aussi à l'application, le plus simple est que vous soyez connecté sur le meme réseau. Ensuite il lui suffira de taper dans l'url : http://*votre@IP*:8080