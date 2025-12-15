package org.example.learniversebe.service.implementation;

import org.example.learniversebe.dto.response.UserTagResponse;
import org.example.learniversebe.repository.UserTagRepository;
import org.example.learniversebe.service.IUserTagService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserTagServiceImpl implements IUserTagService {

    @Autowired
    private UserTagRepository userTagRepository;
    @Override
    public List<UserTagResponse> getAllUserTags() {
        return userTagRepository.findAll().stream()
                .map(userTag -> UserTagResponse.builder()
                        .id(userTag.getId())
                        .name(userTag.getName())
                        .build())
                .toList();
    }
}
