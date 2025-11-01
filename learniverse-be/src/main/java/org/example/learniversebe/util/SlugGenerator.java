package org.example.learniversebe.util;

import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Utility component for generating URL-friendly slugs from strings.
 */
@Component
public class SlugGenerator {

    private static final Pattern NONLATIN = Pattern.compile("[^\\w-]"); // Loại bỏ ký tự không phải chữ, số, gạch ngang
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]"); // Thay khoảng trắng bằng gạch ngang
    private static final Pattern EDGES_HYPHENS = Pattern.compile("(^-|-$)"); // Loại bỏ gạch ngang ở đầu/cuối

    /**
     * Generates a URL-friendly slug from the input string.
     * Converts to lowercase, removes accents, replaces spaces with hyphens,
     * removes invalid characters, and appends a short random suffix for uniqueness.
     *
     * @param input The string to convert into a slug (e.g., title or excerpt).
     * @return A generated slug string.
     */
    public String generateSlug(String input) {
        if (input == null || input.isBlank()) {
            return UUID.randomUUID().toString();
        }

        // 1. Chuyển đổi thành chữ thường và bỏ dấu tiếng Việt
        String noAccents = Normalizer.normalize(input.toLowerCase(Locale.ENGLISH), Normalizer.Form.NFD);
        noAccents = noAccents.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");

        // 2. Thay khoảng trắng bằng gạch ngang
        String replacedSpaces = WHITESPACE.matcher(noAccents).replaceAll("-");

        // 3. Loại bỏ các ký tự không hợp lệ
        String normalized = NONLATIN.matcher(replacedSpaces).replaceAll("");

        // 4. Loại bỏ gạch ngang thừa ở đầu/cuối
        normalized = EDGES_HYPHENS.matcher(normalized).replaceAll("");

        // 5. Rút gọn nhiều gạch ngang thành một (ví dụ: "a---b" -> "a-b")
        normalized = normalized.replaceAll("-{2,}", "-");


        // 6. Giới hạn độ dài và thêm phần ngẫu nhiên để đảm bảo duy nhất
        // (Kiểm tra sự tồn tại trong DB là cách tốt nhất để đảm bảo duy nhất,
        // nhưng thêm UUID ngắn là giải pháp đơn giản ban đầu)
        int maxLength = 100; // Giới hạn độ dài slug cơ sở
        String baseSlug = normalized.length() > maxLength ? normalized.substring(0, maxLength) : normalized;
        // Xóa gạch ngang cuối cùng nếu có sau khi cắt chuỗi
        baseSlug = EDGES_HYPHENS.matcher(baseSlug).replaceAll("");


        // Nếu baseSlug rỗng sau khi xử lý (ví dụ: input toàn ký tự đặc biệt)
        if (baseSlug.isEmpty()) {
            return UUID.randomUUID().toString();
        }


        // Thêm UUID ngắn để tăng khả năng duy nhất
        return baseSlug + "-" + UUID.randomUUID().toString().substring(0, 8);
    }
}
