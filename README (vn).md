# Learniverse (Mạng xã hội cho những người yêu thích học tập)

Learniverse là một nền tảng mạng xã hội học tập giúp sinh viên và người học kết nối, chia sẻ tri thức, và cùng nhau phát triển. Tại đây, bạn có thể kết nối với những người chung chí hướng, sở thích, chia sẻ những kiến thức thú vị cùng nhau. Hơn nữa, bạn có thể tham gia các cộng đồng học thuật, đặt ra nhiều câu hỏi cực kì thú vị, trả lời lẫn nhau để mở rộng các mối quan hệ.

# Những tính năng cốt lõi

## 1) Đăng ký / đăng nhập & Hồ sơ học tập

### Mục tiêu:

Vào được hệ thống nhanh, hồ sơ thể hiện “người học gì – cần gì”.

### User stories

- Tôi đăng nhập bằng Google/Email/Facebook; đặt tên hiển thị.
- Tôi chọn ngành/môn học quan tâm (tags), trình độ học vấn, mục tiêu.
- Tôi cập nhật avatar/bio.

### Luồng/UX

- 2-step onboarding: (1) auth → (2) chọn 3–5 môn học quan tâm (tags).
- Nhắc hoàn thiện hồ sơ khi < 60% hoàn tất.

### Quyền & bảo mật

- JWT + refresh.
- Email verification (OTP)

### Edge cases

- Trùng email, tài khoản bị khóa, đổi email.

## 2) Bảng tin & bài đăng học thuật.

### Mục tiêu: '

Tạo/chia sẻ nội dung học, kiến thức của bản thân.

### User Stories:

- Tôi muốn đăng bài viết có thể chứa văn bản, công thức toán và hình ảnh để tôi chia sẻ kiến thức và nhận phản hồi từ cộng đồng.
- Tôi muốn có thể chỉnh sửa bài đăng của mình trong vòng 24 giờ để sửa lỗi chính tả hoặc bổ sung thông tin còn thiếu.
- Tôi muốn upload file PDF/ảnh minh họa kèm theo bài viết để bài dễ hiểu hơn.
- Tôi muốn xem bản xem trước (preview) bài đăng để chắc chắn nội dung hiển thị đúng định dạng Markdown và công thức LaTeX.

### Must-have:

- _Tạo bài viết_

  - Người dùng có thể mở editor để tạo bài viết mới.

  - Editor hỗ trợ nhập văn bản với định dạng cơ bản Markdown (heading, bold, list, link, code block).

  - Hỗ trợ công thức toán LaTeX (render sau khi đăng).

  - Người dùng phải chọn ít nhất một tag (môn học hoặc chủ đề).

  - Sau khi đăng, hệ thống lưu bài viết và hiển thị đúng định dạng trên feed.

  - Thời gian đăng bài và tên tác giả được hiển thị cùng bài viết.

- _Upload file & hình ảnh cơ bản_

  - Người dùng có thể chèn ít nhất một hình ảnh minh họa (PNG/JPEG ≤ 5MB).

  - Người dùng có thể upload file PDF ≤ 15MB.

  - Nếu file vượt quá dung lượng cho phép → hiển thị thông báo lỗi.

  - File được lưu trữ an toàn trên server (S3/Cloud storage) và trả về URL.

  - Ảnh hiển thị trực tiếp trong bài viết, PDF hiển thị link tải/preview.

- _Chỉnh sửa bài viết_

  - Người dùng chỉ có thể chỉnh sửa bài viết của mình trong vòng 24h.

  - Mỗi lần chỉnh sửa được lưu lại timestamp.

  - Sau 24h, nút “Edit” bị ẩn (trừ admin/mod).

  - Khi xem bài viết, nếu đã chỉnh sửa → hiển thị nhãn “Edited” kèm thời gian chỉnh sửa gần nhất.

- _Preview_

  - Editor có nút Preview chuyển sang chế độ xem trước.

  - Markdown, LaTeX, hình ảnh, file đính kèm hiển thị đúng.

  - Người dùng có thể quay lại chế độ chỉnh sửa mà không mất dữ liệu.

  - Nội dung preview phải giống 100% sau khi đăng.

  - Nếu có lỗi cú pháp Markdown/LaTeX → hiển thị cảnh báo, không crash.

### Should-have

- Editor có toolbar trực quan (bold/italic, code block, chèn LaTeX, preview live).

- Auto-save draft khi người dùng đang viết nhưng chưa đăng.

