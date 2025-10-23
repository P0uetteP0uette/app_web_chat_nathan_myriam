# 💬 Application Web de Chat – Itération 1 (MVP)

## 👥 Auteurs
- **Nathan Lyonnet**
- **[Nom du binôme]**

---

## 🧭 Présentation du projet

Ce projet s’inscrit dans le cadre du **Challenge Technique ESIEA – Projet Java**.  
L’objectif global est de concevoir une **application web de communication textuelle** en **Java Spring Boot**, permettant aux utilisateurs de discuter en temps réel dans un canal commun.

Cette première itération correspond à la **version MVP** (Minimum Viable Product), dont le but est de permettre aux utilisateurs :
- de rejoindre un chat via un **pseudonyme temporaire**,  
- d’envoyer et recevoir des messages en **temps réel**,  
- et de **quitter le chat** à tout moment.

---

## 🎯 Objectifs pédagogiques

- Travailler en **binôme** avec gestion Git professionnelle.
- Mettre en œuvre une **architecture MVC claire**.
- Comprendre les bases de la **communication en temps réel (WebSocket)**.
- Respecter les **bonnes pratiques de codage** et la **sécurisation des entrées**.
- Produire une **documentation complète** (README, commentaires, versioning).

---

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

---

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

---

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

---

### ⚙️ Techniques

- Communication en **temps réel** via **Spring WebSocket** (STOMP + SockJS).
- **Stockage temporaire** des messages en mémoire (pas de BDD pour cette version).
- **Validation des entrées** côté client et serveur.
- **Protection minimale contre XSS** (échappement des caractères spéciaux).
- **Interface responsive et minimaliste.**

---

## 🔒 Sécurité

- Vérification du pseudonyme non vide avant connexion.
- Nettoyage des messages côté serveur pour éviter le script injection (XSS).
- Empêchement d’envoi de messages vides.
- Aucun stockage persistant (pas de fuite de données).

---

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
