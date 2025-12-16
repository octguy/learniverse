package org.example.learniversebe.service.implementation;

import jakarta.mail.MessagingException;
import lombok.extern.slf4j.Slf4j;
import org.example.learniversebe.dto.request.*;
import org.example.learniversebe.dto.response.AuthResponse;
import org.example.learniversebe.enums.UserRole;
import org.example.learniversebe.enums.UserStatus;
import org.example.learniversebe.exception.*;
import org.example.learniversebe.jwt.JwtUtil;
import org.example.learniversebe.model.*;
import org.example.learniversebe.repository.AuthCredentialRepository;
import org.example.learniversebe.repository.RoleRepository;
import org.example.learniversebe.repository.UserRepository;
import org.example.learniversebe.service.IAuthService;
import org.example.learniversebe.service.IEmailService;
import org.example.learniversebe.service.IPasswordResetTokenService;
import org.example.learniversebe.service.IRefreshTokenService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.AccessDeniedException;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

@Slf4j
@Service
public class AuthServiceImpl implements IAuthService {

    @Value("${spring.verification-code.expiration}")
    private Long expiration;

    private final UserRepository userRepository;

    private final AuthCredentialRepository authCredentialRepository;

    private final RoleRepository roleRepository;

    private final IRefreshTokenService refreshTokenService;

    private final PasswordEncoder passwordEncoder;

    private final JwtUtil jwtUtil;

    private final IEmailService emailService;

    private final AuthenticationManager authenticationManager;

    private final UserDetailsServiceImpl userDetailsService;

    private final IPasswordResetTokenService passwordResetTokenService;