- Lưu lịch sử chỉnh sửa (ít nhất bản gốc + bản mới nhất).

- Placeholder “File không còn tồn tại” nếu file bị xóa khỏi server.

## 3) Hỏi đáp (Q&A)

### Mục tiêu:

Giải quyết câu hỏi nhanh, chất lượng.

### User stories:

- Đặt câu hỏi (tương tự như đăng post)
- Trả lời.

### Luồng/UX:

- Form hỏi có gợi ý tag & "đã có câu hỏi tương tự" (AI)

### Must-have:

- Giới hạn độ dài câu trả lời (< 50 từ)
- Không được upload file trên câu trả lời
- Mọi người đều có thể thấy câu trả lời, nếu câu trả lời chất lượng và bổ ích thì được +1 Upvote. Câu trả lời nào được nhiều lượt Upvote nhất thì cho câu trả lời đó xuất hiện trên cùng.

### Should-have:

- Trong trường hợp user tạo mới bài đăng, nếu nội dung mang tính hỏi đáp, thì hỏi user chuyển qua chế độ đặt câu hỏi thay vì tạo post.
- Lọc câu trả lời spam, kiểm duyệt tiêu cực (AI). (có thể đưa lên must-have)

## 4) Tạo chat với cá nhân, nhóm

### Mục tiêu:

Chat với người khác, tạo nhóm chat.

### User stories:

- Direct Message: tôi muốn có thể nhắn tin riêng với một người khác để thảo luận bài tập hoặc chia sẻ thông tin cá nhân mà không ai khác nhìn thấy.
- Group chat: Là thành viên của một lớp học/nhóm học tập, tôi muốn có thể tham gia phòng chat nhóm để trao đổi nhanh với nhiều bạn cùng lúc.

### Must-have:

- Người dùng có thể gửi/nhận tin nhắn văn bản real-time (WebSocket).
- Người dùng A mở profile của người dùng B → bấm “Nhắn tin”.
- Tin nhắn hiển thị theo thứ tự thời gian (latest → bottom).
- Chat cá nhân: 1-1 giữa hai user.
- Chat nhóm: nhiều thành viên, có tên nhóm và danh sách thành viên.
- Hiển thị thông tin cơ bản: avatar, tên người gửi, thời gian gửi.
- Có thể thu hồi tin nhắn đã gửi trong thời gian cho phép (1 ngày)
- Người dùng có thể xem lại lịch sử chat (lưu DB).
- Notification khi có tin nhắn mới.
- Cho phép rời nhóm hoặc thêm thành viên mới.

### Should-have:

- Gửi file/ảnh (có preview).
- Ghim tin nhắn quan trọng trong nhóm.
- Tìm kiếm trong lịch sử chat.
- Hiển thị trạng thái online/offline.
- Thread (trả lời một tin cụ thể trong nhóm).

### Good-to-have:

- Hiển thị trạng thái “đang nhập…” (typing indicator).
- Đánh dấu đã đọc (read receipt / seen).
- Reactions (👍❤️😂) cho tin nhắn.

### Luồng / UX:

1. Người dùng mở chat cá nhân hoặc nhóm → thấy danh sách tin nhắn.
2. Nhập nội dung → gửi → tin nhắn hiển thị ngay lập tức trên màn hình của cả hai bên.
3. Tin nhắn cũ có thể cuộn để xem lại (infinite scroll).
4. Trong nhóm: có thể xem danh sách thành viên, thêm/xóa, rời nhóm.
5. Khi có tin nhắn mới → hiển thị notification + badge số chưa đọc.
6. Người gửi có thể thu hồi tin nhắn trong khoảng X phút.

### Edge Cases:

- Quyền:
  - Người bị block → không gửi tin nhắn được.
  - Thành viên rời nhóm/kick → không thấy tin nhắn mới nữa.
- Tin nhắn:
  - Quá dài → hiển thị lỗi.
  - Mất mạng → tin nhắn ở trạng thái “Sending…” cho đến khi gửi thành công.
  - Thu hồi → hiển thị placeholder “Tin nhắn đã bị thu hồi”.
- Notification:
  - Đọc tin trên thiết bị A → phải đồng bộ trạng thái sang thiết bị B.
  - Tắt notification → tin nhắn vẫn lưu nhưng không push ra ngoài.
- File/ảnh:
  - Vượt dung lượng cho phép → báo lỗi.
  - Upload thất bại → retry.
  - File bị xóa trên server → hiển thị “File không còn tồn tại”.

