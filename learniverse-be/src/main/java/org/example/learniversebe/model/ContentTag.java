package org.example.learniversebe.model;

import jakarta.persistence.*;
import lombok.*;
import org.example.learniversebe.model.composite_key.ContentTagId;
import org.example.learniversebe.model.composite_key.RoleUserId;

@Entity
@Table(name="content_tag")
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ContentTag extends BaseEntity {

    @EmbeddedId
    private ContentTagId contentTagId = new ContentTagId(); // initialize to avoid NullPointerException

    @ManyToOne
    @MapsId("contentId")
    @JoinColumn(name="content_id", referencedColumnName = "id", nullable = false)
    private Content content;

    @ManyToOne
    @MapsId("tagId")
    @JoinColumn(name="tag_id", referencedColumnName = "id", nullable = false)
    private Tag tag;
}
