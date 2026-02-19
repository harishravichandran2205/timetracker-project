package com.ogon.timetracker.services;



import com.ogon.timetracker.dto.LoginResponseDTO;
import com.ogon.timetracker.dto.SignUpRequestDTO;
import com.ogon.timetracker.dto.SignUpResponseDTO;
import com.ogon.timetracker.entities.User;
import com.ogon.timetracker.enums.Role;
import com.ogon.timetracker.exceptions.InvalidEmalDomainException;
import com.ogon.timetracker.exceptions.ResourceNotFoundException;
import com.ogon.timetracker.exceptions.RuntimeConflictException;
import com.ogon.timetracker.repositories.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

import org.modelmapper.ModelMapper;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ModelMapper modelMapper;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Value("${company.email.domain}")
    private String companyDomain;

    @Transactional
    public SignUpResponseDTO registerNewUser(SignUpRequestDTO signUpRequestDTO) {
       User user = userRepository.findByEmail(signUpRequestDTO.getEmail()).orElse(null);
        if(user != null)
            throw new RuntimeConflictException("Cannot signup, User already exists with email "+signUpRequestDTO.getEmail());
        //Validate Company email domain
        validateCompanyEmail(signUpRequestDTO.getEmail());

        User mappedUser = modelMapper.map(signUpRequestDTO, User.class);
        mappedUser.setRoles(Set.of(Role.USER));
        mappedUser.setPassword(passwordEncoder.encode(signUpRequestDTO.getPassword()));
        User savedUser = userRepository.save(mappedUser);


        return modelMapper.map(savedUser, SignUpResponseDTO.class);
    }

    public LoginResponseDTO authenticate(String email, String password) {


        User user = userRepository.findByEmail(email).orElse(null);
        if (Objects.nonNull(user)) {
            if (!email.equals(user.getEmail())) {
                throw new BadCredentialsException("Invalid email id");
            }


            if (!passwordEncoder.matches(password, user.getPassword())) {

                throw new BadCredentialsException("Invalid password for User : " + user.getEmail());
            }

            String accessToken=jwtService.generateAccessToken(user);
            String refreshToken=jwtService.generateRefreshToken(user);
            String username = user.getFirstName() + " " + user.getLastName();
            List<String> roleNames = user.getRoles().stream()
                    .map(Role::name)
                    .collect(Collectors.toList());



            return new LoginResponseDTO(accessToken, refreshToken, user.getRoles(), username);
        } else {

            throw new BadCredentialsException("Invalid email id");
        }

//        Authentication authentication= authenticationManager.authenticate(
//                new UsernamePasswordAuthenticationToken(email, password)
//        );
//        User verifiedUser=(User) authentication.getPrincipal();

    }
    public String refreshToken(String refreshToken) {
        Long userId = jwtService.getUserIdFromToken(refreshToken);
        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found " +
                "with id: "+userId));

        return jwtService.generateAccessToken(user);
    }

    private void validateCompanyEmail(String email) {
        if (email == null || !email.contains("@")) {
            throw new InvalidEmalDomainException("Invalid email");
        }
        String domain = email.substring(email.indexOf("@")).toLowerCase();

        if (!domain.equalsIgnoreCase(companyDomain)) {
            throw new InvalidEmalDomainException("Only company email allowed");
        }
    }

}