## 5) Chức năng Kết bạn (Friendship)

### Mục tiêu:

- Tạo kết nối giữa các người dùng, giúp xây dựng mạng lưới bạn bè trong ứng dụng học tập.
- Cho phép người dùng theo dõi hoạt động, trao đổi, chat dễ dàng hơn với bạn bè.

### User Stories:

- Tôi muốn gửi lời mời kết bạn cho bạn học để chúng tôi có thể theo dõi hoạt động của nhau.
- Tôi muốn nhận thông báo khi có người gửi lời mời kết bạn để tôi có thể chấp nhận hoặc từ chối.
- Tôi muốn xem danh sách bạn bè để dễ dàng nhắn tin hoặc mời vào nhóm.

### Must-have:

- Người dùng có thể gửi lời mời kết bạn đến user khác.
- Người nhận có thể chấp nhận hoặc từ chối lời mời.
- Sau khi chấp nhận → cả hai trở thành bạn bè.
- Danh sách bạn bè hiển thị trong profile.
- Notification khi có lời mời kết bạn mới.
- Không thể gửi lời mời kết bạn cho người đã là bạn hoặc đã gửi lời mời trước đó (pending).

### Should-have:

- Hủy lời mời kết bạn (nếu pending).
- Xóa bạn bè (unfriend).
- Gợi ý bạn bè dựa trên lớp học/nhóm chung hoặc tag môn học.
- Tìm kiếm trong danh sách bạn bè.

### Good-to-have: (có thì tốt, không thì không sao cả)

- Follow nhẹ: ngoài kết bạn, cho phép follow 1 chiều để xem hoạt động.
- Đề xuất bạn bè bằng AI dựa trên hành vi (người cùng đọc bài, hỏi đáp tương tự).
- Mutual friends: hiển thị bạn chung.
- Privacy setting: cho phép chỉ bạn bè mới thấy bài đăng/private info.
- Gợi ý kết bạn định kỳ (“Bạn có 5 gợi ý bạn bè mới tuần này”).

### Luồng/UX:

1. Người dùng A vào profile của B → click “Kết bạn”.
2. Nếu chưa có quan hệ: hệ thống tạo lời mời trạng thái pending.
3. Người dùng B nhận notification → có thể Chấp nhận hoặc Từ chối.
4. Nếu chấp nhận → cả A và B đều thêm nhau vào danh sách bạn bè.
5. Người dùng vào tab “Bạn bè” trong profile để xem toàn bộ bạn bè.
6. Từ danh sách bạn bè → có thể Nhắn tin, Mời vào nhóm, Unfriend.

### Edge cases:

- Người A gửi lời mời cho B nhưng B đã block A → từ chối tự động.
- A và B đã là bạn → không hiển thị nút “Kết bạn” nữa.
- Nếu tài khoản bị xóa → quan hệ bạn bè cũng bị xóa theo.

## 6) Chức năng Tạo Nhóm (Community)

### Mục tiêu:

- Cho phép người dùng tạo cộng đồng/nhóm học tập (ví dụ: “Giải tích 1 – K23”).
- Kết nối những người có cùng mối quan tâm để chia sẻ bài viết, thảo luận, lưu tài liệu.
- Quản lý thành viên trong nhóm (thêm, mời, kick, rời nhóm).

### User Stories:

- Là một sinh viên, tôi muốn tạo nhóm học tập để bạn bè cùng tham gia trao đổi kiến thức.
- Là một người dùng, tôi muốn tham gia hoặc thoát khỏi nhóm để kết nối theo nhu cầu.
- Là chủ nhóm/mod, tôi muốn quản lý thành viên (thêm, xóa, phân quyền) để giữ nhóm chất lượng.
- Là thành viên nhóm, tôi muốn thấy feed của nhóm với bài viết, bình luận để tham gia thảo luận.

### Must-have:

- Người dùng có thể tạo nhóm với tên, mô tả, avatar.
- Nhóm có loại: public (ai cũng join) hoặc private (phải mời/approve).
- Quản lý thành viên cơ bản: join, rời, mời, kick.
- Feed nhóm: chỉ hiển thị bài post thuộc nhóm.
- Hiển thị danh sách thành viên.
- Chủ nhóm có thể chuyển quyền owner cho người khác khi rời nhóm.

### Should-have:

