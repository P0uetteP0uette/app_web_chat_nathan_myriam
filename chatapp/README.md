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

## 🏗️ Architecture logicielle (MVC)

### 📂 Structure du projet

com.example.chatapp
├── ChatAppApplication.java → Point d’entrée de l’application
├── config/
│ └── WebSocketConfig.java → Configuration du broker WebSocket
├── controller/
│ └── ChatController.java → Réception et diffusion des messages
├── model/
│ └── ChatMessage.java → Représente un message (pseudo, texte, heure)
└── service/
└── ChatService.java → Gestion temporaire des messages


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

## 🧰 Dépendances principales (Maven)

```xml
<dependencies>
    <!-- Spring Web -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>

    <!-- WebSocket -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-websocket</artifactId>
    </dependency>

    <!-- Thymeleaf (optionnel pour pages dynamiques) -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-thymeleaf</artifactId>
    </dependency>

    <!-- Tests unitaires -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

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

## 🏗️ Architecture logicielle

L'architecture s'enrichit d'une couche d'accès aux données (Repository) et de configuration de sécurité.

### 📂 Structure ajoutée

com.example.chatapp
├── config/
│   ├── SecurityConfig.java → Règles de sécurité et chiffrement
│   └── WebSocketEventListener.java → Gestion des événements (Join/Leave)
├── model/
│   ├── User.java → Entité utilisateur (BDD)
│   └── MessageType.java → Enumération des types de messages
├── repository/
│   └── UserRepository.java → Interface d'interaction SQL (JPA)
└── service/
    └── UserService.java → Logique métier d'inscription

## 💬 Fonctionnalités de l’itération 2

### ✅ Fonctionnelles

1. **Authentification complète**
    - **Inscription** : Création de compte avec pseudo unique et mot de passe sécurisé.
    - **Connexion** : Authentification via formulaire sécurisé.

2. **Liste des utilisateurs connectés (Sidebar)**
    - Visualisation en temps réel de la liste des utilisateurs présents dans le chat.
    - Mise à jour dynamique lors des arrivées et départs.

3. **Notifications système**
    - Messages automatiques dans le chat : *"User a rejoint la conversation" / "User a quitté la conversation"*.

### ⚙️ Techniques

- **Persistance** : Les comptes utilisateurs sont stockés durablement dans MySQL.
- **Sécurité** :
    - Les mots de passe sont hachés avec **BCrypt**.
    - L'accès au chat est bloqué pour les utilisateurs non connectés.
- **WebSocket Events** : Le serveur détecte la fermeture du socket (onglet fermé) pour mettre à jour la liste des présents.

## 📝 Installation et Configuration

Pour faire fonctionner cette version, **MySQL** est requis.

### 1. **Base de données**

Assurez-vous que le module MySQL de XAMPP (ou autre) est lancé sur le port 3306. Créez la base de données :

```SQL
CREATE DATABASE chatapp_db;
```
La table users sera créée automatiquement par Hibernate au lancement.

### 2. **Accès à l'application**

Il suffit d'aller sur un navigateur internet et de taper dans l'url : http://localhost:8080

Ainsi vous pourrez accéder à l'application.
Si une autre personne souhaite accéder aussi à l'application, le plus simpleest que vous soyez connecté sur le meme réseau. Ensuite il lui suffira de taper dans l'url : http://*votre@IP*:8080

## 🧰 Nouvelles Dépendances (Maven)

```XML
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <scope>runtime</scope>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
    <groupId>org.thymeleaf.extras</groupId>
    <artifactId>thymeleaf-extras-springsecurity6</artifactId>
</dependency>
```