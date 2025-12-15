package org.example.learniversebe.service;

import org.example.learniversebe.dto.response.UserTagResponse;

import java.util.List;

public interface IUserTagService {
    List<UserTagResponse> getAllUserTags();
}
