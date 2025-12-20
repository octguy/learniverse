package org.example.learniversebe.mapper;

import org.example.learniversebe.dto.response.UserProfileResponse;
import org.example.learniversebe.dto.response.UserResponse;
import org.example.learniversebe.model.User;
import org.example.learniversebe.model.UserProfile;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

import java.util.List;
import java.util.Set;

/**
 * Mapper interface for converting between User entity and User DTOs.
 * Uses MapStruct for code generation.
 * componentModel = "spring" allows this mapper to be injected as a Spring Bean.
 */
@Mapper(componentModel = "spring")
public interface UserMapper {

    /**
     * Maps a User entity to a UserResponse DTO.
     * Ignores avatarUrl for now, assuming it will be added to the User entity later.
     * @param user The User entity to map.
     * @return The corresponding UserResponse DTO.
     */
    // TODO: Map avatarUrl when the User entity includes profile information or avatar URL directly.
    @Mapping(target = "avatarUrl", ignore = true)
    UserResponse toUserResponse(User user);

    /**
     * Maps a List of User entities to a List of UserResponse DTOs.
     * @param users The list of User entities.
     * @return The list of UserResponse DTOs.
     */
    List<UserResponse> toUserResponseList(List<User> users);

    /**
     * Maps a Set of User entities to a Set of UserResponse DTOs.
     * @param users The set of User entities.
     * @return The set of UserResponse DTOs.
     */
    Set<UserResponse> toUserResponseSet(Set<User> users);
    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user.username", target = "username")
    UserProfileResponse toProfileResponse(UserProfile userProfile);
}