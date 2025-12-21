package org.example.learniversebe.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.example.learniversebe.dto.request.UserProfileRequest;
import org.example.learniversebe.dto.response.UserProfileResponse;
import org.example.learniversebe.model.CustomUserDetails;
import org.example.learniversebe.service.IUserProfileService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RequestMapping("/api/v1/user_profile")
@RestController
@Tag(name = "UserProfile", description = "Endpoints for user profile onboard")
public class UserProfileController {
    private final IUserProfileService service;

    public UserProfileController(IUserProfileService service) {
        this.service = service;
    }

    @Operation(summary = "Onboard profile")
    @PostMapping(value = "/onboard")
    public ResponseEntity<UserProfileResponse> onboardProfile(Authentication authentication,
                                                              @RequestPart("data") @Valid UserProfileRequest data,
                                                              @RequestParam(required = false) MultipartFile avatar,
                                                              @RequestParam(required = false) MultipartFile cover
    ) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        UUID userId = userDetails.getId();
        UserProfileResponse profile = service.onboardProfile(userId, data, avatar, cover);
        return new ResponseEntity<>(profile, HttpStatus.CREATED);
    }

    @Operation(summary = "Update current user profile")
    @PutMapping(value = "/me")
    public UserProfileResponse updateMyProfile(
            Authentication authentication,
            @RequestPart("data") @Valid UserProfileRequest data,
            @RequestPart(value = "avatar", required = false) MultipartFile avatar,
            @RequestPart(value = "cover", required = false) MultipartFile cover
    ) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        UUID userId = userDetails.getId();

        UserProfileResponse response = service.updateProfile(userId, data, avatar, cover);

        return service.updateProfile(userId, data, avatar, cover);
    }

    @Operation(summary = "Read current user profile")
    @GetMapping("/me")
    public UserProfileResponse getMyProfile(Authentication authentication) {
        UUID userId = ((CustomUserDetails) authentication.getPrincipal()).getId();
        return service.viewProfile(userId);
    }

    @Operation(summary = "Get user profile by user ID")
    @GetMapping("/{userId}")
    public UserProfileResponse getUserProfile(@PathVariable UUID userId) {
        return service.viewProfile(userId);
    }
}
