# SecuraAI Frontend

Incident workflow: **Incidents → Actions → Update handling phase** records an officer's readiness assessment for forward transitions (Open, Triage, Containment, Eradication, Recovery, Lessons learned). Classification, assignment and action journals do not change phase. A note and confirmation are required; the number of recorded actions is not a completion gate. Emergency skips/deferred completion require a reason and are audited without marking skipped work complete. Leaving Recovery requires an officer's restoration/validation attestation, not automated verification by the application. Exact transition restrictions are SecuraAI product rules. The dialog includes audited transition history; mutations refresh incident queries without F5. Closed incidents remain read-only, backward transitions/reopening are not implemented, and closing is a separate use case. No schema changes or rewrites of existing statuses.

UC62: **Incidents → Actions → Root cause & lessons learned** replaces preview findings with the V2 API. GET/PATCH `/api/v1/incidents/:incidentId/analysis` reads/saves the unique `incident_analysis` (root cause, lessons learned, recommended improvements); GET `/analysis/history` paginates before/after audit snapshots. Active Security Officers write only in LESSONS_LEARNED or CLOSED; Security Officers and Executives can read. Required `expectedUpdatedAt` (null initially) prevents stale overwrites. Authenticated analyst and save time are server-owned. Findings/History tabs refresh after save; unsaved input survives tab changes and failed saves. Saving never changes incident status or completes recommendations. No schema changes. 71 legacy routes remain pending after progress migration.

UC61: Record Recovery Actions uses POST/GET `/api/v1/incidents/:incidentId/recovery-actions` and existing V2 `incident_actions` with phase `RECOVERY`. Active Security Officers record completed restoration steps and performed time; the authenticated performer and audit are saved atomically. History is paginated and refreshes after saving. Closed incidents are read-only; recording requires RECOVERY or LESSONS_LEARNED and never changes phase. Verified completion is confirmed separately through PATCH /incidents/:incidentId/progress. No schema changes; 71 legacy contracts remain pending.

UC60: **Incidents → Actions → Record eradication action** records completed removal of root causes, malicious components or threats with a 10–4000 character description and local performed time. The signed-in Security Officer is recorded as performer. **Record action | History** preserves unsaved inputs and refreshes saved history without F5. Closed incidents open read-only history. Existing V2 `incident_actions` with `ERADICATION` is the source; saving does not resolve or close the incident. The previous preview-only fields and example history have been replaced by the published V2 API contract.

UC59: **Incidents → Actions → Record containment action** provides **Record action | History** tabs. Enter completed containment steps and local performed time; the backend records the signed-in Security Officer. Saves refresh incident list/detail and paginated containment history immediately. Closed incidents expose read-only containment history. Existing V2 `incident_actions` is the data source; recording requires CONTAINMENT or a later non-closed phase and never changes phase.

The assignment dialog includes **Assignment | History** tabs matching severity classification and UI UX Pro Max keyboard/focus guidance. History shows previous/new handler, assigning officer, time and note with pagination, loading, error and empty states. Switching tabs retains unsaved fields. Saving refreshes cached history pages even when the History tab is inactive; reopening History shows the new assignment without a page reload. History requests bypass the browser HTTP cache. Closed incidents open read-only history through the same action; no separate History button is added.

UC58: Security Officers use **Incidents → Actions → Assign handler / Reassign handler** to select an active Security Officer and enter a 10–2000 character assignment note. Existing BFF routes connect the V2 assignment-options and assignee APIs. Saves invalidate incident list/detail queries immediately; stale or forbidden responses refresh incident queries and keep the form error visible. First assignment advances OPEN to TRIAGE; later phases are preserved; the backend records an atomic audit trail in existing V2 tables. The dialog keeps the established SecuraAI UI UX Pro Max form pattern.

Incident severity: Security Officers use **Classification | History** in the classification dialog, without a separate History action in the incident menu. History reads paginated audit-backed transitions through `GET /api/incidents/:incidentId/severity`. Switching tabs preserves unsaved classification inputs. Saving invalidates incident lists, detail and history queries. No client-generated history is used.

## Controls and Evidence references

`/controls` uses the existing Control Effectiveness API. Security Officers can Create/Edit Control metadata; assigned Employee Control Owners see only their own Controls. Module discovery uses `compliance.assess-controls`; catalog writes additionally require `controls.create`/`controls.update`. All ownership and status rules are enforced again by BE.

Each accessible Control exposes **Evidence** with **Linked evidence**, **Add evidence** and **Link existing evidence**. BFF routes proxy `GET`/`POST /compliance/controls/:controlId/evidence` and `POST /compliance/controls/:controlId/evidence-links`. Add registers a stable, credential-free HTTPS document reference plus collection metadata and links it atomically; Link reuses an accessible record and records the relevance reason. Search/pagination is backend-scoped and limited to 10 per page. Dates entered here are explicitly Asia/Bangkok (UTC+7). Evidence ownership/linker are recorded by BE, not user-selected; review, uploaded-file metadata and integrity hashes are not fabricated. Identical Add request replay and repeated Link are idempotent; mutations never automatically retry.

This is reference management, **not file upload, document verification, external permission management or a per-assessment immutable file snapshot**. Linked expired/invalid records remain visible for history but are ineligible for a new assessment. Add/Link never automatically marks reviewed, saves an effectiveness result or changes Risk. Review the supporting document, then use **Assess** separately. External repositories must grant the reviewer their own access; documents need not be public. UI uses the established shared dialogs/forms/toasts, preserves failed drafts, confirms discard and refreshes contextual queries/session after authorization or conflict outcomes. No database schema change is needed.

