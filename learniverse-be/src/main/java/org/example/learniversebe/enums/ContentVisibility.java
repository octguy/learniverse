package org.example.learniversebe.enums;

public enum ContentVisibility {
    PUBLIC,        // Ai cũng xem được
    FRIENDS_ONLY,  // Chỉ friends xem được
    PRIVATE,       // Chỉ mình author xem được
    GROUP          // Visibility theo group (PUBLIC group -> public, PRIVATE group -> chỉ members)
}