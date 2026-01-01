package org.example.learniversebe.service.implementation;

import lombok.extern.slf4j.Slf4j;
import org.example.learniversebe.exception.UserNotFoundException;
import org.example.learniversebe.model.AuthCredential;
import org.example.learniversebe.model.CustomUserDetails;
import org.example.learniversebe.model.User;
import org.example.learniversebe.repository.AuthCredentialRepository;
import org.example.learniversebe.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;
    private final AuthCredentialRepository authCredentialRepository;

    public UserDetailsServiceImpl(UserRepository userRepository, AuthCredentialRepository authCredentialRepository) {
        this.authCredentialRepository = authCredentialRepository;
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) { // load by email indeed :D
        log.debug("Loading user by email: {}", email);
        User user = userRepository.findByEmailWithRoles(email) // fetch roles eagerly
                .orElseThrow(() -> new UserNotFoundException("User with email " + email + " not found"));

//        System.out.println(user.getEmail());
//        for (RoleUser ru : user.getRoleUsers()) {
//            System.out.println(ru.getRole().getName());
//        }

        AuthCredential authCredential = authCredentialRepository.findByUser(user)
                .orElseThrow(() -> new UserNotFoundException("Credentials for user with email " + email + " not found"));
        return new CustomUserDetails(user, authCredential.getPassword());
    }
}