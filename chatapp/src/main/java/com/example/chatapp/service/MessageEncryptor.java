package com.example.chatapp.service;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;

/**
 * Convertisseur JPA pour le chiffrement transparent des messages.
 *
 * Cette classe intercepte les opérations de lecture et d'écriture en base de données
 * pour chiffrer les contenus textuels via l'algorithme AES.
 */
@Component
@Converter
public class MessageEncryptor implements AttributeConverter<String, String> {

    private static final String ALGORITHM = "AES";
    
    /**
     * Clé de chiffrement symétrique (16 octets pour AES-128).
     * Note: Dans un environnement de production, cette clé devrait être stockée dans une variable d'environnement sécurisée.
     */
    private static final String SECRET_KEY = "MaCleSecrete1234";

    /**
     * Chiffre l'attribut de l'entité avant de le stocker en base de données.
     *
     * @param attribute Le message en clair à chiffrer.
     * @return Le message chiffré et encodé en Base64, ou null si l'entrée est null.
     * @throws RuntimeException En cas d'échec du processus de chiffrement.
     */
    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null) {
            return null;
        }
        try {
            SecretKeySpec key = new SecretKeySpec(SECRET_KEY.getBytes(), ALGORITHM);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, key);
            
            return Base64.getEncoder().encodeToString(cipher.doFinal(attribute.getBytes()));
        } catch (Exception e) {
            throw new RuntimeException("Erreur critique lors du chiffrement des données", e);
        }
    }

    /**
     * Déchiffre la donnée provenant de la base de données pour l'afficher dans l'entité.
     *
     * @param dbData La chaîne chiffrée stockée en base.
     * @return Le message déchiffré en clair, ou la donnée brute en cas d'erreur (fallback).
     */
    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        try {
            SecretKeySpec key = new SecretKeySpec(SECRET_KEY.getBytes(), ALGORITHM);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, key);
            
            return new String(cipher.doFinal(Base64.getDecoder().decode(dbData)));
        } catch (Exception e) {
            // Si le déchiffrement échoue (ex: données anciennes non chiffrées), on retourne la valeur brute
            return dbData; 
        }
    }
}