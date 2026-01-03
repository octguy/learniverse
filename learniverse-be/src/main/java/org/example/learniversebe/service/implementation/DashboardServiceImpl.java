package org.example.learniversebe.service.implementation;

import lombok.RequiredArgsConstructor;
import org.example.learniversebe.dto.response.*;
import org.example.learniversebe.enums.ContentType;
import org.example.learniversebe.enums.DashboardPeriod;
import org.example.learniversebe.model.User;
import org.example.learniversebe.repository.ContentRepository;
import org.example.learniversebe.repository.TagRepository;
import org.example.learniversebe.repository.UserRepository;
import org.example.learniversebe.service.IDashboardService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements IDashboardService {

    private final UserRepository userRepository;
    private final ContentRepository contentRepository;
    private final TagRepository tagRepository;

    private static final int PAGE_SIZE = 20;

    @Override
    public DashboardStatsResponse getStats() {
        long totalUsers = userRepository.count();
        
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        long newUsersToday = userRepository.countNewUsersInRange(startOfDay, endOfDay);
        
        long totalPosts = contentRepository.countByContentType(ContentType.POST);
        long totalQuestions = contentRepository.countByContentType(ContentType.QUESTION);

        return DashboardStatsResponse.builder()
                .totalUsers(totalUsers)
                .newUsersToday(newUsersToday)
                .totalPosts(totalPosts)
                .totalQuestions(totalQuestions)
                .build();
    }

    @Override
    public UserGrowthResponse getUserGrowth(DashboardPeriod period) {
        List<Object[]> results = switch (period) {
            case DAY -> userRepository.findUserGrowthByDay();
            case MONTH -> userRepository.findUserGrowthByMonth();
            case YEAR -> userRepository.findUserGrowthByYear();
        };

        List<UserGrowthResponse.GrowthDataPoint> dataPoints = mapToGrowthDataPoints(results);

        return UserGrowthResponse.builder()
                .period(period.name())
                .data(dataPoints)
                .build();
    }

    private List<UserGrowthResponse.GrowthDataPoint> mapToGrowthDataPoints(List<Object[]> results) {
        List<UserGrowthResponse.GrowthDataPoint> dataPoints = new ArrayList<>();
        for (Object[] row : results) {
            dataPoints.add(UserGrowthResponse.GrowthDataPoint.builder()
                    .label((String) row[0])
                    .count(((Number) row[1]).longValue())
                    .build());
        }
        return dataPoints;
    }

    @Override
    public ContentComparisonResponse getContentComparison(DashboardPeriod period) {
        List<Object[]> results = switch (period) {
            case DAY -> contentRepository.findContentComparisonByDay();
            case MONTH -> contentRepository.findContentComparisonByMonth();
            case YEAR -> contentRepository.findContentComparisonByYear();
        };

        List<ContentComparisonResponse.ComparisonDataPoint> dataPoints = mapToComparisonDataPoints(results);

        return ContentComparisonResponse.builder()
                .period(period.name())
                .data(dataPoints)
                .build();
    }

    private List<ContentComparisonResponse.ComparisonDataPoint> mapToComparisonDataPoints(List<Object[]> results) {
        List<ContentComparisonResponse.ComparisonDataPoint> dataPoints = new ArrayList<>();
        for (Object[] row : results) {
            dataPoints.add(ContentComparisonResponse.ComparisonDataPoint.builder()
                    .label((String) row[0])
                    .postCount(((Number) row[1]).longValue())
                    .questionCount(((Number) row[2]).longValue())
                    .build());
        }
        return dataPoints;
    }

    @Override
    public List<TopTagResponse> getTopTags() {
        List<Object[]> results = tagRepository.findTop5MostUsedTags();

        List<TopTagResponse> topTags = new ArrayList<>();
        for (Object[] row : results) {
            topTags.add(TopTagResponse.builder()
                    .id((UUID) row[0])
                    .name((String) row[1])
                    .slug((String) row[2])
                    .usageCount(((Number) row[3]).longValue())
                    .build());
        }

        return topTags;
    }

    @Override
    public PageResponse<NewUserResponse> getNewestUsers(int page) {
        Pageable pageable = PageRequest.of(page, PAGE_SIZE, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> userPage = userRepository.findAll(pageable);

        List<NewUserResponse> users = userPage.getContent().stream()
                .map(user -> NewUserResponse.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .createdAt(user.getCreatedAt())
                        .status(user.getStatus())
                        .build())
                .toList();

        return PageResponse.<NewUserResponse>builder()
                .content(users)
                .totalElements(userPage.getTotalElements())
                .totalPages(userPage.getTotalPages())
                .currentPage(userPage.getNumber())
                .pageSize(userPage.getSize())
                .last(userPage.isLast())
                .first(userPage.isFirst())
                .numberOfElements(userPage.getNumberOfElements())
                .build();
    }
}
