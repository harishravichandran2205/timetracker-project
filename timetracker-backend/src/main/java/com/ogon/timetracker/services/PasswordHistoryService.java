package com.ogon.timetracker.services;

import com.ogon.timetracker.entities.PasswordHistoryEntity;
import com.ogon.timetracker.entities.User;
import com.ogon.timetracker.repositories.PasswordHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PasswordHistoryService {

    private final PasswordHistoryRepository passwordHistoryRepository;
    private final PasswordEncoder passwordEncoder;

    public void recordPassword(User user, String encodedPassword) {
        PasswordHistoryEntity entry = PasswordHistoryEntity.builder()
                .user(user)
                .passwordHash(encodedPassword)
                .build();
        passwordHistoryRepository.save(entry);
    }

    public boolean matchesRecentPasswords(User user, String rawPassword) {
        if (user.getPassword() != null && passwordEncoder.matches(rawPassword, user.getPassword())) {
            return true;
        }
        return passwordHistoryRepository.findTop5ByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .anyMatch(entry -> passwordEncoder.matches(rawPassword, entry.getPasswordHash()));
    }
}
