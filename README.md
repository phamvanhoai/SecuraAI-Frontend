# SecuraAI Frontend

<<<<<<< HEAD
Create new version consumes the V2 policy version endpoint. A newly created version is a draft while its parent policy stays active, keeping the current publication available until the replacement is published.
=======
Incident creation is Security Officer-only (manual and confirmed-source modes). Executive retains incident list/detail access without create/handling actions. Other roles retain access to their historical reports without a create prompt. Losing the officer role closes the creation dialog. No new reporting workflow or database changes.
>>>>>>> origin/develop

Giao diá»‡n SecuraAI cho quáº£n lÃ½ rá»§i ro an toÃ n thÃ´ng tin, tÃ i sáº£n, controls, chÃ­nh sÃ¡ch, sá»± cá»‘ vÃ  cáº£nh bÃ¡o báº¥t thÆ°á»ng.

## CÃ´ng nghá»‡

Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4, TanStack Query, React Hook Form vÃ  Zod. Vitest/Testing Library kiá»ƒm thá»­ component; Playwright kiá»ƒm thá»­ trÃ¬nh duyá»‡t.

## Cháº¡y local

YÃªu cáº§u Node.js 22+ vÃ  pnpm theo [package.json](package.json). Khá»Ÿi cháº¡y backend trÆ°á»›c.

```powershell
corepack enable
corepack pnpm install
Copy-Item .env.example .env.local
corepack pnpm dev
```

Chá»‰ sao chÃ©p environment khi chÆ°a cÃ³ cáº¥u hÃ¬nh local. FE: http://localhost:3001. Backend máº·c Ä‘á»‹nh: http://localhost:3000/api/v1.

| Biáº¿n | Má»¥c Ä‘Ã­ch |
| --- | --- |
| NEXT_PUBLIC_APP_NAME | TÃªn á»©ng dá»¥ng |
| NEXT_PUBLIC_API_BASE_URL | Backend URL, gá»“m /api/v1 |
| NEXT_PUBLIC_GOOGLE_CLIENT_ID | Google OAuth client ID, náº¿u sá»­ dá»¥ng |

KhÃ´ng Ä‘Æ°a token, máº­t kháº©u hoáº·c database URL vÃ o biáº¿n NEXT_PUBLIC_*.

## CÃ¡c khu vá»±c chá»©c nÄƒng

| Route | Ná»™i dung |
| --- | --- |
| /login, /forgot-password | ÄÄƒng nháº­p, mÃ£ reset/resend vÃ  Ä‘áº·t láº¡i máº­t kháº©u |
| /profile, /change-password | Há»“ sÆ¡ vÃ  Ä‘á»•i máº­t kháº©u |
| /dashboard | Dashboard theo tÃ i khoáº£n |
| /admin | Quáº£n lÃ½ ngÆ°á»i dÃ¹ng, phÃ²ng ban, import, role vÃ  scope |
| /assets, /assets/business-services | Assets, owner, phÃ¢n loáº¡i, archive, context/history vÃ  business services |
| /risks | Register/detail, inherent/residual, treatment, target, acceptance, review vÃ  reassessment requests |
| /controls | Controls, effectiveness vÃ  evidence |
| /policies | Draft, review, revision, approval, publish, applicability, acknowledgement vÃ  version history |
| /incidents | BÃ¡o cÃ¡o, classification, handler, response actions, RCA, close vÃ  liÃªn káº¿t Risk/Control/Asset |
| /event-logs | Event sources, import, normalized events vÃ  entity mapping |
| /anomaly-monitoring | Manual detection, alerts, triage vÃ  feedback |
| /ai-models | Model versions, metrics vÃ  thresholds |
| /audits, /reports | Audit records vÃ  reporting |
| /integrations | TÃ­ch há»£p vÃ  API-key lifecycle |
| /notifications | Inbox, gá»­i notification/email vÃ  cáº¥u hÃ¬nh kÃªnh |
| /system-logs, /login-history | Tra cá»©u/export logs, configuration history vÃ  login activity |

Navigation vÃ  actions phá»¥ thuá»™c quyá»n, ownership vÃ  tráº¡ng thÃ¡i backend. Route tá»“n táº¡i khÃ´ng báº£o Ä‘áº£m má»i contract lá»‹ch sá»­ Ä‘Ã£ Ä‘Æ°á»£c triá»ƒn khai.

## PhÃ¢n quyá»n vÃ  authentication

Bá»‘n role cá»‘ Ä‘á»‹nh: ADMIN, SECURITY_OFFICER, EXECUTIVE, EMPLOYEE. Risk Owner, Control Owner vÃ  Asset Owner lÃ  trÃ¡ch nhiá»‡m theo báº£n ghi, khÃ´ng pháº£i role Ä‘Äƒng nháº­p riÃªng.

Capabilities tá»« backend phá»¥c vá»¥ hiá»ƒn thá»‹ giao diá»‡n. Backend kiá»ƒm tra role, scope, ownership vÃ  tráº¡ng thÃ¡i khi thá»±c hiá»‡n thao tÃ¡c. Chá»©c nÄƒng Configure Detailed Permissions Ä‘Ã£ Ä‘Æ°á»£c loáº¡i bá».