## View Login History

Admin opens `/admin/login-history`; Security Officer opens `/login-history`. Menu visibility and direct navigation require the matching system role plus `login-history.read`. Other accounts redirect to `/forbidden`, and unauthorized accounts never fetch history. The table uses Backend records with search, result/date/IP/user filters and pagination. See [feature documentation](src/features/login-history/README.md). Deploy the Backend implementation and provision its permission, then sign in again before testing.

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

| Backend module                                                                | API route hiện có/prefix                                                                  | Frontend feature  | Navigation                         | Permission                                                                                             |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------ |
| auth                                                                          | `/auth/login`, `/auth/refresh`, `/auth/logout`                                            | `auth`            | `/login`                           | public; refresh/logout theo session                                                                    |
| users                                                                         | `/users/me`, `/admin/users`, `/admin/users/{userId}/lock`, `/admin/users/{userId}/unlock` | `users`           | `/admin/users`, `/users`           | `users.read`; ADMIN và `users.lock` / `users.unlock` cho UC7                                           |
| access-control                                                                | `/access-control/roles`, `/access-control/permissions`                                    | `access-control`  | `/admin/roles`, `/roles`           | `roles.read/create/update/delete` do backend kiểm tra                                                  |
| it-asset-management                                                           | `/assets`, `/assets/business-services`                                                    | `assets`          | `/assets`, `/business-services`    | Asset workflows; Business Services List/Search, Detail, Create, Edit and Deactivate (Security Officer) |
| risk-management                                                               | `/risks` (skeleton)                                                                       | `risks`           | `/risks`                           | chờ contract                                                                                           |
| incident-management                                                           | `/incidents` (skeleton)                                                                   | `incidents`       | `/incidents`                       | chờ contract                                                                                           |
| policy-compliance                                                             | `/compliance` (skeleton)                                                                  | `compliance`      | `/controls`, `/compliance`         | chờ contract                                                                                           |
| audit-settings                                                                | `/administration` (skeleton)                                                              | `audits`          | `/audits`, `/settings`             | chờ contract                                                                                           |
| reporting                                                                     | `/reports` (skeleton)                                                                     | `reports`         | `/dashboard`, `/reports`           | chờ contract                                                                                           |
| notifications                                                                 | `/notifications` (skeleton)                                                               | `notifications`   | `/notifications`                   | chờ contract                                                                                           |
| file-management                                                               | `/files` (skeleton)                                                                       | `file-management` | `/files`                           | chờ contract                                                                                           |
| organization, integrations, security-monitoring, ai-alerts, approval-workflow | module prefix skeleton                                                                    | future features   | chưa đưa vào navigation foundation | chờ contract                                                                                           |

Health endpoints `/health/live` và `/health/ready` không phải feature navigation.

## API và authentication

`apiRequest<T>` kiểm tra status, parse JSON an toàn, hỗ trợ query/`AbortSignal`, chuẩn hóa lỗi và đọc response `{ success, data }`. Mutation không tự retry.

Backend nhận refresh token và trả token pair trong JSON. Next.js BFF trao đổi contract này ở server, giữ access/refresh token trong cookie `HttpOnly`, bật `Secure` ở production và xoay refresh token qua `/api/auth/session` hoặc `/api/auth/refresh`. Frontend không lưu token trong `localStorage`, `sessionStorage` hay cookie đọc được bằng JavaScript. Quản lý vai trò gọi backend qua các Route Handler `/api/access-control/roles` và lấy danh mục quyền đầy đủ qua `/api/access-control/permissions`. OpenAPI hiện là khai báo nội tuyến và chưa đủ để sinh toàn bộ domain types; khi spec đầy đủ nên dùng `openapi-typescript` trong CI thay vì sao chép Prisma schema.

## Khóa và mở khóa tài khoản (UC7)

Danh sách người dùng có nút Lock/Unlock trên từng tài khoản đủ điều kiện. Cả hai thao tác yêu cầu ADMIN, quyền tương ứng và lý do 10–1000 ký tự. Backend kiểm tra trạng thái, chặn tự khóa/mở khóa và bảo vệ quản trị viên cuối cùng; mở khóa yêu cầu đăng nhập lại. Chi tiết contract và kiểm thử tại [features/user-management-authorization/README.md](./src/features/user-management-authorization/README.md).

Smoke test riêng: `pnpm test:e2e user-account-lock.spec.ts --workers=1`. Có thể đặt `PLAYWRIGHT_PORT=3001` để tránh cổng backend; nếu chưa tải Chromium của Playwright, đặt `PLAYWRIGHT_CHANNEL=chrome` để dùng Chrome đã cài. Screenshot fixture xem trước được ghi vào `test-results/`.

## Phạm vi chưa triển khai

Các trang nghiệp vụ chưa tích hợp API thật vẫn là prototype giao diện với dữ liệu mẫu; không được xem là chức năng production. Những trang đó chưa có domain CRUD hoặc KPI lấy từ backend; các nút và bộ lọc trên trang mẫu chưa thực thi hành động. UC7 trong danh sách người dùng gọi API backend thật. Xem [AGENTS.md](./AGENTS.md) trước khi phát triển.

Quy tắc visual, design dials và nguyên tắc UI được ghi tại [DESIGN.md](./DESIGN.md).