- Phân quyền: owner, moderator, member.
- Ghim bài viết trong nhóm.
- Thông báo khi có bài mới trong nhóm.
- Danh sách file/tài liệu upload trong nhóm.
- Cho phép đặt tag môn học cho nhóm để gợi ý tìm kiếm.

### Good-to-have:

- Lịch sự kiện nhóm (study session, meeting).
- Chat nhóm riêng tích hợp với nhóm (link sang module chat).
- Tự động gợi ý nhóm liên quan dựa trên tag môn học.

### Luồng/UX:

1. Người dùng chọn “Tạo nhóm mới”.
2. Điền thông tin: Tên, Mô tả, Ảnh đại diện, Loại nhóm (public/private), Tag môn học.
3. Nhấn Tạo → hệ thống lưu nhóm và gắn người tạo làm owner.
4. Thành viên khác có thể:
   - Với nhóm public → click “Join” để tham gia.
   - Với nhóm private → click “Request to Join” → owner/mod duyệt.
5. Trong nhóm, hiển thị tab: Feed | Members | About.
6. Người dùng có thể rời nhóm bất kỳ lúc nào.

### Edge Cases:

- Người tạo nhóm rời nhóm → hệ thống phải chọn/mod chuyển quyền owner.
- Nhóm private: user request join nhưng bị từ chối → không truy cập nội dung.
- Nếu nhóm bị xóa → toàn bộ bài post/tài liệu/chat trong nhóm cũng bị xóa hoặc archive.
- Thành viên bị kick → vẫn thấy lịch sử trước đó nhưng không truy cập nội dung mới.

## 7) Bình luận, @mention, Bookmark

### Mục tiêu:

- Cho phép thảo luận ngắn gọn dưới bài viết/câu hỏi.
- Mention để kéo người khác tham gia.
- Bookmark để lưu lại bài quan trọng.

### User Stories:

- Là một sinh viên, tôi muốn bình luận vào bài viết để trao đổi ý kiến.
- Là một người dùng, tôi muốn @mention bạn cùng lớp để họ thấy và tham gia.
- Là một người học, tôi muốn lưu bài để xem lại khi cần.

### Must-have:

- Comment theo thread (có thể reply).
- Mention user bằng cú pháp @Tên.
- Lưu bài (bookmark) và xem danh sách đã lưu.
- Hiển thị số lượng bình luận và số lượt bookmark.

### Should-have:

- Hỗ trợ emoji trong bình luận.
- Markdown cơ bản cho comment (bold, code).
- Cho phép sửa hoặc xóa comment của chính mình.
- Gợi ý user khi gõ “@”.

### Good-to-have:

- React vào comment (👍❤️😂).
- Quote một phần nội dung để trả lời.
- Tag comment để phân loại (ví dụ: “giải thích”, “thắc mắc”).

### Luồng/UX:

1. Người dùng mở bài post → thấy box comment.
2. Viết comment → gửi → hiển thị ngay trong thread.
3. Gõ “@” → gợi ý danh sách user để mention.
4. Bookmark bài → hiển thị nút “Đã lưu”.
5. Danh sách bookmark có thể xem trong profile.

### Edge cases:

- Xóa comment cha → comment con trở thành orphan (ẩn hoặc giữ nguyên?).
- Mention user không có quyền xem nội dung → không gửi notification.
- Bookmark trùng lặp → chỉ lưu một lần.

## 8) Thông báo & Realtime

### Mục tiêu:

- Người dùng biết ngay khi có ai trả lời, mention, hoặc mời vào nhóm.
- Badge hiển thị số lượng thông báo chưa đọc realtime.

### User Stories:

1. Là một người dùng, tôi muốn nhận thông báo khi ai đó trả lời câu hỏi của tôi.
2. Là một người dùng, tôi muốn thấy badge số chưa đọc cập nhật realtime.

### Must-have:

- In-app notification khi có answer/comment/mention/invite.
- Badge số lượng chưa đọc realtime.
- Danh sách notification với loại (trả lời, mention, mời).
- Cho phép đánh dấu đã đọc từng cái hoặc tất cả.

### Should-have:

- Notification được nhóm theo loại (VD: “3 người đã bình luận vào post của bạn”).
- Cho phép filter notification theo loại (học tập, hệ thống, nhóm).
- Hiển thị link preview nhỏ trong thông báo.

### Luồng/UX:

1. Ai đó trả lời/mention/invite → hệ thống tạo notification.
2. Notification push qua WebSocket → hiển thị ngay (badge + popup).
3. Người dùng click notification → chuyển đến nội dung chi tiết.
4. Người dùng có thể mark as read.

