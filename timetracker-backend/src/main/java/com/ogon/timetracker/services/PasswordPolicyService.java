package com.ogon.timetracker.services;

import com.ogon.timetracker.entities.User;
import com.ogon.timetracker.exceptions.PasswordPolicyViolationException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

@Service
public class PasswordPolicyService {

    private static final int MIN_LENGTH = 16;
    private static final Pattern THREE_IDENTICAL_CHARS = Pattern.compile("(.)\\1\\1");
    private static final String ALLOWED_SPECIALS = "!@#$%^&*_-+=?";

    private static final Set<String> COMMON_DICTIONARY_WORDS = Set.of(
            "about", "after", "again", "apple", "admin", "august", "before", "button",
            "change", "default", "dragon", "freedom", "google", "hello", "january",
            "july", "june", "login", "manager", "monday", "november", "october",
            "orange", "password", "people", "qwerty", "sample", "secret", "september",
            "summer", "spring", "system", "thursday", "welcome", "winter", "mypass",
            "service", "secure", "sunday", "saturday", "friday"
    );

    private static final List<String> SEQUENCES = List.of(
            "abcdefghijklmnopqrstuvwxyz",
            "zyxwvutsrqponmlkjihgfedcba",
            "0123456789",
            "9876543210",
            "qwertyuiop", "poiuytrewq",
            "asdfghjkl", "lkjhgfdsa",
            "zxcvbnm", "mnbvcxz"
    );

    public void validateForRegistration(String password, String firstName, String lastName, String email) {
        validateBaseRules(password, buildSensitiveTokens(firstName, lastName, email));
    }

    public void validateForPasswordChange(String password, User user) {
        validateBaseRules(password, buildSensitiveTokens(user.getFirstName(), user.getLastName(), user.getEmail()));
    }

    private void validateBaseRules(String password, List<String> sensitiveTokens) {
        if (password == null || password.length() < MIN_LENGTH) {
            throw new PasswordPolicyViolationException("Password must be at least 16 characters long.");
        }

        int uppercase = 0;
        int lowercase = 0;
        int digits = 0;
        int specials = 0;
        for (char ch : password.toCharArray()) {
            if (Character.isUpperCase(ch)) {
                uppercase++;
            } else if (Character.isLowerCase(ch)) {
                lowercase++;
            } else if (Character.isDigit(ch)) {
                digits++;
            } else if (ALLOWED_SPECIALS.indexOf(ch) >= 0) {
                specials++;
            }
        }

        if (uppercase < 2 || lowercase < 2 || digits < 2 || specials < 2) {
            throw new PasswordPolicyViolationException(
                    "Password must include at least 2 uppercase, 2 lowercase, 2 digits, and 2 special characters.");
        }

        if (THREE_IDENTICAL_CHARS.matcher(password).find()) {
            throw new PasswordPolicyViolationException("Password cannot contain more than 2 identical consecutive characters.");
        }

        String normalized = password.toLowerCase(Locale.ROOT);
        for (String token : sensitiveTokens) {
            if (token.length() >= 3 && normalized.contains(token)) {
                throw new PasswordPolicyViolationException("Password must not include your username or email id.");
            }
        }

        if (containsSequentialPattern(normalized)) {
            throw new PasswordPolicyViolationException("Password must not contain sequential patterns like abcd, 1234, or qwerty.");
        }

        for (String word : COMMON_DICTIONARY_WORDS) {
            if (word.length() > 4 && normalized.contains(word)) {
                throw new PasswordPolicyViolationException("Password must not contain dictionary words longer than four characters.");
            }
        }
    }

    private List<String> buildSensitiveTokens(String firstName, String lastName, String email) {
        List<String> tokens = new ArrayList<>();
        addCleanToken(tokens, firstName);
        addCleanToken(tokens, lastName);

        if (email != null) {
            String lowerEmail = email.toLowerCase(Locale.ROOT);
            int atPos = lowerEmail.indexOf('@');
            String localPart = atPos >= 0 ? lowerEmail.substring(0, atPos) : lowerEmail;
            addCleanToken(tokens, localPart);
            for (String part : localPart.split("[^a-z0-9]+")) {
                addCleanToken(tokens, part);
            }
        }
        return tokens;
    }

    private void addCleanToken(List<String> tokens, String value) {
        if (value == null) {
            return;
        }
        String clean = value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
        if (!clean.isBlank()) {
            tokens.add(clean);
        }
    }

    private boolean containsSequentialPattern(String normalized) {
        for (int i = 0; i <= normalized.length() - 4; i++) {
            String part = normalized.substring(i, i + 4);
            if (isAsciiSequence(part)) {
                return true;
            }
            for (String seq : SEQUENCES) {
                if (seq.contains(part)) {
                    return true;
                }
            }
        }
        return false;
    }

    private boolean isAsciiSequence(String part) {
        boolean allLetters = part.chars().allMatch(ch -> ch >= 'a' && ch <= 'z');
        boolean allDigits = part.chars().allMatch(ch -> ch >= '0' && ch <= '9');
        if (!allLetters && !allDigits) {
            return false;
        }
        boolean ascending = true;
        boolean descending = true;
        for (int i = 1; i < part.length(); i++) {
            int diff = part.charAt(i) - part.charAt(i - 1);
            ascending &= diff == 1;
            descending &= diff == -1;
        }
        return ascending || descending;
    }
}
