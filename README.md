# SecuraAI Frontend

Incident creation is Security Officer-only (manual and confirmed-source modes). Executive retains incident list/detail access without create/handling actions. Other roles retain access to their historical reports without a create prompt. Losing the officer role closes the creation dialog. No new reporting workflow or database changes.

Giao diện SecuraAI cho quản lý rủi ro an toàn thông tin, tài sản, controls, chính sách, sự cố và cảnh báo bất thường.

## Công nghệ

Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4, TanStack Query, React Hook Form và Zod. Vitest/Testing Library kiểm thử component; Playwright kiểm thử trình duyệt.

## Chạy local

Yêu cầu Node.js 22+ và pnpm theo [package.json](package.json). Khởi chạy backend trước.

```powershell
corepack enable
corepack pnpm install
Copy-Item .env.example .env.local
corepack pnpm dev
```

Chỉ sao chép environment khi chưa có cấu hình local. FE: http://localhost:3001. Backend mặc định: http://localhost:3000/api/v1.

| Biến | Mục đích |
| --- | --- |
| NEXT_PUBLIC_APP_NAME | Tên ứng dụng |
| NEXT_PUBLIC_API_BASE_URL | Backend URL, gồm /api/v1 |
| NEXT_PUBLIC_GOOGLE_CLIENT_ID | Google OAuth client ID, nếu sử dụng |

Không đưa token, mật khẩu hoặc database URL vào biến NEXT_PUBLIC_*.

## Các khu vực chức năng

| Route | Nội dung |
| --- | --- |
| /login, /forgot-password | Đăng nhập, mã reset/resend và đặt lại mật khẩu |
| /profile, /change-password | Hồ sơ và đổi mật khẩu |
| /dashboard | Dashboard theo tài khoản |
| /admin | Quản lý người dùng, phòng ban, import, role và scope |
| /assets, /assets/business-services | Assets, owner, phân loại, archive, context/history và business services |
| /risks | Register/detail, inherent/residual, treatment, target, acceptance, review và reassessment requests |
| /controls | Controls, effectiveness và evidence |
| /policies | Draft, review, revision, approval, publish, applicability, acknowledgement và version history |
| /incidents | Báo cáo, classification, handler, response actions, RCA, close và liên kết Risk/Control/Asset |
| /event-logs | Event sources, import, normalized events và entity mapping |
| /anomaly-monitoring | Manual detection, alerts, triage và feedback |
| /ai-models | Model versions, metrics và thresholds |
| /audits, /reports | Audit records và reporting |
| /integrations | Tích hợp và API-key lifecycle |
| /notifications | Inbox, gửi notification/email và cấu hình kênh |
| /system-logs, /login-history | Tra cứu/export logs, configuration history và login activity |

Navigation và actions phụ thuộc quyền, ownership và trạng thái backend. Route tồn tại không bảo đảm mọi contract lịch sử đã được triển khai.

## Phân quyền và authentication

Bốn role cố định: ADMIN, SECURITY_OFFICER, EXECUTIVE, EMPLOYEE. Risk Owner, Control Owner và Asset Owner là trách nhiệm theo bản ghi, không phải role đăng nhập riêng.

Capabilities từ backend phục vụ hiển thị giao diện. Backend kiểm tra role, scope, ownership và trạng thái khi thực hiện thao tác. Chức năng Configure Detailed Permissions đã được loại bỏ.

Next.js BFF dùng route handlers /api/* để trao đổi với backend. Access/refresh token được giữ trong cookie HttpOnly, Secure ở production; không lưu trong localStorage/sessionStorage.

Login History hỗ trợ phạm vi cá nhân; Admin/Security Officer có phạm vi tổ chức, Employee/Executive bị giới hạn ở dữ liệu cá nhân theo backend.

## Luồng chính

- Event → backend detection chấm điểm → vượt ngưỡng tạo alert → analyst triage → true positive/false positive/further investigation và feedback.
- Alert xác nhận đúng → incident draft → response/investigation → RCA/lessons learned → close.
- Incident → link Asset/Control/Risk → Control Weakness → reassessment request → Risk Owner review → reassess residual.
- Risk review → residual assessment mới → complete review và ngày review tiếp theo; acceptance có kiểm tra riêng.
- Policy draft → Admin review/approval → publish → đọc và acknowledge.

Ollama hỗ trợ viết explanation; thuật toán backend hiện tính anomaly score. LLM không tự thay Risk hoặc quyết định thay analyst.

## Cấu trúc

```text
src/app/          Routes, layouts, BFF
src/features/     Component, hooks, API, schemas theo domain
src/components/   Shared UI, forms, dialogs, tables và feedback
src/lib/          API client, auth, env và utilities
src/config/       Navigation và cấu hình
src/providers/    Application/query providers
e2e/              Playwright scenarios
design-system/    Design system SecuraAI
```

Luồng: page → feature component → hook → feature API → shared client → BFF → backend.

## Kiểm thử và build

```powershell
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test
corepack pnpm build
corepack pnpm start
```

.test.ts/.test.tsx là kiểm thử tự động. Mock data chỉ dùng trong test, không được insert vào database.

Playwright mặc định dùng port 3000, trùng backend local. Để dùng FE đang chạy:

```powershell
$env:PLAYWRIGHT_PORT = "3001"
corepack pnpm test:e2e
```

Cần browser Playwright phù hợp; PLAYWRIGHT_CHANNEL=chrome cho phép dùng Chrome đã cài. Chuyển nhánh khi dev server đang chạy có thể để lại types cũ trong .next; khởi động lại server và sinh lại types/build khi gặp lỗi route sinh tự động.

## Tài liệu và đóng góp

Đọc [AGENTS.md](AGENTS.md), [DESIGN.md](DESIGN.md) và [design system](design-system/securaai/MASTER.md). Dùng shared components và kiểm tra loading/error/empty, keyboard và responsive.

Backend sibling SecuraAI-Backend cung cấp OpenAPI trong src/docs/openapi.ts, module notes trong src/modules/README.md và baseline/Project Tracking trong project-docs/new/. Contract V1 chưa port trả 501; không giả lập thành chức năng production.

Tạo nhánh từ develop mới nhất, PR vào develop, phát hành qua PR develop → main. Không push trực tiếp/force-push hai nhánh dài hạn. Không commit environment secrets, .next, coverage hoặc test reports.

## Employee business responsibilities

Admin → Users → Assign role, scope & ownership now grants Employee business responsibilities (Risk Owner, Control Owner, Asset Owner, Authorized Approver), using the existing access-assignment API. Responsibilities are permanent eligibility, not organization-wide resource access. Assign records in their modules; existing owners retain their responsibility, and transfer is required before removal. Authorized Approver eligibility requires a workflow-specific assignment and never grants global approval access. No database migration.

Employee responsibility selection is exclusive: at most one of Risk Owner, Control Owner, Asset Owner or Authorized Approver per Employee. An Employee may have no inherited responsibility; click the selected checkbox again to clear it. Transfer conflicting owned records before changing responsibility; legacy multiple ownership is preserved until explicitly resolved.
