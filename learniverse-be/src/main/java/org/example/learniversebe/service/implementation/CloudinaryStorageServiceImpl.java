package org.example.learniversebe.service.implementation;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.example.learniversebe.exception.BadRequestException;
import org.example.learniversebe.service.IStorageService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CloudinaryStorageServiceImpl implements IStorageService {

    private final Cloudinary cloudinary;

    // Validate constants
    private final long MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
    private final long MAX_PDF_SIZE = 15 * 1024 * 1024;  // 15MB
    private final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList("image/jpeg", "image/png", "image/gif", "image/webp");
    private final String PDF_TYPE = "application/pdf";

    @Override
    public Map<String, String> uploadFile(MultipartFile file) throws IOException {
        validateFile(file);
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "resource_type", "auto",
                "folder", "learniverse/posts"
        ));

        return Map.of(
                "url", (String) uploadResult.get("secure_url"),
                "key", (String) uploadResult.get("public_id")
        );
    }

    private void validateFile(MultipartFile file) {
        String contentType = file.getContentType();
        long size = file.getSize();

        if (ALLOWED_IMAGE_TYPES.contains(contentType)) {
            if (size > MAX_IMAGE_SIZE) throw new BadRequestException("Image size exceeds 5MB limit");
        } else if (PDF_TYPE.equals(contentType)) {
            if (size > MAX_PDF_SIZE) throw new BadRequestException("PDF size exceeds 15MB limit");
        } else {
            throw new BadRequestException("Unsupported file type: " + contentType);
        }
    }
}