package org.example.learniversebe.service.implementation;

import org.example.learniversebe.dto.request.CreateTagRequest;
import org.example.learniversebe.dto.response.PageResponse;
import org.example.learniversebe.dto.response.TagResponse;
import org.example.learniversebe.exception.BadRequestException;
import org.example.learniversebe.mapper.TagMapper;
import org.example.learniversebe.model.Tag;
import org.example.learniversebe.repository.TagRepository;
import org.example.learniversebe.service.ITagService;
import org.example.learniversebe.util.SlugGenerator; // Import SlugGenerator
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TagServiceImpl implements ITagService {

    private final TagRepository tagRepository;
    private final TagMapper tagMapper;
    private final SlugGenerator slugGenerator; // Inject SlugGenerator

    public TagServiceImpl(TagRepository tagRepository,
                          TagMapper tagMapper,
                          SlugGenerator slugGenerator) {
        this.tagRepository = tagRepository;
        this.tagMapper = tagMapper;
        this.slugGenerator = slugGenerator;
    }

    @Override
    @Transactional
    public TagResponse createTag(CreateTagRequest request) {
        // 1. Kiểm tra tên tag đã tồn tại chưa (không phân biệt hoa thường)
        if (tagRepository.existsByNameIgnoreCase(request.getName())) {
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
}