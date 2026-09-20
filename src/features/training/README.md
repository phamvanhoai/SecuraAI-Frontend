# Training reminders (UC79)

UC165 **View My Training Certificates**: Employee opens **Training → My certificates**
or `/training/my-certificates`. The list is paginated and searchable by course,
campaign or certificate number; details show issue and completion dates and
issuer. Backend scopes records to the authenticated user and requires
`training-certificates.read-own` (granted to Employee and Admin by a data-only
migration). Existing certificates are metadata, not generated PDF files.

Real backend in-app reminders appear under **Notifications**, reachable from the
header bell. Employee access
uses the existing `training-assessments.take` permission; the inbox is restricted
to the signed-in account. Mark-as-read is idempotent. Automatic polling only
reads the inbox and never dispatches messages.

The backend sends reminders automatically at the 3-day/1-day deadline milestones
for started, published, unfinished assignments. Dates follow the existing UTC
assessment deadline semantics. Completed/withdrawn/cancelled assignments and
inactive recipients are excluded. No schema change or fake production data.

Frontend uses the existing HttpOnly-cookie BFF, typed API client, Zod boundary
validation and TanStack Query. No token or cron secret is exposed to the browser.
The view reuses the shared header, panel, table, skeleton, pagination, alert and
toast patterns following UI UX Pro Max and the SecuraAI master design system.

Email and other notification categories/preferences are not implemented by UC79.
Search and status submit together via Enter or Search, reset to page 1, and query all of the
account's reminders by title/message (including course names), not just the
current page. Account-wide total/unread metrics stay stable while filtering.
Search combines with All/Unread. No-result state offers Clear search.
See the backend training-awareness README for external/Vercel scheduler setup.

# Assignment eligibility (UC76)

Only published courses expose assignment actions. Draft and archived courses
show an explanation in the actions menu; the backend independently rejects them.
New campaigns create fresh enrollments. Editing the latest campaign retains
existing learner progress and completed records; targets are loaded before editing.

# Structured course creation (UC75)

Use Training > Courses > Create course, or `/training/create`. The long editor
uses a dedicated route and existing product controls rather than an oversized
dialog. Prepare ordered required/optional lessons, multiple text/URL/PDF/video
materials, lesson assessments and an optional final assessment. Single-answer
questions select one correct option; multiple-answer questions require at least
two. New structured courses are drafts; publication is a separate use case.

Files are submitted with the course, not uploaded on selection. Cancel does not
leave uploaded file records. Uses the shared API client, BFF cookies and existing
`training-courses.create` permission. View details loads the saved lesson outline
and exposes authenticated attachment downloads using `training-courses.read`.
PDF/MP4/WebM uploads are limited to 20 MiB per file, maximum 10 uploads. External
resources must use HTTPS and are links, not copies imported into storage.

Local storage requires a persistent backend server/VPS. Host and reverse-proxy
upload limits also apply; this is not production video storage on Vercel.
Structured draft editing and employee learning flows remain separate tasks.

# Complete assigned training course (UC77)

Employees with `training-assessments.take` see My assigned training. The view
opens an enrollment-scoped learning workspace with ordered lessons, text and
HTTPS resources, authenticated file downloads, progress, lesson assessments and
final-assessment guidance. Completion feedback is explicit and responsive; an
assessment-gated lesson cannot be manually bypassed.