    public AuthServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder,
                           JwtUtil jwtUtil, IEmailService emailService,
                           AuthenticationManager authenticationManager,
                           AuthCredentialRepository authCredentialRepository,
                           IRefreshTokenService refreshTokenService,
                           RoleRepository roleRepository,
                           UserDetailsServiceImpl userDetailsService,
                           IPasswordResetTokenService passwordResetTokenService) {
        this.passwordResetTokenService = passwordResetTokenService;
        this.userDetailsService = userDetailsService;
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
        log.info("Login attempt for email: {}", request.getEmail());
        User user = userRepository.findByEmail(request.getEmail()).orElseThrow(() -> new BadCredentialsException("Bad credentials"));

        // Still throw BadCredentialsException to avoid giving hints to attackers
        if (!user.isEnabled()) {
            log.warn("Login failed - email not verified for user: {}", request.getEmail());
            throw new AccountNotActivatedException("Email not verified!");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        user.setLastLoginAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String accessToken = jwtUtil.generateToken(userDetails);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);
        String token = refreshToken.getToken();
        log.info("User logged in successfully: {}", user.getUsername());

        return AuthResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .accessToken(accessToken)
                .refreshToken(token)
                .isOnboarded(user.isOnboarded())
                .build();
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Registration attempt for email: {} and username: {}", request.getEmail(), request.getUsername());
        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("Registration failed - email already in use: {}", request.getEmail());
            throw new UserAlreadyExistException("Email already in use");
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            log.warn("Registration failed - username already in use: {}", request.getUsername());
            throw new UserAlreadyExistException("Username already in use");
        }

        // Create a new record of user
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(request.getEmail());
        user.setUsername(request.getUsername());
        user.setOnboarded(false);
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
        authCredential.setVerificationExpiration(LocalDateTime.now().plusMinutes(expiration));
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
                .isOnboarded(false)
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

        LocalDateTime expirationTime = authCredential.getVerificationExpiration();
        String verificationCode = authCredential.getVerificationCode();

        boolean expired = expirationTime == null || LocalDateTime.now().isAfter(expirationTime);
        boolean invalidCode = verificationCode == null || !Objects.equals(verificationCode, request.getVerificationCode());

        if (expired || invalidCode) {
            throw new InvalidVerificationCodeException("Invalid verification code");
        }

        userDetails.setEnabled(true);
        userDetails.setStatus(UserStatus.ACTIVE);
        userDetails.setUpdatedAt(LocalDateTime.now());

        authCredential.setVerificationCode(null);
        authCredential.setVerificationExpiration(null);
        authCredential.setUpdatedAt(LocalDateTime.now());

        userRepository.save(userDetails);
        authCredentialRepository.save(authCredential);
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
            authCredential.setVerificationExpiration(LocalDateTime.now().plusMinutes(expiration));
            authCredential.setUpdatedAt(LocalDateTime.now());
            authCredentialRepository.save(authCredential);
            sendVerificationEmail(userDetails.getEmail(), authCredential.getVerificationCode());
        }
    }

    @Override
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String token = request.getRefreshToken();
        RefreshToken refreshToken = refreshTokenService.findByToken(token);

        if (refreshTokenService.verifyExpiration(refreshToken)) {
            throw new UnauthorizedException("Refresh token expired. Please login again.");
            // Return 401 http, frontend should catch this and redirect to login
        }

        UUID userId = refreshToken.getUser().getId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtUtil.generateToken(userDetails);
        String newRefreshToken = refreshTokenService.createRefreshToken(user).getToken();

        return AuthResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .accessToken(accessToken)
                .refreshToken(newRefreshToken)
                .isOnboarded(user.isOnboarded())
                .build();
    }

    @Override
    @Transactional
    public void requestPasswordReset(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail()).orElseThrow(() -> new UserNotFoundException("User not found"));
        PasswordResetToken token = passwordResetTokenService.create(user);
        sendForgetPasswordEmail(user.getEmail(), token.getToken());
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenService.validateToken(request.getToken());

        User user = resetToken.getUser();
        AuthCredential authCredential = authCredentialRepository.findByUser(user)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        authCredential.setPassword(passwordEncoder.encode(request.getNewPassword()));
        authCredential.setUpdatedAt(LocalDateTime.now());
        authCredential.setLastPasswordChangeAt(LocalDateTime.now());
        authCredentialRepository.save(authCredential);

        passwordResetTokenService.markTokenAsUsed(resetToken);
    }

    @Override
    public void changePassword(ChangePasswordRequest request) {
        User currentUser = getCurrentUser();
        Optional<AuthCredential> authCredential = authCredentialRepository.findByUser(currentUser);

        if (authCredential.isEmpty()) {
            throw new UserNotFoundException("User not found");
        }

        AuthCredential credential = authCredential.get();
        if (!passwordEncoder.matches(request.getCurrentPassword(), credential.getPassword())) {
            throw new BadCredentialsException("Current password is incorrect");
        }

        credential.setPassword(passwordEncoder.encode(request.getNewPassword()));
        credential.setUpdatedAt(LocalDateTime.now());
        credential.setLastPasswordChangeAt(LocalDateTime.now());
        authCredentialRepository.save(credential);
    }

    @Override
    @Transactional
    public void logout() {
        User currentUser = getCurrentUser();
        System.out.println(currentUser.getEmail());
        refreshTokenService.deleteByUser(currentUser);
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        // the code above always return an object of type UsernamePasswordAuthenticationToken
        // if not authenticated, the object will be AnonymousAuthenticationToken (if not .authenticated() in SecurityConfig)

//        System.out.println(authentication.isAuthenticated()); // always true

//        System.out.println(authentication.getClass());
//        System.out.println(authentication.getPrincipal().toString());
//        System.out.println(authentication.getCredentials());

        CustomUserDetails customUserDetails = (CustomUserDetails) authentication.getPrincipal();
        return customUserDetails.getUser();
    }

    private void sendForgetPasswordEmail(String email, String token) {
        String subject = "Password Reset Request";
        String resetLink = "http://localhost:8386/reset-password?token=" + token;// Replace with your frontend URL
        String htmlMessage = "<html>"
                + "<body style=\"font-family: Arial, sans-serif;\">"
                + "<div style=\"background-color: #f5f5f5; padding: 20px;\">"
                + "<h2 style=\"color: #333;\">Password Reset Request</h2>"
                + "<p style=\"font-size: 16px;\">We received a request to reset your password. Click the link below to reset it:</p>"
                + "<a href=\"" + resetLink + "\" style=\"display: inline-block; padding: 10px 20px; font-size: 16px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px;\">Reset Password</a>"
                + "<p style=\"font-size: 14px; color: #777; margin-top: 20px;\">If you did not request a password reset, please ignore this email.</p>"
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

    private void sendVerificationEmail(String email, String code) {
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