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
import org.example.learniversebe.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

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
            if (user.getStatus() == UserStatus.PENDING_VERIFICATION) {
                log.warn("Login failed - email not verified for user: {}", request.getEmail());
                throw new AccountNotActivatedException("Email not verified!");
            }
            else {
                log.warn("Login failed - user disabled: {}", request.getEmail());
                throw new AccountSuspendedException("User suspended!");
            }
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
        return createUserWithRole(request, UserRole.ROLE_USER);
    }

    @Override
    @Transactional
    public void initAdmin(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistException("Email already in use");
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new UserAlreadyExistException("Username already in use");
        }

        // Create user
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(request.getEmail());
        user.setUsername(request.getUsername());
        user.setEnabled(true);
        user.setStatus(UserStatus.ACTIVE);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        user.setOnboarded(true);

        // Assign role
        Role role = roleRepository.findByName(UserRole.ROLE_ADMIN)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        user.addRole(role);
        userRepository.save(user);

        AuthCredential authCredential = new AuthCredential();
        authCredential.setId(UUID.randomUUID());
        authCredential.setUser(user);
        authCredential.setPassword(passwordEncoder.encode(request.getPassword()));
        authCredential.setVerificationCode(null);
        authCredential.setVerificationExpiration(null);
        authCredential.setCreatedAt(LocalDateTime.now());
        authCredential.setUpdatedAt(LocalDateTime.now());
        authCredentialRepository.save(authCredential);
    }

    @Override
    public AuthResponse registerAdmin(RegisterRequest request) {
        return createUserWithRole(request, UserRole.ROLE_ADMIN);
    }

    private User createUser(RegisterRequest request, UserRole roleName) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistException("Email already in use");
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new UserAlreadyExistException("Username already in use");
        }

        // Create user
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(request.getEmail());
        user.setUsername(request.getUsername());
        
        // Admin users are enabled immediately, regular users need verification
        boolean isAdmin = roleName == UserRole.ROLE_ADMIN;
        user.setEnabled(isAdmin);
        user.setStatus(isAdmin ? UserStatus.ACTIVE : UserStatus.PENDING_VERIFICATION);
        
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        // Assign role
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        user.addRole(role);

        return userRepository.save(user);
    }

    private AuthCredential createCredential(User user, String password, boolean requiresVerification) {
        AuthCredential authCredential = new AuthCredential();
        authCredential.setId(UUID.randomUUID());
        authCredential.setUser(user);
        authCredential.setPassword(passwordEncoder.encode(password));
        
        if (requiresVerification) {
            String verificationCode = generateVerificationCode();
            authCredential.setVerificationCode(verificationCode);
            authCredential.setVerificationExpiration(LocalDateTime.now().plusMinutes(expiration));
        } else {
            authCredential.setVerificationCode(null);
            authCredential.setVerificationExpiration(null);
        }
        
        authCredential.setCreatedAt(LocalDateTime.now());
        authCredential.setUpdatedAt(LocalDateTime.now());
        authCredentialRepository.save(authCredential);
        return authCredential;
    }

    private AuthResponse createUserWithRole(RegisterRequest request, UserRole roleName) {
        User user = createUser(request, roleName);
        
        String password;
        boolean isAdmin = roleName == UserRole.ROLE_ADMIN;
        
        if (isAdmin) {
            // Generate secure password for admin
            password = generateSecurePassword();
        } else {
            // Use provided password for regular users
            password = request.getPassword();
        }
        
        // Admin doesn't require email verification, regular users do
        AuthCredential credential = createCredential(user, password, !isAdmin);

        if (isAdmin) {
            sendPasswordForAdmin(user.getEmail(), password);
            System.out.println("Admin password: " + password);
        }
        else {
            sendVerificationEmail(user.getEmail(), credential.getVerificationCode());
        }

        return AuthResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .accessToken(null)
                .refreshToken(null)
                .isOnboarded(true)
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
        User currentUser = SecurityUtils.getCurrentUser();
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
        User currentUser = SecurityUtils.getCurrentUser();
        System.out.println(currentUser.getEmail());
        refreshTokenService.deleteByUser(currentUser);
    }

    private void sendForgetPasswordEmail(String email, String token) {
        String subject = "[Learniverse System] Password Reset Request";
        String resetLink = "http://localhost:8386/reset-password?token=" + token;// Replace with your frontend URL
        String htmlMessage = "<!DOCTYPE html>"
                + "<html lang=\"en\">"
                + "<head>"
                + "<meta charset=\"UTF-8\">"
                + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">"
                + "<title>Learniverse System - Password Reset</title>"
                + "</head>"
                + "<body style=\"margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;\">"
                + "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color: #f4f4f4; padding: 40px 0;\">"
                + "<tr>"
                + "<td align=\"center\">"
                + "<table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);\">"
                + "<!-- Header -->"
                + "<tr>"
                + "<td style=\"background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;\">"
                + "<h1 style=\"color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;\">🔐 Password Reset Request</h1>"
                + "<p style=\"color: #ffffff; margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;\">Learniverse System</p>"
                + "</td>"
                + "</tr>"
                + "<!-- Content -->"
                + "<tr>"
                + "<td style=\"padding: 40px 50px;\">"
                + "<p style=\"color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 10px 0;\">Dear User,</p>"
                + "<p style=\"color: #666666; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;\">Greetings from Learniverse!</p>"
                + "<p style=\"color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;\">We received a request to reset your password. Click the button below to create a new password:</p>"
                + "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">"
                + "<tr>"
                + "<td align=\"center\" style=\"padding: 20px 0;\">"
                + "<a href=\"" + resetLink + "\" style=\"display: inline-block; padding: 15px 40px; font-size: 16px; font-weight: 600; color: #ffffff; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); text-decoration: none; border-radius: 50px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: all 0.3s;\">Reset Password</a>"
                + "</td>"
                + "</tr>"
                + "</table>"
                + "<p style=\"color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; padding: 20px; background-color: #f8f9fa; border-left: 4px solid #ffc107; border-radius: 4px;\">⚠️ <strong>Security Notice:</strong> If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>"
                + "<p style=\"color: #999999; font-size: 13px; line-height: 1.6; margin: 20px 0 0 0;\">This link will expire in 1 hour for security reasons.</p>"
                + "</td>"
                + "</tr>"
                + "<!-- Footer -->"
                + "<tr>"
                + "<td style=\"background-color: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;\">"
                + "<p style=\"color: #6c757d; font-size: 13px; margin: 0 0 10px 0;\">© 2026 Learniverse. All rights reserved.</p>"
                + "<p style=\"color: #adb5bd; font-size: 12px; margin: 0;\">This is an automated message, please do not reply.</p>"
                + "</td>"
                + "</tr>"
                + "</table>"
                + "</td>"
                + "</tr>"
                + "</table>"
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
        String subject = "[Learniverse System] Email Verification Required";
        String htmlMessage = "<!DOCTYPE html>"
                + "<html lang=\"en\">"
                + "<head>"
                + "<meta charset=\"UTF-8\">"
                + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">"
                + "<title>Learniverse System - Email Verification</title>"
                + "</head>"
                + "<body style=\"margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;\">"
                + "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color: #f4f4f4; padding: 40px 0;\">"
                + "<tr>"
                + "<td align=\"center\">"
                + "<table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);\">"
                + "<!-- Header -->"
                + "<tr>"
                + "<td style=\"background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;\">"
                + "<h1 style=\"color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;\">✨ Welcome to Learniverse!</h1>"
                + "<p style=\"color: #ffffff; margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;\">Your Learning Journey Begins Here</p>"
                + "</td>"
                + "</tr>"
                + "<!-- Content -->"
                + "<tr>"
                + "<td style=\"padding: 40px 50px;\">"
                + "<p style=\"color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 10px 0;\">Dear Learner,</p>"
                + "<p style=\"color: #666666; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;\">Greetings from the Learniverse Team!</p>"
                + "<p style=\"color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;\">Thank you for joining our learning community. To complete your account registration and begin your educational journey, please verify your email address using the code below:</p>"
                + "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">"
                + "<tr>"
                + "<td align=\"center\" style=\"padding: 30px 0;\">"
                + "<div style=\"background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 30px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 15px rgba(0,0,0,0.1);\">"
                + "<p style=\"color: #666666; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 2px;\">Your Verification Code</p>"
                + "<p style=\"color: #667eea; font-size: 36px; font-weight: 700; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;\">" + code + "</p>"
                + "</div>"
                + "</td>"
                + "</tr>"
                + "</table>"
                + "<p style=\"color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;\">⏱️ <strong>Note:</strong> This code will expire in 15 minutes.</p>"
                + "<p style=\"color: #999999; font-size: 13px; line-height: 1.6; margin: 20px 0 0 0;\">If you didn't create an account with us, please ignore this email.</p>"
                + "</td>"
                + "</tr>"
                + "<!-- Footer -->"
                + "<tr>"
                + "<td style=\"background-color: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;\">"
                + "<p style=\"color: #6c757d; font-size: 13px; margin: 0 0 10px 0;\">© 2026 Learniverse. All rights reserved.</p>"
                + "<p style=\"color: #adb5bd; font-size: 12px; margin: 0;\">This is an automated message, please do not reply.</p>"
                + "</td>"
                + "</tr>"
                + "</table>"
                + "</td>"
                + "</tr>"
                + "</table>"
                + "</body>"
                + "</html>";

        try {
            emailService.sendEmail(email, subject, htmlMessage);
        } catch (MessagingException e) {
            // Handle email sending exception
            e.printStackTrace();
        }
    }

    private void sendPasswordForAdmin(String email, String password) {
        String subject = "[Learniverse System] Administrator Account Created";
        String htmlMessage = "<!DOCTYPE html>"
                + "<html lang=\"en\">"
                + "<head>"
                + "<meta charset=\"UTF-8\">"
                + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">"
                + "<title>Learniverse System - Admin Account</title>"
                + "</head>"
                + "<body style=\"margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;\">"
                + "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color: #f4f4f4; padding: 40px 0;\">"
                + "<tr>"
                + "<td align=\"center\">"
                + "<table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);\">"
                + "<!-- Header -->"
                + "<tr>"
                + "<td style=\"background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;\">"
                + "<h1 style=\"color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;\">👑 Administrator Access Granted</h1>"
                + "<p style=\"color: #ffffff; margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;\">Learniverse System</p>"
                + "</td>"
                + "</tr>"
                + "<!-- Content -->"
                + "<tr>"
                + "<td style=\"padding: 40px 50px;\">"
                + "<p style=\"color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 10px 0;\">Dear Administrator,</p>"
                + "<p style=\"color: #666666; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;\">Greetings from Learniverse!</p>"
                + "<p style=\"color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;\">Your administrator account has been successfully created with elevated privileges. Please find your secure login credentials below:</p>"
                + "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin: 20px 0;\">"
                + "<tr>"
                + "<td>"
                + "<p style=\"color: #666666; font-size: 14px; margin: 0 0 15px 0;\"><strong style=\"color: #333333;\">Email:</strong></p>"
                + "<p style=\"color: #667eea; font-size: 16px; margin: 0 0 25px 0; font-family: 'Courier New', monospace; background-color: #ffffff; padding: 12px; border-radius: 4px; border: 1px solid #e9ecef;\">" + email + "</p>"
                + "<p style=\"color: #666666; font-size: 14px; margin: 0 0 15px 0;\"><strong style=\"color: #333333;\">Temporary Password:</strong></p>"
                + "<p style=\"color: #f5576c; font-size: 18px; font-weight: 600; margin: 0; font-family: 'Courier New', monospace; background-color: #ffffff; padding: 12px; border-radius: 4px; border: 1px solid #e9ecef; letter-spacing: 1px;\">" + password + "</p>"
                + "</td>"
                + "</tr>"
                + "</table>"
                + "<p style=\"color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;\">⚠️ <strong>Important:</strong> Please change this password immediately after your first login for security purposes.</p>"
                + "<p style=\"color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0; padding: 20px; background-color: #f8d7da; border-left: 4px solid #dc3545; border-radius: 4px;\">🔒 <strong>Security Notice:</strong> Never share your credentials with anyone. Keep this email secure and delete it after changing your password.</p>"
                + "</td>"
                + "</tr>"
                + "<!-- Footer -->"
                + "<tr>"
                + "<td style=\"background-color: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;\">"
                + "<p style=\"color: #6c757d; font-size: 13px; margin: 0 0 10px 0;\">© 2026 Learniverse. All rights reserved.</p>"
                + "<p style=\"color: #adb5bd; font-size: 12px; margin: 0;\">This is an automated message, please do not reply.</p>"
                + "</td>"
                + "</tr>"
                + "</table>"
                + "</td>"
                + "</tr>"
                + "</table>"
                + "</body>"
                + "</html>";

        try {
            emailService.sendEmail(email, subject, htmlMessage);
        } catch (MessagingException e) {
            // Handle email sending exception
            e.printStackTrace();
        }
    }

    private String generateSecurePassword() {
        String upperChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        String lowerChars = "abcdefghijklmnopqrstuvwxyz";
        String numbers = "0123456789";
        String specialChars = "!@#$%^&*";
        
        Random random = new Random();
        StringBuilder password = new StringBuilder();
        
        // Ensure at least one of each required character type
        password.append(upperChars.charAt(random.nextInt(upperChars.length())));
        password.append(numbers.charAt(random.nextInt(numbers.length())));
        password.append(specialChars.charAt(random.nextInt(specialChars.length())));
        
        // Fill the rest with random characters from all categories
        String allChars = upperChars + lowerChars + numbers + specialChars;
        for (int i = 3; i < 12; i++) {
            password.append(allChars.charAt(random.nextInt(allChars.length())));
        }
        
        // Shuffle the password to randomize position of required characters
        List<Character> passwordChars = new ArrayList<>();
        for (char c : password.toString().toCharArray()) {
            passwordChars.add(c);
        }
        Collections.shuffle(passwordChars, random);
        
        StringBuilder shuffledPassword = new StringBuilder();
        for (char c : passwordChars) {
            shuffledPassword.append(c);
        }
        
        return shuffledPassword.toString();
    }

    private String generateVerificationCode() {
        Random random = new Random();
        int code = random.nextInt(900000) + 100000;
        return String.valueOf(code);
    }
}