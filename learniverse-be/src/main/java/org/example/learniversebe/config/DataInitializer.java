package org.example.learniversebe.config;

import lombok.extern.slf4j.Slf4j;
import org.example.learniversebe.dto.request.RegisterRequest;
import org.example.learniversebe.enums.UserRole;
import org.example.learniversebe.model.Tag;
import org.example.learniversebe.repository.RoleUserRepository;
import org.example.learniversebe.repository.TagRepository;
import org.example.learniversebe.service.IAuthService;
import org.example.learniversebe.service.IRoleService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final IRoleService roleService;
    private final TagRepository tagRepository;
    private final RoleUserRepository roleUserRepository;
    private final IAuthService authService;


    public DataInitializer(IRoleService roleService,
                           TagRepository tagRepository,
                           RoleUserRepository roleUserRepository,
                           IAuthService authService) {
        this.authService = authService;
        this.roleService = roleService;
        this.roleUserRepository = roleUserRepository;
        this.tagRepository = tagRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println("DataInitializer run method executed.");
        initializeRoles();
        initializeTags();
        initOnlyOneAdmin();
    }

    private void initOnlyOneAdmin() {
        if (roleUserRepository.existsOneAdmin()) {
            log.debug("Exist admin user.");
        } else {
            authService.initAdmin(new RegisterRequest("admin1@gmail.com", "Admin1", "123456@A"));
            log.info("Created admin user.");
        }
    }

    private void initializeTags() {
        // Chỉ khởi tạo khi bảng tag đang rỗng
        if (tagRepository.count() > 0) {
            return;
        }

        String[] subjects = {
                "Toán học", "Ngữ văn", "Tiếng Anh", "Vật lý", "Hóa học",
                "Sinh học", "Lịch sử", "Địa lý", "Giáo dục công dân",
                "Tin học", "Công nghệ", "Khác"
        };

        List<Tag> tags = new ArrayList<>();

        LocalDateTime now = LocalDateTime.now();

        for (String name : subjects) {
            Tag tag = new Tag();
            tag.setId(UUID.randomUUID());
            tag.setName(name);
            tag.setCreatedAt(now);
            tag.setUpdatedAt(now);
            tags.add(tag);
        }

        tagRepository.saveAll(tags);
        System.out.println("Initialized default tags.");
    }

    private void initializeRoles() {
        List<UserRole> existingRoles = roleService.findAll().stream()
                .map(role -> role.getName())
                .toList();

        boolean createdAny = false;

        if (!existingRoles.contains(UserRole.ROLE_ADMIN)) {
            roleService.createNewRole(UserRole.ROLE_ADMIN);
            createdAny = true;
        }

        if (!existingRoles.contains(UserRole.ROLE_USER)) {
            roleService.createNewRole(UserRole.ROLE_USER);
            createdAny = true;
        }

        if (createdAny) {
            System.out.println("Initialized default roles.");
        }
        else {
            System.out.println("Roles already initialized.");
        }
    }
}
