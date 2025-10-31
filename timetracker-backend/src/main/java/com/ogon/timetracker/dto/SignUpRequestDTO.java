package com.ogon.timetracker.dto;

import lombok.Data;

@Data
public class SignUpRequestDTO {
    String email;
    String firstName;
    String lastName;
    String password;
}
