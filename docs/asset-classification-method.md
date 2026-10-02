# Classify Asset — Criticality và Data Classification

Form hiện chia hai phần độc lập, lưu chung bằng Save classification. Criticality dùng SECURAAI-ASSET-IMPACT-v1; Data Classification dùng SECURAAI-DATA-CLASSIFICATION-v1, tham khảo ISO/IEC 27002:2022 Control 5.12. Bốn nhãn là nội bộ, không do ISO quy định. Data classification basis là căn cứ riêng bắt buộc 20–2000 ký tự; dữ liệu cũ được giữ nguyên với căn cứ null, khi lưu lại phải bổ sung. Migration 20261002103000_data_classification_basis thêm hai cột và một CHECK; hiện 59 bảng, 126 FK, 163 CHECK. Các mô tả Assessment basis chung bên dưới phản ánh phiên bản đầu; hợp đồng hiện thêm dataClassificationBasis bắt buộc và Detail trả riêng căn cứ/phiên bản phân loại thông tin.

## Phạm vi và nguồn tham khảo

Đây là phương pháp nội bộ của SecuraAI, **tham khảo**, không áp dụng nguyên bản hay tuyên bố chứng nhận FIPS/ISO.

Nguồn chính: **FIPS PUB 199, February 2004, Section 3 — Categorization of Information and Information Systems**, trang in 1–4: https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.199.pdf.

Nội dung tham khảo: đánh giá hậu quả mất Confidentiality, Integrity, Availability trong bối cảnh tổ chức; cách phân loại hệ thống giữ mức tác động cao nhất của từng mục tiêu CIA từ các loại thông tin trong hệ thống. FIPS dùng Low/Moderate/High và biểu diễn bộ ba CIA. FIPS **không** quy định công thức max(C,I,A,Business), thang số 1–5, Critical hoặc bốn nhãn Data classification của dự án.

SecuraAI mở rộng nguyên tắc bảo thủ đó thành một mức Criticality chung cho asset. Business impact là tiêu chí nội bộ bổ sung. Không mô tả đây là phép chuyển đổi chính thức từ FIPS; không tự suy ra phân loại của toàn hệ thống từ một asset. Phương pháp cần mentor/đơn vị sử dụng xác nhận trước khi coi là chính sách tổ chức đã phê duyệt.

## So sánh cũ và mới

| Nội dung | Cũ | Mới |
| --- | --- | --- |
| Tổng hợp | C×25% + I×25% + A×30% + B×20% | max(C,I,A,B) |
| Điểm khởi tạo | Mặc định 3 cho cả bốn tiêu chí | Chưa đánh giá để trống; đánh giá đã lưu được tải lại |
| Hướng dẫn | Chỉ nói thang 1–5 | Giải thích tiêu chí, mốc tác động và công thức |
| Cơ sở | Chỉ lưu Criticality/Data classification | Lưu bốn điểm, lý do, người đánh giá, thời gian, phiên bản phương pháp |
| Dữ liệu cũ | Không phân biệt có cơ sở hay chưa | Hiển thị initial/legacy, không giả tạo điểm hoặc tự chuyển đổi |

Ví dụ C=1,I=1,A=5,B=1: cũ 2.20 → Low; mới 5 → Critical. Tránh tác động mất dịch vụ nghiêm trọng bị các điểm thấp làm loãng.

## Quy tắc nội bộ

Chấm **tác động có thể xảy ra** khi asset bị ảnh hưởng, không chấm xác suất tấn công và không trừ điểm vì đang có control.

- C: hậu quả khi thông tin bị tiết lộ trái phép.
- I: hậu quả khi thông tin bị sửa/xóa trái phép.
- A: hậu quả khi không thể truy cập thông tin/dịch vụ kịp thời.
- Business: hậu quả vận hành, tài chính, dịch vụ khách hàng trong bối cảnh asset; không cộng chồng với CIA mà lấy max.

Thang nội bộ:

| Điểm | Mốc đánh giá | Criticality nếu đây là điểm lớn nhất |
| --- | --- | --- |
| 1 | Hậu quả hạn chế, cục bộ; chức năng chính vẫn tiếp tục | Low |
| 2 | Gián đoạn đáng kể nhưng có thể phục hồi trong phạm vi kiểm soát | Medium |
| 3 | Gián đoạn/tổn thất nghiêm trọng; chức năng chính vẫn vận hành được | Medium |
| 4 | Hậu quả rất nghiêm trọng, một chức năng chính không thể vận hành | High |
| 5 | Hậu quả thảm khốc hoặc mất hoạt động thiết yếu kéo dài, thiệt hại lớn/tổn hại nghiêm trọng đến con người | Critical |

