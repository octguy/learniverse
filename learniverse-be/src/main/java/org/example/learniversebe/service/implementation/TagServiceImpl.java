package org.example.learniversebe.service.implementation;

import lombok.extern.slf4j.Slf4j;
import org.example.learniversebe.dto.request.CreateTagRequest;
import org.example.learniversebe.dto.request.UpdateTagRequest;
import org.example.learniversebe.dto.response.PageResponse;
import org.example.learniversebe.dto.response.TagResponse;
import org.example.learniversebe.exception.BadRequestException;
import org.example.learniversebe.exception.ResourceNotFoundException;
import org.example.learniversebe.mapper.TagMapper;
import org.example.learniversebe.model.Tag;
import org.example.learniversebe.repository.ContentTagRepository;
import org.example.learniversebe.repository.TagRepository;
import org.example.learniversebe.repository.UserProfileTagRepository;
import org.example.learniversebe.service.ITagService;
import org.example.learniversebe.util.SlugGenerator;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
public class TagServiceImpl implements ITagService {

    private final TagRepository tagRepository;
    private final ContentTagRepository contentTagRepository;
    private final UserProfileTagRepository userProfileTagRepository;
    private final TagMapper tagMapper;
    private final SlugGenerator slugGenerator;

    public TagServiceImpl(TagRepository tagRepository,
                          ContentTagRepository contentTagRepository,
                          UserProfileTagRepository userProfileTagRepository,
                          TagMapper tagMapper,
                          SlugGenerator slugGenerator) {
        this.tagRepository = tagRepository;
        this.contentTagRepository = contentTagRepository;
        this.userProfileTagRepository = userProfileTagRepository;
        this.tagMapper = tagMapper;
        this.slugGenerator = slugGenerator;
    }

    @Override
    @Transactional
    public TagResponse createTag(CreateTagRequest request) {
        log.info("Creating tag with name: {}", request.getName());
        // 1. Kiểm tra tên tag đã tồn tại chưa (không phân biệt hoa thường)
        if (tagRepository.existsByNameIgnoreCase(request.getName())) {
            log.warn("Tag creation failed - tag name already exists: {}", request.getName());
            throw new BadRequestException("Tag name '" + request.getName() + "' already exists.");
        }

        // 2. Map DTO sang Entity
        Tag tag = tagMapper.createTagRequestToTag(request);

        // 3. Tạo slug thủ công trong Service (thay vì dựa vào @PrePersist)
        // để đảm bảo logic tạo slug nhất quán và có thể kiểm tra
        String slug = slugGenerator.generateSlug(request.getName());
        // TODO: Thêm logic kiểm tra slug duy nhất và tạo lại nếu cần
        // (Mặc dù hàm generateSlug đã thêm UUID nên gần như duy nhất)
        tag.setSlug(slug);

        // 4. Lưu vào DB (Lưu ý: @PrePersist trong Tag.java vẫn sẽ chạy và set ID, timestamps)
        Tag savedTag = tagRepository.save(tag);
        log.info("Tag created successfully with ID: {} and slug: {}", savedTag.getId(), savedTag.getSlug());

        // 5. Map sang DTO Response và trả về
        return tagMapper.toTagResponse(savedTag);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TagResponse> getAllTags() {
        return tagRepository.findAll().stream()
                .map(tagMapper::toTagResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<TagResponse> searchTags(String query, Pageable pageable) {
        log.debug("Searching tags with query: {} and pageable: {}", query, pageable);
        Page<Tag> tagPage;
        if (query == null || query.isBlank()) {
            // Nếu query rỗng, trả về tất cả
            tagPage = tagRepository.findAll(pageable);
        } else {
            // Nếu có query, tìm kiếm theo tên
            tagPage = tagRepository.findByNameContainingIgnoreCase(query, pageable);
        }

        // Sử dụng hàm tiện ích trong mapper để chuyển đổi
        return tagMapper.tagPageToTagPageResponse(tagPage);
    }

    @Override
    @Transactional
    public TagResponse updateTag(UUID tagId, UpdateTagRequest request) {
        log.info("Updating tag with ID: {}", tagId);

        // 1. Find the tag
        Tag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new ResourceNotFoundException("Tag", "id", tagId.toString()));

        // 2. If name is being updated, check for duplicates
        if (request.getName() != null && !request.getName().isBlank()) {
            // Check if the new name already exists (excluding current tag)
            if (!tag.getName().equalsIgnoreCase(request.getName()) 
                    && tagRepository.existsByNameIgnoreCase(request.getName())) {
                log.warn("Tag update failed - tag name already exists: {}", request.getName());
                throw new BadRequestException("Tag name '" + request.getName() + "' already exists.");
            }
            tag.setName(request.getName());
            // Update slug when name changes
            tag.setSlug(slugGenerator.generateSlug(request.getName()));
        }

        // 3. Update description if provided
        if (request.getDescription() != null) {
            tag.setDescription(request.getDescription());
        }

        // 4. Save and return
        Tag updatedTag = tagRepository.save(tag);
        log.info("Tag updated successfully with ID: {}", updatedTag.getId());

        return tagMapper.toTagResponse(updatedTag);
    }

    @Override
    @Transactional
    public void deleteTag(UUID tagId) {
        log.info("Deleting tag with ID: {}", tagId);

        // Check if tag exists
        Tag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new ResourceNotFoundException("Tag", "id", tagId.toString()));

        // Check if tag is being used in any posts/questions
        long contentUsageCount = contentTagRepository.countByTagId(tagId);
        if (contentUsageCount > 0) {
            log.warn("Cannot delete tag {} - it is being used by {} posts/questions", tagId, contentUsageCount);
            throw new BadRequestException(
                    "Cannot delete tag '" + tag.getName() + "' because it is being used by " + contentUsageCount + " post(s)/question(s). " +
                    "Please remove the tag from all content before deleting.");
        }

        // Check if tag is being used in any user profiles (onboarding)
        long userProfileUsageCount = userProfileTagRepository.countByTagId(tagId);
        if (userProfileUsageCount > 0) {
            log.warn("Cannot delete tag {} - it is being used by {} user profiles", tagId, userProfileUsageCount);
            throw new BadRequestException(
                    "Cannot delete tag '" + tag.getName() + "' because it is being used by " + userProfileUsageCount + " user profile(s). " +
                    "Please remove the tag from all user profiles before deleting.");
        }

        // Soft delete the tag (handled by @SQLDelete annotation in Tag entity)
        tagRepository.deleteById(tagId);
        log.info("Tag deleted successfully with ID: {}", tagId);
    }
}