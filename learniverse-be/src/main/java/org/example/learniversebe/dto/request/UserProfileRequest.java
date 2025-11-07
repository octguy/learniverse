package org.example.learniversebe.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.example.learniversebe.model.User;
import org.example.learniversebe.model.UserProfileTag;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
public class UserProfileRequest {
    private UUID id;

    @JsonProperty("display_name")
    private String displayName;

    private String bio;

    @JsonProperty("avatar_url")
    private String avatarUrl;

    private Set<UserProfileTagRequest> userTags = new HashSet<>();
}