Đây là mốc định tính, không phải SLA hay ngưỡng tài chính chuẩn hóa. Người đánh giá phải ghi phạm vi, thông tin xử lý, hậu quả của từng tiêu chí và bằng chứng/căn cứ. Tổ chức có thể bổ sung ngưỡng thời gian/tài chính khi có chính sách được phê duyệt; thay đổi phương pháp cần phiên bản mới và quy trình đánh giá lại.

Data classification là nhãn xử lý thông tin **độc lập**:

- Public: được phép công khai.
- Internal: dùng trong tổ chức.
- Confidential: giới hạn người được phép truy cập.
- Restricted: kiểm soát chặt với thông tin nhạy cảm.

Chọn mức nhạy cảm cao nhất thực tế asset xử lý. Không tự ánh xạ Public → Low hay Restricted → Critical. Một hệ thống chứa thông tin công khai vẫn có thể Critical vì Availability. Nhãn không tự cấp quyền truy cập hay thay thế cơ chế authorization.

## Luồng nghiệp vụ

1. Tạo asset chỉ nhập thông tin định danh, owner tùy chọn và mô tả. Business service, Criticality và Data classification không có trong Create; hai mức phân loại được lưu null và hiển thị `—`, không tự gán Low/Medium/Public/Internal. Assign owner/Manage links bổ sung bối cảnh khi có; Classify asset xác định hai mức phân loại. Không bắt buộc phải có business service để phân loại. Migration `20261002133000_asset_create_unclassified` giữ nguyên giá trị của asset cũ.
2. Security Officer đang hoạt động mở Classify. Form hiển thị owner, business service, dependencies và cơ sở mới nhất.
3. Nhập bốn số nguyên 1–5, chọn Data classification, ghi Assessment basis 20–2000 ký tự. Không tự gợi ý điểm 3 cho asset chưa đánh giá.
4. FE hiển thị preview; BE kiểm tra tài khoản và trạng thái asset, tính lại kết quả, lưu toàn bộ trong một transaction. Client không gửi Criticality hoặc người đánh giá để tự quyết định kết quả.
5. List/Detail được refresh. Detail hiển thị cơ sở và người/thời gian đánh giá. Mở lại tải điểm đã lưu, có thể đánh giá lại khi bối cảnh thay đổi.
6. Asset archived chỉ được xem, không phân loại lại. Dữ liệu cũ không bị thay đổi qua migration.
7. Risk Assessment vẫn là bước riêng sử dụng bối cảnh asset cùng threat/vulnerability/control. Không tự sửa risk score, acceptance hoặc Incident khi phân loại asset.

Chỉ lưu **cơ sở đánh giá mới nhất**, không triển khai lại Asset History. Việc lưu actor/time/basis không đồng nghĩa đã có lịch sử audit đầy đủ hay approval workflow.

## Demo với mentor

1. Mở asset cũ: thấy initial/legacy, không có điểm giả.
2. Nhập C=1,I=1,A=5,B=1, Public; ghi lý do dịch vụ công khai nhưng mất dịch vụ làm dừng chức năng chính. Preview Critical, Save, Detail vẫn là Critical/Public.
3. Mở lại: điểm, lý do, người và thời gian đúng; đổi điểm với lý do mới, lưu và xem kết quả mới.
4. Để trống lý do hoặc nhập 0/6/2.5: bị từ chối; archived không được sửa.
5. Giải thích giới hạn: tham khảo FIPS 199 Section 3; quy tắc 1–5/max/bốn mức là thiết kế nội bộ, chờ xác nhận nghiệp vụ tổ chức; không tuyên bố tuân thủ hay chứng nhận.

## Hợp đồng và triển khai

POST `/api/v1/assets/:assetId/classify-criticality` thêm `rationale` bắt buộc. Response thêm `methodVersion`; score là số nguyên. Detail thêm `classification` nullable với bốn điểm/rationale/methodVersion/assessedAt/assessedBy. Deploy migration BE trước, sinh Prisma Client và khởi động lại BE; FE/BE phải cập nhật cùng phiên bản. Client cũ không gửi rationale sẽ bị validation từ chối, không được tự điền lý do giả để tương thích.

Migration additive `20261002090000_asset_classification_basis` không backfill. DB kiểm tra bộ trường đầy đủ hoặc toàn bộ null, khoảng điểm, độ dài rationale, actor FK và kết quả khớp công thức. Cấu trúc sau migration: 59 bảng, 126 FK, 162 CHECK.

Kiểm thử live phát triển (tạo rồi xóa đúng asset test riêng): BE `RUN_LIVE_ASSET_TESTS=1 npx tsx scripts/verify-asset-classification.ts`. Không chạy trên DB production.
