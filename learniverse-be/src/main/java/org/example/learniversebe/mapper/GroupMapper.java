package org.example.learniversebe.mapper;

import org.example.learniversebe.dto.response.GroupMemberResponse;
import org.example.learniversebe.dto.response.GroupResponse;
import org.example.learniversebe.dto.response.GroupSummaryResponse;
import org.example.learniversebe.dto.response.GroupJoinRequestResponse;
import org.example.learniversebe.dto.response.PageResponse;
import org.example.learniversebe.model.Group;
import org.example.learniversebe.model.GroupMember;
import org.example.learniversebe.model.GroupJoinRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.data.domain.Page;

import java.util.List;

@Mapper(componentModel = "spring", uses = {TagMapper.class, UserMapper.class})
public interface GroupMapper {

    @Mapping(target = "tags", expression = "java(tagMapper.groupTagsToTagResponses(group.getGroupTags()))")
    @Mapping(target = "isMember", ignore = true)
    @Mapping(target = "hasPendingRequest", ignore = true)
    @Mapping(target = "currentUserRole", ignore = true)
    GroupResponse groupToGroupResponse(Group group);

    @Mapping(target = "tags", expression = "java(tagMapper.groupTagsToTagResponses(group.getGroupTags()))")
    @Mapping(target = "isMember", ignore = true)
    @Mapping(target = "hasPendingRequest", ignore = true)
    GroupSummaryResponse groupToGroupSummaryResponse(Group group);
    
    TagMapper tagMapper = org.mapstruct.factory.Mappers.getMapper(TagMapper.class);

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "username", source = "user.username")
    @Mapping(target = "displayName", source = "user.userProfile.displayName")
    @Mapping(target = "avatarUrl", source = "user.userProfile.avatarUrl")
    GroupMemberResponse groupMemberToGroupMemberResponse(GroupMember groupMember);

    @Mapping(target = "groupId", source = "group.id")
    @Mapping(target = "groupName", source = "group.name")
    GroupJoinRequestResponse groupJoinRequestToResponse(GroupJoinRequest request);

    List<GroupSummaryResponse> groupsToGroupSummaryResponses(List<Group> groups);

    List<GroupMemberResponse> groupMembersToResponses(List<GroupMember> members);

    default PageResponse<GroupSummaryResponse> groupPageToPageResponse(Page<Group> page) {
        return PageResponse.<GroupSummaryResponse>builder()
                .content(groupsToGroupSummaryResponses(page.getContent()))
                .currentPage(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }

    default PageResponse<GroupMemberResponse> memberPageToPageResponse(Page<GroupMember> page) {
        return PageResponse.<GroupMemberResponse>builder()
                .content(groupMembersToResponses(page.getContent()))
                .currentPage(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }
}
