package org.example.learniversebe.service.implementation;

import org.example.learniversebe.exception.UserNotFoundException;
import org.example.learniversebe.model.AuthCredential;
import org.example.learniversebe.model.CustomUserDetails;
import org.example.learniversebe.model.User;
import org.example.learniversebe.repository.AuthCredentialRepository;
import org.example.learniversebe.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;

import java.util.List;

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
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User with email " + email + " not found"));
        AuthCredential authCredential = authCredentialRepository.findByUser(user)
                .orElseThrow(() -> new UserNotFoundException("Credentials for user with email " + email + " not found"));
        return new CustomUserDetails(user, authCredential.getPassword(), List.of());
    }
}
