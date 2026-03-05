package com.ogon.timetracker.encryption;

import org.jasypt.util.text.AES256TextEncryptor;

public class EncryptionUtil {

    private static final String SECRET_KEY =
            System.getenv("MAIL_SECRET_KEY") != null
                    ? System.getenv("MAIL_SECRET_KEY")
                    : "TimeTrackerSecretKey";

    private static AES256TextEncryptor getEncryptor() {
        AES256TextEncryptor encryptor =
                new AES256TextEncryptor();
        encryptor.setPassword(SECRET_KEY);
        return encryptor;
    }


    public static String encrypt(String plainText) {
        return getEncryptor().encrypt(plainText);
    }

    public static String decrypt(String encryptedText) {
        return getEncryptor().decrypt(encryptedText);
    }
}
