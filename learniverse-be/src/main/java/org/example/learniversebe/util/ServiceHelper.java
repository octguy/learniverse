package org.example.learniversebe.util;

import org.example.learniversebe.enums.UserRole;
import org.example.learniversebe.exception.UnauthorizedException;
import org.example.learniversebe.model.CustomUserDetails;
import org.example.learniversebe.model.User;
import org.example.learniversebe.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component // Để có thể inject vào các Service khác
public class ServiceHelper {

    private final UserRepository userRepository;

    public ServiceHelper(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Lấy đối tượng Authentication của người dùng hiện tại từ Security Context.
     * @return Authentication object, or null if no user is authenticated.
     */
    public Authentication getCurrentAuthentication() {
        return SecurityContextHolder.getContext().getAuthentication();
    }

    /**
     * Lấy thông tin chi tiết (UserDetails) của người dùng hiện tại.
     * @return CustomUserDetails if authenticated, null otherwise.
     */
    public CustomUserDetails getCurrentUserDetails() {
        Authentication authentication = getCurrentAuthentication();
        if (authentication != null && authentication.isAuthenticated() && authentication.getPrincipal() instanceof CustomUserDetails) {
            return (CustomUserDetails) authentication.getPrincipal();
        }
        return null; // Hoặc ném UnauthorizedException nếu yêu cầu bắt buộc đăng nhập
    }

    /**
     * Lấy Entity User của người dùng hiện tại đang đăng nhập.
     * Ném UnauthorizedException nếu không có người dùng nào đăng nhập.
     * @return User entity.
     * @throws UnauthorizedException if no user is authenticated.
     */
    public User getCurrentUser() {
        CustomUserDetails userDetails = getCurrentUserDetails();
        if (userDetails == null || userDetails.getUser() == null) {
            throw new UnauthorizedException("User not authenticated");
        }
        // Lấy lại từ DB để đảm bảo dữ liệu mới nhất (tùy chọn, có thể dùng trực tiếp userDetails.getUser())
        return userRepository.findById(userDetails.getUser().getId())
                .orElseThrow(() -> new UnauthorizedException("Authenticated user not found in database"));
        // return userDetails.getUser(); // Hoặc trả về trực tiếp nếu không cần load lại
    }

    /**
     * Lấy ID của người dùng hiện tại đang đăng nhập.
     * Trả về null nếu không có ai đăng nhập.
     * @return UUID of the current user or null.
     */
    public UUID getCurrentUserId() {
        CustomUserDetails userDetails = getCurrentUserDetails();
        return (userDetails != null && userDetails.getUser() != null) ? userDetails.getUser().getId() : null;
    }

    /**
     * Kiểm tra xem người dùng hiện tại có phải là tác giả của một đối tượng nào đó không.
     * @param authorId ID của tác giả cần kiểm tra.
     * @return true nếu người dùng hiện tại là tác giả, false nếu không hoặc không đăng nhập.
     */
    public boolean isCurrentUserAuthor(UUID authorId) {
        UUID currentUserId = getCurrentUserId();
        return currentUserId != null && currentUserId.equals(authorId);
    }

    /**
     * Đảm bảo người dùng hiện tại là tác giả, nếu không ném UnauthorizedException.
     * @param authorId ID của tác giả cần kiểm tra.
     * @param action Mô tả hành động đang thực hiện (ví dụ: "update post", "delete comment").
     * @throws UnauthorizedException nếu người dùng hiện tại không phải tác giả hoặc chưa đăng nhập.
     */
    public void ensureCurrentUserIsAuthor(UUID authorId, String action) {
        if (!isCurrentUserAuthor(authorId)) {
            throw new UnauthorizedException("User is not authorized to " + action);
        }
    }

    // Có thể thêm các hàm kiểm tra quyền khác (isAdmin, isModerator) ở đây
    // public boolean isCurrentUserAdmin() { ... }

    /**
     * Check if user is admin
     */
    public boolean isUserAdmin(UUID userId) {
        if (userId == null) return false;

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return false;

        return user.getRoleUsers().stream()
                .anyMatch(roleUser -> UserRole.ROLE_ADMIN == roleUser.getRole().getName());
    }
}
