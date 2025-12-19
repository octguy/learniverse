package org.example.learniversebe;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableJpaRepositories(basePackages = "org.example.learniversebe.repository")
public class LearniverseBeApplication {

	public static void main(String[] args) {
		SpringApplication.run(LearniverseBeApplication.class, args);
	}

}