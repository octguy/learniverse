package org.example.learniversebe.service;

import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.Map;

public interface IStorageService {
    Map<String, String> uploadFile(MultipartFile file) throws IOException;
    
    /**
     * Delete a file from storage by its public ID/key
     * @param publicId The public ID or storage key of the file
     * @return true if deletion was successful
     */
    boolean deleteFile(String publicId) throws IOException;
}