### Edge cases:

- Fan-out lớn: 1 event (post mới trong nhóm) → gửi cho hàng nghìn người.
- Retry khi mất kết nối → cần idempotent để tránh trùng.
- Người dùng tắt notification → chỉ lưu trong danh sách, không push ra ngoài.

# Những gì AI có thể làm

## 1. Kiểm duyệt bình luận tiêu cực (Toxic Comment Moderation)

### Mục tiêu:

- Giữ môi trường học tập lành mạnh.
- Ngăn spam, nội dung độc hại (toxic, hate speech, sexual, quảng cáo).

### Cách hoạt động:

1. Khi user gửi bình luận, hệ thống gọi API AI model để phân loại.
2. AI trả về score (VD: toxic=0.85, spam=0.2).
3. Nếu vượt ngưỡng (toxic > 0.8) → xoá tự động.
4. Nếu score ở mức cảnh báo (0.5–0.8) → hiển thị cho user nhưng gửi flag cho mod.

### Công nghệ:

- Model: OpenAI moderation API, Perspective API (Google) hoặc model open-source như Detoxify (BERT fine-tuned).
- Pipeline: API Gateway → Moderation Service (AI) → DB → Notification mod.

## 2) Tìm kiếm thông minh (Semantic Search)

### Mục tiêu:

- Người dùng tìm nội dung theo ngữ nghĩa, không chỉ từ khóa.
- Hỗ trợ Tiếng Việt có dấu/không dấu, chính tả sai.

### Cách hoạt động:

- Khi user nhập query, hệ thống:
  - Step 1: Chuẩn hóa (lowercase, bỏ dấu, sửa lỗi chính tả bằng AI).
  - Step 2: Dùng model embedding để encode query → vector.
  - Step 3: So sánh với vector nội dung (bài post, question, group, user).
  - Step 4: Kết hợp điểm BM25 (từ khóa) + cosine similarity (semantic).

### Công nghệ:

- Model embedding: OpenAI text-embedding-3-small, Cohere, hoặc PhoBERT/viBERT (nếu muốn on-premise).
- DB lưu vector: Postgres + pgvector hoặc Weaviate / Milvus.
- Search engine: Meilisearch hoặc Elasticsearch + plugin Vietnamese analyzer.

### KPI:

- CTR (click-through rate) sau khi search.
- Time-to-result < 300ms.
- Recall@k và MRR (Mean Reciprocal Rank).

## 3) Gợi ý Newsfeed (Recommendation System)

### Mục tiêu:

- Cá nhân hóa newsfeed theo:
  - Bạn bè (friend graph).
  - Tags môn học quan tâm.
  - Hành vi (like, comment, bookmark).

### Cách hoạt động:

- Candidate generation (lọc sơ bộ):
  - Lấy bài từ bạn bè trực tiếp.
  - Lấy bài có tag trùng với tags trong profile user.
  - Lấy bài trending (nhiều vote trong 24h).

### Công nghệ:

- Embedding model cho post & user: giống như phần search.
- Recommender system:
  - Collaborative filtering (user–item matrix).
  - Graph-based recommend (PageRank trên graph bạn bè).
  - Hybrid (tag-based + friend-based + embedding).
- Infrastructure:
  - Candidate store = Redis/Elasticsearch.
  - Ranking model = LightGBM/NN (train từ log click/vote).

### KPI:

- Avg session length (người dùng lướt feed lâu hơn).
- CTR bài viết trên feed.
- Diversity (không lặp nhiều).
- Retention D7 (giữ chân người dùng).

## Luồng dữ liệu tổng thể

### 1. Input:

Nội dung (post, comment, group, tags) + hành vi người dùng (like, comment, save, follow).

### 2. AI pipeline:

- Moderation → kiểm duyệt comment.
- Embedding → lưu vector cho search & recommend.
- Ranking → feed được sắp xếp cá nhân hóa.

### 3. Output:

- Comment an toàn.
- Search chính xác, semantic.
- Newsfeed cá nhân hóa theo bạn bè & tags.

## Tóm tắt

- Moderation: AI NLP lọc toxic/spam, giúp mod không quá tải.
- Search: AI semantic search + typo correction, phù hợp tiếng Việt.
- Newsfeed: AI recommender kết hợp bạn bè + tags môn + hành vi → feed cá nhân hóa.
