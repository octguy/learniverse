package org.example.learniversebe.service;

import org.example.learniversebe.dto.request.SharePostRequest;
import org.example.learniversebe.dto.response.PostResponse;

public interface IShareService {
    /**
     * Share bài viết lên Newsfeed (Tạo Post mới tham chiếu bài cũ)
     */
    PostResponse shareToFeed(SharePostRequest request);

    /**
     * Copy link hoặc share qua message (Chỉ tăng count và log, không tạo Post trên feed)
     */
    void trackShareAction(SharePostRequest request);
}