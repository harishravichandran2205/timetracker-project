package com.ogon.timetracker.dto;

import com.ogon.timetracker.enums.Role;

import lombok.Data;

import java.util.Set;

@Data
public class SignUpResponseDTO {
    String email;
    String firstName;
    String lastName;
    Set<Role> roles;
}
