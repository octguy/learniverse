package org.example.learniversebe.service.implementation;

import jakarta.mail.MessagingException;
import org.example.learniversebe.dto.request.LoginRequest;
import org.example.learniversebe.dto.request.RegisterRequest;
import org.example.learniversebe.dto.request.VerifyUserRequest;
import org.example.learniversebe.dto.response.AuthResponse;
import org.example.learniversebe.jwt.JwtUtil;
import org.example.learniversebe.model.User;
import org.example.learniversebe.repository.UserRepository;
import org.example.learniversebe.service.IAuthService;
import org.example.learniversebe.service.IEmailService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

@Service
public class AuthServiceImpl implements IAuthService {

    private final UserRepository userRepository;

    private final PasswordEncoder passwordEncoder;

    private final JwtUtil jwtUtil;

    private final IEmailService emailService;

    private final AuthenticationManager authenticationManager;


    public AuthServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder,
                           JwtUtil jwtUtil, IEmailService emailService,
                           AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
        this.authenticationManager = authenticationManager;
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail()).orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.isEnabled()) {
            throw new RuntimeException("User not verified. Please verify your email.");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        user.setLastLoginAt(LocalDateTime.now());

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        return AuthResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .accessToken(jwtUtil.generateToken(userDetails))
                .build();
    }

    @Override
    public AuthResponse register(RegisterRequest request) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setUsername(request.getUsername());
        user.setVerificationCode(generateVerificationCode());
        user.setVerificationExpiration(LocalDateTime.now().plusMinutes(15));
        user.setEnabled(false);
        user.setCreatedAt(LocalDateTime.now());
        sendVerificationEmail(user);

        userRepository.save(user);

        return AuthResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .accessToken(null)
                .build();
    }

    @Override
    public void verifyUser(VerifyUserRequest request) {
        Optional<User> user = userRepository.findByEmail(request.getEmail());

        if (user.isEmpty()) {
            throw new RuntimeException("User not found");
        }

        User userDetails = user.get();
        if (userDetails.getVerificationExpiration().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Verification code expired");
        }

        if (request.getVerificationCode().equals(userDetails.getVerificationCode())) {
            userDetails.setEnabled(true);
            userDetails.setVerificationCode(null);
            userDetails.setVerificationExpiration(null);
            userRepository.save(userDetails);
        } else {
            throw new RuntimeException("Invalid verification code");
        }

    }

    @Override
    public void resendVerificationCode(String email) {
        Optional<User> user = userRepository.findByEmail(email);

        if (user.isEmpty()) {
            throw new RuntimeException("User not found");
        }

        User userDetails = user.get();
        if (userDetails.isEnabled()) {
            throw new RuntimeException("User already verified");
        } else {
            userDetails.setVerificationCode(generateVerificationCode());
            userDetails.setVerificationExpiration(LocalDateTime.now().plusMinutes(15));
            sendVerificationEmail(userDetails);
            userRepository.save(userDetails);
        }
    }

    public void sendVerificationEmail(User user) {
        String subject = "Account Verification";
        String verificationCode = "VERIFICATION CODE " + user.getVerificationCode();
        String htmlMessage = "<html>"
                + "<body style=\"font-family: Arial, sans-serif;\">"
                + "<div style=\"background-color: #f5f5f5; padding: 20px;\">"
                + "<h2 style=\"color: #333;\">Welcome to our app!</h2>"
                + "<p style=\"font-size: 16px;\">Please enter the verification code below to continue:</p>"
                + "<div style=\"background-color: #fff; padding: 20px; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.1);\">"
                + "<h3 style=\"color: #333;\">Verification Code:</h3>"
                + "<p style=\"font-size: 18px; font-weight: bold; color: #007bff;\">" + verificationCode + "</p>"
                + "</div>"
                + "</div>"
                + "</body>"
                + "</html>";

        try {
            emailService.sendEmail(user.getEmail(), subject, htmlMessage);
        } catch (MessagingException e) {
            // Handle email sending exception
            e.printStackTrace();
        }
    }

    private String generateVerificationCode() {
        Random random = new Random();
        int code = random.nextInt(900000) + 100000;
        return String.valueOf(code);
    }
}
