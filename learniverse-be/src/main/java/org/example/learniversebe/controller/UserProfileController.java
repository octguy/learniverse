package org.example.learniversebe.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.example.learniversebe.dto.request.UserProfileRequest;
import org.example.learniversebe.model.UserProfile;
import org.example.learniversebe.service.IUserProfileService;
import org.example.learniversebe.service.implementation.UserProfileServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequestMapping("/api/v1/user_profile")
@RestController
@Tag(name = "UserProfile", description = "Endpoints for user profile onboard")
public class UserProfileController {
    private final IUserProfileService service;

    public UserProfileController(IUserProfileService service) {
        this.service = service;
    }

    @PostMapping("/onboard")
    public ResponseEntity<UserProfile> onboardProfile(@RequestBody UserProfileRequest request) {
        UserProfile profile = service.onboardProfile(request);
        return new ResponseEntity<>(profile, HttpStatus.CREATED);
    }
}
