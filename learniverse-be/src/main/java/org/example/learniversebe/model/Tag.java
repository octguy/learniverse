package org.example.learniversebe.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name="\"tags\"")
@Getter
@Setter
@NoArgsConstructor
@SQLDelete(sql = "UPDATE tags SET deleted_at = NOW() WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
public class Tag extends BaseEntity {
    @Id
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(length = 100, unique = true, nullable = false)
    private String name;

    @Column(length = 120, unique = true, nullable = false)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    @OneToMany(mappedBy = "tag", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ContentTag> contentTags = new HashSet<>();

    // Quan hệ ManyToMany với User (nếu cần user_tags)
    // @ManyToMany(mappedBy = "tags", fetch = FetchType.LAZY)
    // private Set<User> users = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        this.setCreatedAt(now);
        this.setUpdatedAt(now);
        if (this.slug == null && this.name != null) {
            this.slug = generateSlugFromName(this.name);
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.setUpdatedAt(LocalDateTime.now());
         if (this.slug == null || !this.slug.equals(generateSlugFromName(this.name))) {
             this.slug = generateSlugFromName(this.name);
         }
    }

    // Hàm helper tạo slug (ví dụ)
    private String generateSlugFromName(String name) {
        if (name == null) return null;
        return name.toLowerCase()
                .replaceAll("\\s+", "-")
                .replaceAll("[^a-z0-9\\-]", "")
                + "-" + UUID.randomUUID().toString().substring(0, 4); // Thêm phần ngẫu nhiên để tránh trùng
    }
}
