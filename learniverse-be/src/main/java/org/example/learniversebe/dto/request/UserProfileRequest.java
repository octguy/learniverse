package org.example.learniversebe.dto.request;

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
    private String display_name;
    private String bio;
    private String avatar_url;
    private Set<UserProfileTag> userTags = new HashSet<>();
}
