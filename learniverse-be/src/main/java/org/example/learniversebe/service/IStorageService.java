package org.example.learniversebe.service;

import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.Map;

public interface IStorageService {
    Map<String, String> uploadFile(MultipartFile file) throws IOException;
    //deleteFile(String url) (Nếu cần)
}