package org.example.learniversebe.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.example.learniversebe.dto.request.UserProfileRequest;
import org.example.learniversebe.model.UserProfile;
import org.example.learniversebe.service.IUserProfileService;
import org.example.learniversebe.service.implementation.UserProfileServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    @PostMapping("/onboard")
    public ResponseEntity<UserProfile> onboardProfile(@RequestBody UserProfileRequest request) {
        UserProfile profile = service.onboardProfile(request);
        return new ResponseEntity<>(profile, HttpStatus.CREATED);
    }

    @Operation(summary = "Get user profile")
    @GetMapping("/{userId}")
    public ResponseEntity<UserProfile> viewProfile(@PathVariable UUID userId) {
        UserProfile profile = service.viewProfile(userId);
        return ResponseEntity.ok(profile);
    }

    @Operation(summary = "Edit user profile")
    @PutMapping("/{userId}")
    public ResponseEntity<UserProfile> updateProfile(
            @PathVariable UUID userId,
            @RequestBody UserProfileRequest request
    ) {
        UserProfile updated = service.updateProfile(userId, request);
        return ResponseEntity.ok(updated);
    }
}
