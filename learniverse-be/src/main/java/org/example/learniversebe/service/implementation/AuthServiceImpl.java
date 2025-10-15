package org.example.learniversebe.service.implementation;

import jakarta.mail.MessagingException;
import org.example.learniversebe.dto.request.LoginRequest;
import org.example.learniversebe.dto.request.RegisterRequest;
import org.example.learniversebe.dto.request.VerifyUserRequest;
import org.example.learniversebe.dto.response.AuthResponse;
import org.example.learniversebe.enums.UserRole;
import org.example.learniversebe.enums.UserStatus;
import org.example.learniversebe.exception.BadRequestException;
import org.example.learniversebe.exception.EmailNotVerifiedException;
import org.example.learniversebe.exception.InvalidVerificationCodeException;
import org.example.learniversebe.exception.UserNotFoundException;
import org.example.learniversebe.jwt.JwtUtil;
import org.example.learniversebe.model.AuthCredential;
import org.example.learniversebe.model.RefreshToken;
import org.example.learniversebe.model.Role;
import org.example.learniversebe.model.User;
import org.example.learniversebe.model.composite_key.RoleUserId;
import org.example.learniversebe.repository.AuthCredentialRepository;
import org.example.learniversebe.repository.RoleRepository;
import org.example.learniversebe.repository.UserRepository;
import org.example.learniversebe.service.IAuthService;
import org.example.learniversebe.service.IEmailService;
import org.example.learniversebe.service.IRefreshTokenService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

@Service
public class AuthServiceImpl implements IAuthService {

    private final UserRepository userRepository;

    private final AuthCredentialRepository authCredentialRepository;

    private final RoleRepository roleRepository;

    private final IRefreshTokenService refreshTokenService;

    private final PasswordEncoder passwordEncoder;

    private final JwtUtil jwtUtil;

    private final IEmailService emailService;

    private final AuthenticationManager authenticationManager;


    public AuthServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder,
                           JwtUtil jwtUtil, IEmailService emailService,
                           AuthenticationManager authenticationManager,
                           AuthCredentialRepository authCredentialRepository,
                           IRefreshTokenService refreshTokenService,
                           RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
        this.refreshTokenService = refreshTokenService;
        this.authCredentialRepository = authCredentialRepository;
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
            throw new EmailNotVerifiedException("User not verified. Please verify your email.");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String accessToken = jwtUtil.generateToken(userDetails);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);
        String token = refreshToken.getToken();

        return AuthResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .accessToken(accessToken)
                .refreshToken(token)
                .build();
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already in use");
        }

        // Create a new record of user
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(request.getEmail());
        user.setUsername(request.getUsername());
        user.setEnabled(false);
        user.setStatus(UserStatus.PENDING_VERIFICATION);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        Role role = roleRepository.findByName(UserRole.ROLE_USER)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        // Assign role to user
        user.addRole(role); // role user will be added (cascade = CascadeType.ALL)
        userRepository.save(user);

        // Create a new record of auth credentials
        AuthCredential authCredential = new AuthCredential();
        authCredential.setId(UUID.randomUUID());
        authCredential.setUser(user);
        authCredential.setPassword(passwordEncoder.encode(request.getPassword()));
        String verificationCode = generateVerificationCode();
        authCredential.setVerificationCode(verificationCode);
        authCredential.setVerificationExpiration(LocalDateTime.now().plusMinutes(15));
        authCredential.setCreatedAt(LocalDateTime.now());
        authCredential.setUpdatedAt(LocalDateTime.now());
        authCredentialRepository.save(authCredential);

        sendVerificationEmail(user.getEmail(), verificationCode);

        return AuthResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .accessToken(null)
                .refreshToken(null)
                .build();
    }

    @Override
    @Transactional
    public void verifyUser(VerifyUserRequest request) {
        Optional<User> user = userRepository.findByEmail(request.getEmail());

        if (user.isEmpty()) {
            throw new UserNotFoundException("User not found");
        }

        User userDetails = user.get();
        AuthCredential authCredential = authCredentialRepository.findByUser(userDetails)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        if (authCredential.getVerificationExpiration().isBefore(LocalDateTime.now())) {
            throw new InvalidVerificationCodeException("Verification code expired");
        }

        if (request.getVerificationCode().equals(authCredential.getVerificationCode())) {
            userDetails.setEnabled(true);
            userDetails.setStatus(UserStatus.ACTIVE);
            userDetails.setUpdatedAt(LocalDateTime.now());

            authCredential.setVerificationCode(null);
            authCredential.setVerificationExpiration(null);
            authCredential.setUpdatedAt(LocalDateTime.now());

            userRepository.save(userDetails);
            authCredentialRepository.save(authCredential);
        } else {
            throw new InvalidVerificationCodeException("Invalid verification code");
        }
    }

    @Override
    @Transactional
    public void resendVerificationCode(String email) {
        Optional<User> user = userRepository.findByEmail(email);

        if (user.isEmpty()) {
            throw new UserNotFoundException("User not found");
        }

        User userDetails = user.get();
        if (userDetails.isEnabled()) {
            throw new BadRequestException("User already verified");
        } else {
            AuthCredential authCredential = authCredentialRepository.findByUser(userDetails)
                    .orElseThrow(() -> new UserNotFoundException("User not found"));
            authCredential.setVerificationCode(generateVerificationCode());
            authCredential.setVerificationExpiration(LocalDateTime.now().plusMinutes(15));
            authCredential.setUpdatedAt(LocalDateTime.now());
            authCredentialRepository.save(authCredential);
            sendVerificationEmail(userDetails.getEmail(), authCredential.getVerificationCode());
        }
    }

    public void sendVerificationEmail(String email, String code) {
        String subject = "Account Verification";
        String verificationCode = "VERIFICATION CODE " + code;
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
            emailService.sendEmail(email, subject, htmlMessage);
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