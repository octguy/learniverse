package org.example.learniversebe.model.composite_key;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Embeddable
@Setter
@Getter
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContentTagId implements Serializable {
    @Column(name="content_id", columnDefinition = "uuid")
    private UUID contentId;

    @Column(name="tag_id", columnDefinition = "uuid")
    private UUID tagId;
}
