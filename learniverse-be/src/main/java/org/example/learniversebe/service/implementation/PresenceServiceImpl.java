package org.example.learniversebe.service.implementation;

import lombok.extern.slf4j.Slf4j;
import org.example.learniversebe.dto.websocket.UserStatusDTO;
import org.example.learniversebe.service.IPresenceService;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class PresenceServiceImpl implements IPresenceService {

    private static final String TYPING_KEY_PREFIX = "typing:";
    private static final String ONLINE_KEY_PREFIX = "online:";
    private static final String LAST_SEEN_KEY_PREFIX = "last_seen:";
    private static final int TYPING_TIMEOUT_SECONDS = 5;
    private static final int ONLINE_TIMEOUT_SECONDS = 300; // 5 minutes

    private final RedisTemplate<String, Object> redisTemplate;

    public PresenceServiceImpl(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public void setUserTyping(UUID chatRoomId, UUID userId, String username, boolean isTyping) {
        String key = TYPING_KEY_PREFIX + chatRoomId + ":" + userId;
        
        if (isTyping) {
            redisTemplate.opsForValue().set(key, username, TYPING_TIMEOUT_SECONDS, TimeUnit.SECONDS);
            log.debug("User {} is typing in chat room {}", username, chatRoomId);
        } else {
            redisTemplate.delete(key);
            log.debug("User {} stopped typing in chat room {}", username, chatRoomId);
        }
    }

    @Override
    public void setUserOnline(UUID userId, String username) {
        String onlineKey = ONLINE_KEY_PREFIX + userId;
        redisTemplate.opsForValue().set(onlineKey, username, ONLINE_TIMEOUT_SECONDS, TimeUnit.SECONDS);
        log.info("User {} is now online", username);
    }

    @Override
    public void setUserOffline(UUID userId) {
        String onlineKey = ONLINE_KEY_PREFIX + userId;
        String lastSeenKey = LAST_SEEN_KEY_PREFIX + userId;
        
        redisTemplate.delete(onlineKey);
        redisTemplate.opsForValue().set(lastSeenKey, LocalDateTime.now().toString());
        
        log.info("User {} is now offline", userId);
    }

    @Override
    public UserStatusDTO getUserStatus(UUID userId) {
        String onlineKey = ONLINE_KEY_PREFIX + userId;
        String lastSeenKey = LAST_SEEN_KEY_PREFIX + userId;
        
        String username = (String) redisTemplate.opsForValue().get(onlineKey);
        boolean isOnline = username != null;
        
        LocalDateTime lastSeen = null;
        if (!isOnline) {
            String lastSeenStr = (String) redisTemplate.opsForValue().get(lastSeenKey);
            if (lastSeenStr != null) {
                lastSeen = LocalDateTime.parse(lastSeenStr);
            }
        }
        
        return new UserStatusDTO(userId, username, isOnline, lastSeen);
    }
}
