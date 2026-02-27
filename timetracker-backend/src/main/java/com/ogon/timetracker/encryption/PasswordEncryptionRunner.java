package com.ogon.timetracker.encryption;

public class PasswordEncryptionRunner {
    public static void main(String[] args) {

        String appPassword = "abcdefghijklmnop";

        String encrypted =
                EncryptionUtil.encrypt(appPassword);

        System.out.println("\nEncrypted Password:");
        System.out.println(encrypted);
    }
}
