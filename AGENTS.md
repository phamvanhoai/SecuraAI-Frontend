<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# SecuraAI Frontend — Agent Instructions

## Project context and stack

SecuraAI is an enterprise information-security risk management frontend. Use Node.js 22+, pnpm, stable Next.js App Router, React, TypeScript strict, Tailwind CSS v4, TanStack Query, Zod and React Hook Form. Use Vitest/Testing Library for units and Playwright for browser smoke tests.

## Sources of truth

In order: current user requirement; this file; backend `AGENTS.md`, `src/modules/README.md`, implemented routes/DTOs and OpenAPI; frontend README. Backend at `D:\GITHUB\SecuraAI-Backend` is read-only from this repository. Never edit, move, execute database references from, or otherwise mutate it.

## Architecture and boundaries

- `app/` owns routing, layouts and composition only.
- Domain code lives in `features/<domain>/` and exports its public surface through `index.ts`.
- Reusable UI lives in `components/`; shared infrastructure lives in `lib/`.
- Flow is page/layout → feature component → hook → feature API → shared API client → backend.
- Do not call APIs directly from visual components or place business rules in pages.
- Do not create one-use abstractions. Never invent API contracts or fake production behavior.
- Unimplemented modules display an honest “Chưa triển khai” state without fake metrics.

## Server and Client Components

Prefer Server Components. Add `"use client"` only for browser APIs, state, event handlers, forms or client providers. Keep client boundaries narrow; do not pass secrets into client components.

## API conventions

Use the typed shared API client, `unknown` at external boundaries, `{ success, data }` envelopes, bounded query parameters and `AbortSignal`. Normalize HTTP errors through `ApiError`; never log credentials or sensitive responses. TanStack mutations have no automatic retry. Generate types from OpenAPI only when the published spec is complete; do not derive frontend contracts from Prisma.

## Authentication and security

Never store access or refresh tokens in local/session storage, persisted client state or JavaScript-readable cookies. Require an approved BFF/HttpOnly-cookie flow; cookies must be `Secure` in production with appropriate `SameSite`, lifetime and path. Validate return URLs, use generic authentication errors, filter navigation by backend-defined permissions, and treat UI authorization as defense-in-depth rather than backend enforcement. Preserve security headers and never put secrets in `NEXT_PUBLIC_*`.

## TypeScript and Tailwind

Keep strict mode, `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. No `any`, `@ts-ignore`, non-null assertions or error-skipping build configuration. Prefer `import type` where applicable and explicit exported types. Tailwind v4 uses `@import "tailwindcss"` and CSS theme variables; do not add v3 directives or needless config. Use `cn` for conditional class merging.

## Accessibility

Use semantic HTML, programmatic labels, keyboard-operable controls, visible focus, correct ARIA and sufficient contrast. Verify responsive desktop/tablet/mobile behavior and loading, error, empty and not-found states.

## Toast notifications

- Use the shared `useToast` hook from `@/components/feedback/toast` for transient feedback after user actions. Do not create page-specific toast implementations or add another toast library.
- Use `toast.success`, `toast.error`, `toast.warning` or `toast.info` according to the outcome. Keep titles concise and put recovery guidance in `description`.
- Use inline validation or `Alert` for persistent/form errors; do not use a toast when the message must remain next to the affected field.
- Toasts must never expose credentials, tokens, sensitive response bodies or internal exception details.

## Testing and definition of done

Add schema/boundary tests, behavioral component tests and risk-proportionate browser tests. Done means the requested architecture/behavior is implemented without fake data, relevant docs are current, and `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` and applicable `pnpm test:e2e` pass.

## Git workflow

Base integration on `develop`; implement on `feature/*` or `fix/*`. Never code directly on `main` or `develop`. Merge through Pull Requests. Do not commit, push, create a remote/PR, rewrite history or include unrelated changes unless the user explicitly requests it in the current conversation.
