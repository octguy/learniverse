# Adapted from: https://docs.spring.io/spring-boot/reference/packaging/container-images/dockerfiles.html

# BUILD STAGE
FROM gradle:9.2.0-jdk17-alpine AS build
COPY --chown=gradle:gradle . /home/gradle/src
WORKDIR /home/gradle/src
RUN gradle bootJar --no-daemon

# Extract the jar file using an efficient layout
WORKDIR /output
RUN cp /home/gradle/src/build/libs/*.jar /output/application.jar
RUN java -Djarmode=tools -jar application.jar extract --layers --destination extracted

# RUN STAGE
FROM eclipse-temurin:17.0.17_10-jre-alpine

ENV SERVER_PORT=8080

EXPOSE $SERVER_PORT

WORKDIR /app

# Copy the extracted jar contents from the builder container into the working directory in the runtime container
# Every copy step creates a new docker layer
# This allows docker to only pull the changes it really needs
COPY --from=build /output/extracted/dependencies/ ./
COPY --from=build /output/extracted/spring-boot-loader/ ./
COPY --from=build /output/extracted/snapshot-dependencies/ ./
COPY --from=build /output/extracted/application/ ./

ENTRYPOINT ["java", "-jar", "application.jar"]