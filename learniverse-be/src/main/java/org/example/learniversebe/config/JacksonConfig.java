package org.example.learniversebe.config;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import org.springframework.boot.jackson.JsonComponent;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

/**
 * Custom Jackson serializer for LocalDateTime that adds timezone information.
 * 
 * Using @JsonComponent allows Spring Boot to auto-register this serializer
 * with the default ObjectMapper, preserving all Spring Boot defaults.
 */
@JsonComponent
public class JacksonConfig {

    // TODO: refactor the code to do away with this hacky implementation
    // aka not using LocalDateTime and actually guard against timezones

    private static final ZoneId SYSTEM_ZONE = ZoneId.systemDefault();
    private static final boolean IS_UTC = SYSTEM_ZONE.equals(ZoneOffset.UTC) 
            || SYSTEM_ZONE.getId().equals("UTC") 
            || SYSTEM_ZONE.getId().equals("Z");

    /**
     * Custom serializer that adds timezone info to LocalDateTime.
     * - For UTC: outputs "2026-01-22T10:30:45.123Z"
     * - For non-UTC: outputs "2026-01-22T10:30:45.123+07:00"
     */
    public static class LocalDateTimeSerializer extends JsonSerializer<LocalDateTime> {
        
        @Override
        public void serialize(LocalDateTime value, JsonGenerator gen, SerializerProvider serializers) 
                throws IOException {
            if (value == null) {
                gen.writeNull();
                return;
            }
            
            if (IS_UTC) {
                // For UTC, use 'Z' suffix
                gen.writeString(value.format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")));
            } else {
                // For non-UTC, convert to OffsetDateTime and include the offset
                OffsetDateTime offsetDateTime = value.atZone(SYSTEM_ZONE).toOffsetDateTime();
                gen.writeString(offsetDateTime.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
            }
        }
    }
}
