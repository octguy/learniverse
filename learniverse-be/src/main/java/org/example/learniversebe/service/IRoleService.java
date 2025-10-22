package org.example.learniversebe.service;

import org.example.learniversebe.enums.UserRole;
import org.example.learniversebe.model.Role;

import java.util.List;

public interface IRoleService {

    List<Role> findAll();

    void createNewRole(UserRole role);
}
