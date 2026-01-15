package com.example.chatapp.repository;

import com.example.chatapp.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

/**
 * Interface d'accès aux données pour les messages du chat.
 *
 * Cette interface permet de récupérer l'historique des discussions,
 * que ce soit pour le canal public (chat général) ou pour les conversations privées.
 */
public interface MessageRepository extends JpaRepository<Message, Long> {

    /**
     * Récupère les 50 derniers messages du chat général.
     *
     * Un message est considéré comme public si le champ 'recipient' est null.
     * Les résultats sont triés du plus récent au plus ancien pour l'affichage initial.
     *
     * @return Une liste des 50 derniers messages publics.
     */
    List<Message> findTop50ByRecipientIsNullOrderByTimestampDesc();

    /**
     * Récupère l'historique complet de la conversation privée entre deux utilisateurs.
     *
     * Cette méthode cherche les messages dans les deux sens :
     * - De l'utilisateur A vers l'utilisateur B
     * - De l'utilisateur B vers l'utilisateur A
     *
     * Les messages sont triés par ordre chronologique (du plus ancien au plus récent)
     * pour afficher la conversation dans le bon sens.
     *
     * @param sender1 Pseudo du premier participant (en tant qu'expéditeur).
     * @param recipient1 Pseudo du second participant (en tant que destinataire).
     * @param sender2 Pseudo du second participant (en tant qu'expéditeur).
     * @param recipient2 Pseudo du premier participant (en tant que destinataire).
     * @return La liste chronologique des messages échangés entre ces deux personnes.
     */
    List<Message> findBySenderAndRecipientOrSenderAndRecipientOrderByTimestampAsc(
            String sender1, String recipient1, String sender2, String recipient2);
}