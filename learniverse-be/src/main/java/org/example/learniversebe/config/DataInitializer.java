package org.example.learniversebe.config;

import org.example.learniversebe.enums.UserRole;
import org.example.learniversebe.service.IRoleService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final IRoleService roleService;

    public DataInitializer(IRoleService roleService) {
        this.roleService = roleService;
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println("DataInitializer run method executed.");
        initializeRoles();
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
