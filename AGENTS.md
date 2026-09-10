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

## Product interface and visual consistency

Treat SecuraAI as a trust-first enterprise security dashboard for administrators and security officers. Preserve the established product design system instead of inventing a new visual language for each feature. UI UX Pro Max is the primary UI/UX methodology for this repository. Read `.agents/skills/ui-ux-pro-max/SKILL.md` completely before UI work and use its Quick Reference, relevant domain guidance, stack guidance and pre-delivery checks. Use these fixed design dials as the default: `DESIGN_VARIANCE: 3`, `MOTION_INTENSITY: 2`, and `VISUAL_DENSITY: 7`.

- Audit nearby implemented product pages and shared components before designing or changing a feature. A new page must look and behave like part of the same application.
- Prefer the shared page header, metric strip, panel, data table, pagination, dialog, form controls, status badge, alert, empty state, skeleton and toast patterns. Extend a shared component when several features need the same behavior; do not create a page-specific imitation.
- Keep one spacing rhythm, radius scale, neutral palette, accent color, typography hierarchy and icon family across the dashboard. Elevation must communicate hierarchy; avoid decorative card grids, gradients, glass effects and excessive rounded containers.
- Dashboard pages should use restrained asymmetry, compact information density and minimal motion. Motion may clarify state changes but must not distract from security operations or delay interaction.
- Forms use visible labels above controls, helper or error text below controls, consistent field spacing and inline validation. Never use placeholder text as the only label.
- Every data view implements matching loading skeletons, actionable empty states, contextual error states, responsive behavior and complete keyboard/focus interaction.
- Before shipping, compare the page at desktop, tablet and mobile widths with at least two existing production-connected pages. Check header placement, actions, filters, table density, pagination, dialogs and feedback states for consistency.
- Keep the UI UX Pro Max installation under `.agents/skills/` versioned with the repository so every contributor and coding agent uses the same guidance. Read the verified master design system at `design-system/securaai/MASTER.md`; page files may only document intentional deviations from that master.
- Use the audit-first and anti-generic principles from [Taste Skill](https://github.com/Leonxlnx/taste-skill) only as a secondary review layer. Its default `design-taste-frontend` skill explicitly targets landing pages, portfolios and redesigns rather than dashboards/data tables, so UI UX Pro Max and the SecuraAI master design system take precedence for product pages.

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

- Use `develop` only as the integration base. Never implement features or fixes directly on `develop` or `main`.
- Create a dedicated branch from the latest `origin/develop` for each assigned use case. Use names such as `feature/view-assets`, `feature/manage-custom-roles`, or `fix/role-list-visibility`.
- Do not reuse a branch after its Pull Request has been merged. Fetch the latest remote state and create the next feature branch from the updated `origin/develop`.
- Integrate changes through GitHub Pull Requests only: `feature/*` or `fix/*` into `develop`, then `develop` into `main`.
- When the user asks to merge, push the source branch and create the appropriate Pull Request. Wait for required checks to succeed before merging. Never replace the Pull Request workflow with a local merge followed by a direct push to `develop` or `main`.
- Treat `develop` and `main` as protected branches. Direct pushes require an explicit emergency-bypass request that names the exact target branch and acknowledges that review and branch checks will be bypassed.
- If a contributor branch is already mergeable, open the Pull Request from that branch as-is. Do not merge `develop` into it merely to synchronize history, and do not add agent-created synchronization commits to the contributor's branch.
- If a contributor branch conflicts with `develop`, leave the contributor branch unchanged. Create a temporary branch such as `integration/<feature>-to-develop`, merge the latest `origin/develop` into the temporary branch, resolve and test there, then open the Pull Request from the temporary branch into `develop`.
- Preserve contributor commits and authorship. Never squash, rewrite, force-push, reset, delete, or append commits to another contributor's branch without explicit authorization for that exact branch and action.
- Commit only when the user explicitly requests a commit. Push only when the user explicitly requests a push and the target branch is clear. Requests to implement, test, review, or fix code do not implicitly authorize committing or pushing.
- Keep each commit scoped to the requested use case and use Conventional Commits, for example `feat(assets): add asset list filters` or `fix(auth): handle expired sessions`.
- Preserve unrelated user changes. Never commit `.env`, secrets, `.next/`, `out/`, coverage, test reports, local logs, editor settings, or other generated files.
- Before committing, inspect `git status`, the staged file list, `git diff --cached`, and `git diff --check`. Before opening or merging a Pull Request, run the checks required by the testing section and report any check that could not run.
