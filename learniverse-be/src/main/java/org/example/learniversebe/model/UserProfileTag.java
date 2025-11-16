package org.example.learniversebe.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.example.learniversebe.model.composite_key.UserProfileTagId;

@Entity
@Table(name="user_profile_tag")
@Getter
@Setter
public class UserProfileTag {
    @EmbeddedId
    private UserProfileTagId userProfileTagId = new UserProfileTagId(); // initialize to avoid NullPointerException

    @ManyToOne
    @MapsId("userProfileId")
    @JoinColumn(name="user_profile_id", nullable = false)
    private UserProfile userProfile;

    @ManyToOne
    @MapsId("userTagId")
    @JoinColumn(name="user_tag_id", nullable = false)
    private UserTag userTag;
}
