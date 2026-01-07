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
    private final long MAX_IMAGE_SIZE = 5 * 1024 * 1024;
    private final long MAX_PDF_SIZE = 15 * 1024 * 1024;  // 15MB
    private final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList("image/jpeg", "image/png", "image/gif", "image/webp");
    private final String PDF_TYPE = "application/pdf";

    @Override
    public Map<String, String> uploadFile(MultipartFile file) throws IOException {
        validateFile(file);

        String contentType = file.getContentType();
        String resourceType = "auto";
        String publicId = UUID.randomUUID().toString();


        if (contentType != null && contentType.startsWith("image/")) {
            resourceType = "image";
            String extension = getFileExtension(file.getOriginalFilename());
            if (!extension.isEmpty()) {
                publicId = publicId + "." + extension;
            }
        } else if (PDF_TYPE.equals(contentType)) {
            resourceType = "raw";
            // CRITICAL: PDF phải có extension để mở được
            publicId = publicId + ".pdf";
        } else {
            resourceType = "raw";
            // Các file khác cũng nên có extension
            String extension = getFileExtension(file.getOriginalFilename());
            if (!extension.isEmpty()) {
                publicId = publicId + "." + extension;
            }
        }

        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "resource_type", resourceType,
                "folder", "learniverse/posts",
                "public_id", publicId
        ));

        return Map.of(
                "url", (String) uploadResult.get("secure_url"),
                "key", (String) uploadResult.get("public_id")
        );
    }

    @Override
    public boolean deleteFile(String publicId) throws IOException {
        try {
            // Determine resource type based on public_id or try both
            Map result = cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", "image"));
            String deleteResult = (String) result.get("result");
            
            if (!"ok".equals(deleteResult)) {
                // Try as raw (for PDFs and other files)
                result = cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", "raw"));
                deleteResult = (String) result.get("result");
            }
            return "ok".equals(deleteResult);
        } catch (Exception e) {
            throw new IOException("Failed to delete file: " + e.getMessage(), e);
        }
    }
    
    /**
     * Extract file extension từ filename
     */
    private String getFileExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            return "";
        }
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex > 0 && lastDotIndex < filename.length() - 1) {
            String ext = filename.substring(lastDotIndex + 1).toLowerCase();
            // Validate extension
            List<String> allowedExtensions = Arrays.asList("pdf", "jpg", "jpeg", "png", "gif", "webp");
            if (allowedExtensions.contains(ext)) {
                return ext;
            }
        }
        return "";
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