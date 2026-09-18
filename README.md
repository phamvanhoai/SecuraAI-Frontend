# SecuraAI Frontend

## View Login History

Admin opens `/admin/login-history`; Security Officer opens `/login-history`. Menu visibility and direct navigation require the matching system role plus `login-history.read`. Other accounts redirect to `/forbidden`, and unauthorized accounts never fetch history. The table uses Backend records with search, result/date/IP/user filters and pagination. See [feature documentation](src/features/login-history/README.md). Deploy the Backend implementation and provision its permission, then sign in again before testing.

## UC80 — Training completion certificates

Open **Training → Course actions → View training progress → Assignment campaign → View employees → Issue/View certificate**.
There is one course list, not duplicate courses/completion tabs. Campaigns are filtered by the selected course UUID in the backend. Back to courses preserves the course search/page state. Completion-only readers enter the campaign list directly; employees enter their assigned assessments.
Security Officers with `training-certificates.issue` can issue; users with `training-completion.read` can view.
The backend verifies completed status, 100% progress and a submitted passing assessment. Issuance is idempotent and audited.
The certificate is a persisted metadata record, not a generated PDF. Deploy the backend permission migration and sign in again before testing issuance.

Frontend repository độc lập cho nền tảng quản lý rủi ro an toàn thông tin SecuraAI. Đây là foundation dùng Next.js App Router, React, TypeScript strict và Tailwind CSS v4; các domain chưa có API thật chỉ hiển thị “Chưa triển khai”.

## Yêu cầu và chạy local

- Node.js 22+ (đang phát triển với 22.15.0)
- pnpm 11.25.0 qua Corepack

```bash
corepack enable
pnpm install
Copy-Item .env.example .env.local
pnpm dev
```

Mở `http://localhost:3001`. Backend API mặc định chạy tại `http://localhost:3000/api/v1`. Các lệnh kiểm tra: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm test:e2e`.

## Environment

```dotenv
NEXT_PUBLIC_APP_NAME=SecuraAI
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
```

Chỉ cấu hình công khai mới được đặt trong `NEXT_PUBLIC_*`; không đặt token hoặc secret tại đây.

## Kiến trúc

```text
src/
  app/                 routing, layouts, composition, route handlers
  components/          UI, layout, form, feedback, data-display dùng lại
  config/              site và navigation
  features/            domain code, chỉ export qua index.ts
  lib/                 API, auth/session, env, query client, utilities
  providers/           application và TanStack Query providers
  test/                test setup
e2e/                   Playwright smoke tests
```

Dependency flow: `page/layout -> feature component -> feature hook -> feature API -> shared API client -> Express backend`.

## Ánh xạ backend

Permission code cụ thể chưa được backend công bố; cột permission vì vậy ghi “chờ contract”, không tự tạo code production.

| Backend module                                                                                    | API route hiện có/prefix                               | Frontend feature  | Navigation                         | Permission                                            |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ----------------- | ---------------------------------- | ----------------------------------------------------- |
| auth                                                                                              | `/auth/login`, `/auth/refresh`, `/auth/logout`         | `auth`            | `/login`                           | public; refresh/logout theo session                   |
| users                                                                                             | `/users/me`, `/admin/users`, `/admin/users/{userId}/lock`, `/admin/users/{userId}/unlock` | `users` | `/admin/users`, `/users` | `users.read`; ADMIN và `users.lock` / `users.unlock` cho UC7 |
| access-control                                                                                    | `/access-control/roles`, `/access-control/permissions` | `access-control`  | `/admin/roles`, `/roles`           | `roles.read/create/update/delete` do backend kiểm tra |
| asset-management                                                                                  | `/assets` (skeleton)                                   | `assets`          | `/assets`                          | chờ contract                                          |
| risk-management                                                                                   | `/risks` (skeleton)                                    | `risks`           | `/risks`                           | chờ contract                                          |
| incident-management                                                                               | `/incidents` (skeleton)                                | `incidents`       | `/incidents`                       | chờ contract                                          |
| policy-compliance                                                                                 | `/compliance` (skeleton)                               | `compliance`      | `/controls`, `/compliance`         | chờ contract                                          |
| audit-settings                                                                                    | `/administration` (skeleton)                           | `audits`          | `/audits`, `/settings`             | chờ contract                                          |
| reporting                                                                                         | `/reports` (skeleton)                                  | `reports`         | `/dashboard`, `/reports`           | chờ contract                                          |
| notifications                                                                                     | `/notifications` (skeleton)                            | `notifications`   | `/notifications`                   | chờ contract                                          |
| file-management                                                                                   | `/files` (skeleton)                                    | `file-management` | `/files`                           | chờ contract                                          |
| organization, integrations, security-monitoring, ai-alerts, training-awareness, approval-workflow | module prefix skeleton                                 | future features   | chưa đưa vào navigation foundation | chờ contract                                          |

Health endpoints `/health/live` và `/health/ready` không phải feature navigation.

## API và authentication

`apiRequest<T>` kiểm tra status, parse JSON an toàn, hỗ trợ query/`AbortSignal`, chuẩn hóa lỗi và đọc response `{ success, data }`. Mutation không tự retry.

Backend nhận refresh token và trả token pair trong JSON. Next.js BFF trao đổi contract này ở server, giữ access/refresh token trong cookie `HttpOnly`, bật `Secure` ở production và xoay refresh token qua `/api/auth/session` hoặc `/api/auth/refresh`. Frontend không lưu token trong `localStorage`, `sessionStorage` hay cookie đọc được bằng JavaScript. Quản lý vai trò gọi backend qua các Route Handler `/api/access-control/roles` và lấy danh mục quyền đầy đủ qua `/api/access-control/permissions`. OpenAPI hiện là khai báo nội tuyến và chưa đủ để sinh toàn bộ domain types; khi spec đầy đủ nên dùng `openapi-typescript` trong CI thay vì sao chép Prisma schema.

## Khóa và mở khóa tài khoản (UC7)

Danh sách người dùng có nút Lock/Unlock trên từng tài khoản đủ điều kiện. Cả hai thao tác yêu cầu ADMIN, quyền tương ứng và lý do 10–1000 ký tự. Backend kiểm tra trạng thái, chặn tự khóa/mở khóa và bảo vệ quản trị viên cuối cùng; mở khóa yêu cầu đăng nhập lại. Chi tiết contract và kiểm thử tại [features/users/README.md](./src/features/users/README.md).

Smoke test riêng: `pnpm test:e2e user-account-lock.spec.ts --workers=1`. Có thể đặt `PLAYWRIGHT_PORT=3001` để tránh cổng backend; nếu chưa tải Chromium của Playwright, đặt `PLAYWRIGHT_CHANNEL=chrome` để dùng Chrome đã cài. Screenshot fixture xem trước được ghi vào `test-results/`.

## Phạm vi chưa triển khai

Các trang nghiệp vụ chưa tích hợp API thật vẫn là prototype giao diện với dữ liệu mẫu; không được xem là chức năng production. Những trang đó chưa có domain CRUD hoặc KPI lấy từ backend; các nút và bộ lọc trên trang mẫu chưa thực thi hành động. UC7 trong danh sách người dùng gọi API backend thật. Xem [AGENTS.md](./AGENTS.md) trước khi phát triển.

Quy tắc visual, design dials và nguyên tắc UI được ghi tại [DESIGN.md](./DESIGN.md).
