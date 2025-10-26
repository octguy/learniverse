package org.example.learniversebe.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Đối tượng chứa kết quả phân trang")
public class PageResponse<T> {

    @Schema(description = "Danh sách nội dung của trang hiện tại")
    private List<T> content;

    @Schema(description = "Tổng số phần tử trên tất cả các trang")
    private long totalElements;

    @Schema(description = "Tổng số trang")
    private int totalPages;

    @Schema(description = "Số trang hiện tại (bắt đầu từ 0)")
    private int currentPage;

    @Schema(description = "Kích thước của trang")
    private int pageSize;

    @Schema(description = "Trang này có phải là trang cuối cùng không?")
    private boolean last;

    @Schema(description = "Trang này có phải là trang đầu tiên không?")
    private boolean first;

    @Schema(description = "Số lượng phần tử trên trang hiện tại")
    private int numberOfElements;

    /**
     * Hàm tiện ích để tạo PageResponse từ đối tượng Page của Spring Data JPA.
     * Cần một hàm mapper để chuyển đổi từ Entity sang DTO.
     *
     * @param page Đối tượng Page<Entity> từ JpaRepository
     * @param content DTO list đã được map
     * @param <E> Kiểu Entity
     * @param <D> Kiểu DTO
     * @return PageResponse<DTO>
     */
    public static <E, D> PageResponse<D> fromPage(Page<E> page, List<D> content) {
        return PageResponse.<D>builder()
                .content(content)
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .currentPage(page.getNumber())
                .pageSize(page.getSize())
                .last(page.isLast())
                .first(page.isFirst())
                .numberOfElements(page.getNumberOfElements())
                .build();
    }
}
