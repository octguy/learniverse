package org.example.learniversebe.config;

import org.example.learniversebe.enums.UserRole;
import org.example.learniversebe.model.UserTag;
import org.example.learniversebe.repository.UserTagRepository;
import org.example.learniversebe.service.IRoleService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class DataInitializer implements CommandLineRunner {

    private final IRoleService roleService;
    private final UserTagRepository userTagRepository;

    public DataInitializer(IRoleService roleService, UserTagRepository userTagRepository) {
        this.roleService = roleService;
        this.userTagRepository = userTagRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println("DataInitializer run method executed.");
        initializeRoles();
        initializeUserTags();
    }

    private void initializeUserTags() {
        String[] subjects = {
                "Toán học", "Ngữ văn", "Tiếng Anh", "Vật lý", "Hóa học",
                "Sinh học", "Lịch sử", "Địa lý", "Giáo dục công dân", "Tin học", "Công nghệ", "Khác"
        };

        for (String name : subjects) {
            if (!userTagRepository.existsByName(name)) {
                UserTag tag = new UserTag();
                tag.setId(UUID.randomUUID());
                tag.setName(name);
                tag.setCreatedAt(java.time.LocalDateTime.now());
                tag.setUpdatedAt(java.time.LocalDateTime.now());
                userTagRepository.save(tag);
            }
        }
        System.out.println("Initialized default user tags.");
    }

    private void initializeRoles() {
        // Add role initialization logic here if needed
        if (roleService.findAll().isEmpty()) {
            roleService.createNewRole(UserRole.ROLE_ADMIN);
            roleService.createNewRole(UserRole.ROLE_USER);
            roleService.createNewRole(UserRole.ROLE_MODERATOR);
            System.out.println("Initialized default roles.");
        }
        else {
            System.out.println("Roles already initialized.");
        }
    }
}
