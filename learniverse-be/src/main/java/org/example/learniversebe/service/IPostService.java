package org.example.learniversebe.service;

import org.example.learniversebe.dto.request.CreatePostRequest;
import org.example.learniversebe.dto.response.ContentResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface IPostService {
    ContentResponse createPost(CreatePostRequest request);
    ContentResponse getPostById(UUID id);
    ContentResponse getPostBySlug(String slug);
    Page<ContentResponse> getAllPosts(Pageable pageable);
    // Thêm các phương thức khác: updatePost, deletePost, addComment, vote, bookmark,...
}

