package com.example.chatapp.service;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;

@Component
@Converter
public class MessageEncryptor implements AttributeConverter<String, String> {

    private static final String ALGORITHM = "AES";
    
    // ⚠️ IMPORTANT : La clé doit faire exactement 16, 24 ou 32 caractères !
    // Ici 16 caractères pour AES-128.
    // Dans un vrai projet pro, cette clé serait dans application.properties.
    private static final String SECRET_KEY = "MaCleSecrete1234"; // 16 chars

    @Override
    public String convertToDatabaseColumn(String attribute) {
        // Cas où le message est null (ex: message système)
        if (attribute == null) {
            return null;
        }
        try {
            // On prépare le chiffrement
            SecretKeySpec key = new SecretKeySpec(SECRET_KEY.getBytes(), ALGORITHM);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, key);
            
            // On chiffre et on encode en Base64 pour que ça reste du texte stockable
            return Base64.getEncoder().encodeToString(cipher.doFinal(attribute.getBytes()));
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors du chiffrement du message", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        // Cas où la base est vide ou null
        if (dbData == null) {
            return null;
        }
        try {
            // On prépare le déchiffrement
            SecretKeySpec key = new SecretKeySpec(SECRET_KEY.getBytes(), ALGORITHM);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, key);
            
            // On décode le Base64 et on déchiffre
            return new String(cipher.doFinal(Base64.getDecoder().decode(dbData)));
        } catch (Exception e) {
            // Si jamais on tombe sur un vieux message non chiffré, on le retourne tel quel
            // (Utile pour éviter de tout casser si ta base n'est pas vide)
            return dbData; 
        }
    }
}