# SecuraAI Design System Master

This file is the visual source of truth for all SecuraAI product interfaces. Page-specific files under `pages/` may describe intentional deviations only. Existing semantic tokens and shared components remain authoritative implementation primitives.

## Design read

Trust-first enterprise cybersecurity and GRC dashboard for administrators, security officers, employees, executives and auditors. The interface prioritizes legibility, predictable operation, auditability and dense-but-calm information presentation.

## Design dials

- `DESIGN_VARIANCE: 3`: predictable application structure with restrained asymmetry.
- `MOTION_INTENSITY: 2`: focus, hover, press and state-change feedback only.
- `VISUAL_DENSITY: 7`: compact operational dashboards using an 8px rhythm.

## Foundations

- Typography: Geist via `next/font`; use the existing type scale and tabular figures for metrics.
- Icons: Lucide only, because it is the established dependency. Use consistent sizing and `strokeWidth={1.8}` when modifying product icons.
- Color: consume semantic CSS variables from `src/app/globals.css`; never introduce page-local hex colors.
- Shapes: controls use 8px radius, containers 12px, status badges may be pill-shaped.
- Elevation: borders and spacing establish hierarchy. Shadows are reserved for overlays and must be subtle.
- Motion: no decorative or scroll-triggered animation. Honor `prefers-reduced-motion`.

## Semantic palette

| Role | Light token | Dark token |
| --- | --- | --- |
| Background | `--background: #f6f8fc` | `#081326` |
| Foreground | `--foreground: #101b3f` | `#edf3ff` |
| Surface | `--surface: #ffffff` | `#0d1c34` |
| Muted text | `--muted: #60708f` | `#9db0cf` |
| Border | `--border: #dfe6f2` | `#243856` |
| Primary action | `--brand: #1769f6` | `#5d96ff` |
| Navigation | `--sidebar: #071a36` | `#050f21` |
| Success | `--success: #159455` | `#5bd18d` |
| Warning | `--warning: #c27208` | `#f0b95b` |
| Danger | `--danger: #dc3545` | `#ff858e` |

Status meaning must always include text or an icon and must never depend on color alone.

## Page anatomy

1. Use the shared dashboard layout and navigation.
2. Use one shared product page header with a concise title, supporting sentence and at most one primary action.
3. Show metrics only when backed by real data and useful for the task.
4. Place search and filters directly above the related data view.
5. Use the shared table and pagination patterns for collections.
6. Use shared dialogs for bounded create/edit tasks; use dedicated routes for long or multi-step workflows.

## Components and states

- Reuse `Button`, `Input`, `Select`, `Checkbox`, `Textarea`, `Dialog`, `DataTable`, `Pagination`, `Alert`, `EmptyState`, `Skeleton`, `StatusBadge`, `ProductPageHeader`, `MetricStrip` and `ProductPanel`.
- Inputs have persistent labels above controls, optional helper text and field-specific errors below controls.
- Primary, secondary and destructive actions must remain visually distinct and stable across pages.
- Dialogs require focus management, Escape/cancel support, a visible title and protection against accidental loss of unsaved changes when appropriate.
- Loading skeletons should approximate final geometry. Errors provide recovery. Empty states explain how to populate the view.
- Interactive targets are at least 40px on desktop and 44px on touch layouts, with visible keyboard focus.

## Responsive behavior

- Validate at 375px, 768px, 1024px and 1440px.
- Avoid horizontal page scrolling. Tables may use an intentional accessible overflow container when columns cannot collapse.
- Stack page headers and actions on narrow screens. Collapse secondary detail before primary task controls.
- Dialogs remain within `calc(100dvh - 2rem)` and scroll internally without hiding focused controls.

## Forbidden patterns

- Page-specific palettes, gradients, glass effects or arbitrary shadows.
- A different header, filter bar, table, pagination or modal pattern for each feature.
- Fake production metrics or sample data presented as live data.
- Placeholder-only form labels, invisible focus, emoji icons or color-only statuses.
- Decorative animation, layout-shifting hover effects or interaction blocked by animation.
- Marketing layouts such as heroes, repeated CTA sections, social proof or feature-card showcases inside authenticated product screens.

## Pre-delivery audit

- Compare the page with at least two production-connected SecuraAI pages.
- Verify light and dark themes, keyboard flow, focus visibility and text/non-text contrast.
- Verify loading, error, empty, success and permission-denied paths.
- Verify long labels, identifiers and localized dates do not clip.
- Run typecheck, lint, unit/component tests, production build and applicable Playwright smoke tests.
