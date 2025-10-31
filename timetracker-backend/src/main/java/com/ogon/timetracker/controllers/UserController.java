package com.ogon.timetracker.controllers;


import com.ogon.timetracker.entities.User;
import com.ogon.timetracker.repositories.UserRepository;
import com.ogon.timetracker.services.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;


@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService; // Your service to send emails

    private Map<String, String> otpStore = new HashMap<>(); // store OTP temporarily

    private final PasswordEncoder passwordEncoder ;


    @GetMapping("/getuser/{email}")
    public ResponseEntity<Map<String, Object>> getUserByEmail(@PathVariable String email) {
        Map<String, Object> response = new HashMap<>();

        Optional<User> user = userRepository.findByEmail(email);
        if (user != null) {
            response.put("success", true);
            response.put("message", "User found");
            response.put("data", user);
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "User not found");
            return ResponseEntity.status(404).body(response);
        }
    }


    @PostMapping("/requestotp")
    public ResponseEntity<Map<String, Object>> requestOtp(@RequestBody Map<String, String> request) {
        String email =request.get("email");
        Map<String, Object> response = new HashMap<>();
        Optional<User> user = userRepository.findByEmail(email);

        if (user != null) {
            String otp = String.valueOf((int) (Math.random() * 900000) + 100000); // 6-digit OTP
            otpStore.put(email, otp);

            // Send email
            emailService.sendOtp(email, otp);

            response.put("success", true);
            response.put("message", "OTP sent to email");
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "User not found");
            return ResponseEntity.status(404).body(response);
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, Object>> changePassword(
            @RequestBody Map<String, String> request) {

        String email = request.get("email");
        String otp = request.get("otp");
        String newPassword = request.get("newPassword");

        Map<String, Object> response = new HashMap<>();
        String storedOtp = otpStore.get(email);

        if (storedOtp != null && storedOtp.equals(otp)) {
            Optional<User> optionalUser = userRepository.findByEmail(email);
            if (optionalUser.isPresent()) {
                User user = optionalUser.get();
                if (user != null) {
                    user.setPassword(passwordEncoder.encode(newPassword));
                    // ideally, hash password before saving
                    userRepository.save(user);
                    otpStore.remove(email);

                    response.put("success", true);
                    response.put("message", "Password changed successfully");
                    return ResponseEntity.ok(response);
                }
            }
        } else {
            response.put("success", false);
            response.put("message", "Invalid OTP");
            return ResponseEntity.status(200).body(response);

        }
        response.put("success", false);
        response.put("message", "Server Error! Please Try again Later");
        return ResponseEntity.status(400).body(response);
    }



    @PostMapping("/checkemail")
    public ResponseEntity<Map<String, Object>> checkEmail(
            @RequestBody Map<String, String> request) {

        String email = request.get("email");
        Map<String, Object> response = new HashMap<>();
        if(Objects.nonNull(email))
        {
            Optional<User> optionalUser = userRepository.findByEmail(email);

            if(optionalUser.isPresent())
            {
                User user = optionalUser.get();
                response.put("success", true);
                response.put("exists",true);
                response.put("message", "User is exists");
                return ResponseEntity.ok(response);
            }
        }
        response.put("success", false);
        response.put("exists",false);
        response.put("message", "User not exists");
        return ResponseEntity.status(400).body(response);

    }
}
