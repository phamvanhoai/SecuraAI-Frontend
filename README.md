# SecuraAI Frontend

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

Mở `http://localhost:3000`. Các lệnh kiểm tra: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm test:e2e`.

## Environment

```dotenv
NEXT_PUBLIC_APP_NAME=SecuraAI
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
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
| users                                                                                             | `/users/me`                                            | `users`           | `/users`                           | chờ contract CRUD                                     |
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

## Phạm vi chưa triển khai

Ngoại trừ luồng đăng nhập/BFF và quản lý vai trò đã tích hợp thật, các trang nghiệp vụ còn lại hiện là prototype giao diện với dữ liệu mẫu được gắn nhãn rõ ràng. Các module đó chưa có domain CRUD, KPI lấy từ backend, upload, thông báo realtime hoặc tích hợp AI; các nút và bộ lọc trên trang mẫu chưa thực thi hành động. Xem [AGENTS.md](./AGENTS.md) trước khi phát triển.

Quy tắc visual, design dials và nguyên tắc UI được ghi tại [DESIGN.md](./DESIGN.md).