Next.js BFF dÃ¹ng route handlers /api/* Ä‘á»ƒ trao Ä‘á»•i vá»›i backend. Access/refresh token Ä‘Æ°á»£c giá»¯ trong cookie HttpOnly, Secure á»Ÿ production; khÃ´ng lÆ°u trong localStorage/sessionStorage.

Login History há»— trá»£ pháº¡m vi cÃ¡ nhÃ¢n; Admin/Security Officer cÃ³ pháº¡m vi tá»• chá»©c, Employee/Executive bá»‹ giá»›i háº¡n á»Ÿ dá»¯ liá»‡u cÃ¡ nhÃ¢n theo backend.

## Luá»“ng chÃ­nh

- Event â†’ backend detection cháº¥m Ä‘iá»ƒm â†’ vÆ°á»£t ngÆ°á»¡ng táº¡o alert â†’ analyst triage â†’ true positive/false positive/further investigation vÃ  feedback.
- Alert xÃ¡c nháº­n Ä‘Ãºng â†’ incident draft â†’ response/investigation â†’ RCA/lessons learned â†’ close.
- Incident â†’ link Asset/Control/Risk â†’ Control Weakness â†’ reassessment request â†’ Risk Owner review â†’ reassess residual.
- Risk review â†’ residual assessment má»›i â†’ complete review vÃ  ngÃ y review tiáº¿p theo; acceptance cÃ³ kiá»ƒm tra riÃªng.
- Policy draft â†’ Admin review/approval â†’ publish â†’ Ä‘á»c vÃ  acknowledge.

Ollama há»— trá»£ viáº¿t explanation; thuáº­t toÃ¡n backend hiá»‡n tÃ­nh anomaly score. LLM khÃ´ng tá»± thay Risk hoáº·c quyáº¿t Ä‘á»‹nh thay analyst.

## Cáº¥u trÃºc

```text
src/app/          Routes, layouts, BFF
src/features/     Component, hooks, API, schemas theo domain
src/components/   Shared UI, forms, dialogs, tables vÃ  feedback
src/lib/          API client, auth, env vÃ  utilities
src/config/       Navigation vÃ  cáº¥u hÃ¬nh
src/providers/    Application/query providers
e2e/              Playwright scenarios
design-system/    Design system SecuraAI
```

Luá»“ng: page â†’ feature component â†’ hook â†’ feature API â†’ shared client â†’ BFF â†’ backend.

## Kiá»ƒm thá»­ vÃ  build

```powershell
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test
corepack pnpm build
corepack pnpm start
```

.test.ts/.test.tsx lÃ  kiá»ƒm thá»­ tá»± Ä‘á»™ng. Mock data chá»‰ dÃ¹ng trong test, khÃ´ng Ä‘Æ°á»£c insert vÃ o database.

Playwright máº·c Ä‘á»‹nh dÃ¹ng port 3000, trÃ¹ng backend local. Äá»ƒ dÃ¹ng FE Ä‘ang cháº¡y:

```powershell
$env:PLAYWRIGHT_PORT = "3001"
corepack pnpm test:e2e
```

Cáº§n browser Playwright phÃ¹ há»£p; PLAYWRIGHT_CHANNEL=chrome cho phÃ©p dÃ¹ng Chrome Ä‘Ã£ cÃ i. Chuyá»ƒn nhÃ¡nh khi dev server Ä‘ang cháº¡y cÃ³ thá»ƒ Ä‘á»ƒ láº¡i types cÅ© trong .next; khá»Ÿi Ä‘á»™ng láº¡i server vÃ  sinh láº¡i types/build khi gáº·p lá»—i route sinh tá»± Ä‘á»™ng.

## TÃ i liá»‡u vÃ  Ä‘Ã³ng gÃ³p

Äá»c [AGENTS.md](AGENTS.md), [DESIGN.md](DESIGN.md) vÃ  [design system](design-system/securaai/MASTER.md). DÃ¹ng shared components vÃ  kiá»ƒm tra loading/error/empty, keyboard vÃ  responsive.

Backend sibling SecuraAI-Backend cung cáº¥p OpenAPI trong src/docs/openapi.ts, module notes trong src/modules/README.md vÃ  baseline/Project Tracking trong project-docs/new/. Contract V1 chÆ°a port tráº£ 501; khÃ´ng giáº£ láº­p thÃ nh chá»©c nÄƒng production.

Táº¡o nhÃ¡nh tá»« develop má»›i nháº¥t, PR vÃ o develop, phÃ¡t hÃ nh qua PR develop â†’ main. KhÃ´ng push trá»±c tiáº¿p/force-push hai nhÃ¡nh dÃ i háº¡n. KhÃ´ng commit environment secrets, .next, coverage hoáº·c test reports.

## Employee business responsibilities

Admin â†’ Users â†’ Assign role, scope & ownership now grants Employee business responsibilities (Risk Owner, Control Owner, Asset Owner, Authorized Approver), using the existing access-assignment API. Responsibilities are permanent eligibility, not organization-wide resource access. Assign records in their modules; existing owners retain their responsibility, and transfer is required before removal. Authorized Approver eligibility requires a workflow-specific assignment and never grants global approval access. No database migration.

Employee responsibility selection is exclusive: at most one of Risk Owner, Control Owner, Asset Owner or Authorized Approver per Employee. An Employee may have no inherited responsibility; click the selected checkbox again to clear it. Transfer conflicting owned records before changing responsibility; legacy multiple ownership is preserved until explicitly resolved.
