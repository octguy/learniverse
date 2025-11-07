package org.example.learniversebe;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class LearniverseBeApplication {

	public static void main(String[] args) {
		System.out.println("JWT SECRET EXPIRATION = " + System.getenv("SPRING_JWT_SECRET_KEY_EXPIRATION"));
		SpringApplication.run(LearniverseBeApplication.class, args);
	}

}