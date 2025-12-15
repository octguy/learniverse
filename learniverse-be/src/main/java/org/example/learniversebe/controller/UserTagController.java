package org.example.learniversebe.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.example.learniversebe.dto.response.UserTagResponse;
import org.example.learniversebe.service.IUserTagService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/user-tags")
@Tag(name = "UserTag", description = "Endpoints for user tag")
public class UserTagController {

    @Autowired
    private IUserTagService userTagService;

    @GetMapping("/all")
    public List<UserTagResponse> getAllUserTags() {
        return userTagService.getAllUserTags();
    }
}