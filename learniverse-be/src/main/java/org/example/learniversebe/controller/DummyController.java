package org.example.learniversebe.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


// This class is just for testing purposes to know if the roles-based authentication is working fine =D
@RequestMapping("/api/v1/dummy")
@RestController
public class DummyController {

    @GetMapping("/hello")
    public String hello() {
        return "Hello, World!";
    }
}
