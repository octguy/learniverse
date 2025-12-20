// File: learniversebe/mapper/NotificationMapper.java
package org.example.learniversebe.mapper;

import org.example.learniversebe.dto.response.NotificationResponse;
import org.example.learniversebe.model.Notification;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface NotificationMapper {

    @Mapping(source = "sender.id", target = "senderId")
    @Mapping(source = "sender.username", target = "senderName")
    @Mapping(source = "sender.userProfile.avatarUrl", target = "senderAvatarUrl")
    NotificationResponse toResponse(Notification notification);
}