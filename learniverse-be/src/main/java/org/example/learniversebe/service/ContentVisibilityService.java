package org.example.learniversebe.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.learniversebe.enums.ContentVisibility;
import org.example.learniversebe.enums.GroupPrivacy;
import org.example.learniversebe.model.Content;
import org.example.learniversebe.repository.FriendRepository;
import org.example.learniversebe.repository.GroupMemberRepository;
import org.example.learniversebe.util.ServiceHelper;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ContentVisibilityService {

    private final FriendRepository friendRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final ServiceHelper serviceHelper;

    /**
     * Check if a user can view a specific content based on visibility rules
     *
     * @param userId User ID (null if not authenticated)
     * @param content Content to check
     * @return true if user can view, false otherwise
     */
    public boolean canUserViewContent(UUID userId, Content content) {
        if (content == null) {
            return false;
        }

        // Admin luôn có quyền xem
        if (userId != null && serviceHelper.isUserAdmin(userId)) {
            return true;
        }

        // Author luôn xem được content của mình
        if (content.getAuthor().getId().equals(userId)) {
            return true;
        }

        ContentVisibility visibility = content.getVisibility();

        return switch (visibility) {
            case PUBLIC -> true; // Ai cũng xem được

            case FRIENDS_ONLY -> {
                // Cần đăng nhập và là bạn bè với author
                if (userId == null) {
                    yield false;
                }
                yield friendRepository.areFriends(userId, content.getAuthor().getId());
            }

            case PRIVATE -> false; // Chỉ author và admin (đã check ở trên)

            case GROUP -> {
                // Kiểm tra group privacy
                if (content.getGroup() == null) {
                    log.warn("Content {} has GROUP visibility but no group assigned", content.getId());
                    yield false;
                }

                GroupPrivacy groupPrivacy = content.getGroup().getPrivacy();

                if (groupPrivacy == GroupPrivacy.PUBLIC) {
                    // Group public -> ai cũng xem được
                    yield true;
                } else {
                    // Group private/secret -> chỉ members xem được
                    if (userId == null) {
                        yield false;
                    }
                    yield groupMemberRepository.isUserMemberOfGroup(userId, content.getGroup().getId());
                }
            }
        };
    }

    /**
     * Validate if user can create content with specific visibility in a group
     */
    public void validateVisibilityForGroupPost(UUID groupId, ContentVisibility requestedVisibility) {
        if (groupId != null && requestedVisibility != null && requestedVisibility != ContentVisibility.GROUP) {
            throw new IllegalArgumentException(
                    "When posting in a group, visibility must be GROUP or null (auto-set to GROUP)"
            );
        }
    }

    /**
     * Validate if user can update content visibility
     * Ví dụ: Không cho đổi visibility nếu content trong group
     */
    public void validateVisibilityUpdate(Content content, ContentVisibility newVisibility) {
        if (content.getGroup() != null && newVisibility != ContentVisibility.GROUP) {
            throw new IllegalArgumentException(
                    "Cannot change visibility of group post. Group posts must have GROUP visibility"
            );
        }
    }
}