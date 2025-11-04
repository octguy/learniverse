package org.example.learniversebe.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.example.learniversebe.model.composite_key.UserProfileTagId;

@Entity
@Table(name="user_profile_tag")
@IdClass(UserProfileTagId.class)
@Getter
@Setter
public class UserProfileTag {
    @EmbeddedId
    private UserProfileTagId userProfileTagId = new UserProfileTagId(); // initialize to avoid NullPointerException

    @ManyToOne
    @MapsId("userId")
    @JoinColumn(name="user_id", referencedColumnName = "id", nullable = false)
    private User user;

    @ManyToOne
    @MapsId("userTagId")
    @JoinColumn(name="user_tag_id", referencedColumnName = "id", nullable = false)
    private UserTag userTag;
}
