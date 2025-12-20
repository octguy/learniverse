package org.example.learniversebe.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.example.learniversebe.model.User;
import org.example.learniversebe.model.UserProfileTag;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
public class UserProfileRequest {

    @NotBlank(message = "Display name is required")
    private String displayName;

    @NotBlank(message = "Bio is required")
    private String bio;

    private Set<UUID> interestTagIds = new HashSet<>();

    private Set<UUID> skillTagIds = new HashSet<>();
}
