package org.example.learniversebe.service;

import lombok.extern.slf4j.Slf4j;
import org.example.learniversebe.dto.request.AiModerationRequest;
import org.example.learniversebe.dto.response.AiModerationResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@Slf4j
public class ContentModerationService {

    @Value("${ai.service.url}")
    private String aiServiceUrl;

    private final RestTemplate restTemplate;

    public ContentModerationService() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * Kiểm tra nội dung có an toàn không.
     * @param text Nội dung cần kiểm tra
     * @return true nếu an toàn (hoặc lỗi server AI), false nếu độc hại
     */
    public boolean isContentSafe(String text) {
        if (text == null || text.trim().isEmpty()) {
            return true;
        }

        try {
            String endpoint = aiServiceUrl + "/predict";

            // Tạo request header & body
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            AiModerationRequest requestPayload = new AiModerationRequest(text);
            HttpEntity<AiModerationRequest> entity = new HttpEntity<>(requestPayload, headers);

            // Gọi API
            ResponseEntity<AiModerationResponse> response = restTemplate.postForEntity(
                    endpoint,
                    entity,
                    AiModerationResponse.class
            );

            // Xử lý kết quả
            if (response.getBody() != null && response.getBody().isSuccess()) {
                boolean isFlagged = response.getBody().getResult().isFlagged();
                log.info("Comment này: {}", response.getBody().getResult());
                if (isFlagged) {
                    log.warn("Toxic content founded: {}", text);
                    return false;
                }
                return true;
            }

        } catch (Exception e) {
            // Fail-open strategy: Nếu server AI lỗi, tạm thời cho qua để không chặn user
            // Nhưng cần log ERROR để dev biết mà sửa
            log.error("Error when fetching AI Service: {}", e.getMessage());
            return true;
        }

        return true;
    }
}