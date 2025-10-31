package com.ogon.timetracker.dto;

import com.ogon.timetracker.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;

import java.util.Set;

@Data
@Getter
@AllArgsConstructor
public class LoginResponseDTO {
    private String accessToken;
    private String refreshToken;
    private Set<Role> roles;
    private String username;
}
