# User management

## View user accounts

The user table is backed by the paginated administration API. Users with
`users.read` can select **View** on any row to load current account details from
`/api/users/{userId}`. The dialog presents profile, department, assigned roles,
MFA status and account activity with explicit loading, retry, empty-value and
not-found/error states. The same-origin BFF keeps tokens in HttpOnly cookies and
forwards the request to `/admin/users/{userId}`.

## Add user accounts

Administrators with `users.create` can open the **Add user** dialog. The form
loads active departments and assignable roles from the backend instead of asking
for internal UUIDs or manually entered role codes. It validates labeled profile
fields, requires at least one role, disables submission until reference data is
available, and provides inline error, retry, pending, and success feedback.

The typed same-origin BFF forwards creation and option requests with HttpOnly
cookie authentication. Successful creation refreshes the user list; the
temporary password is delivered by the backend email flow and never enters the
browser response.

## Lock and unlock user accounts (UC7)

The user list exposes a Lock/Unlock button on each eligible account. Both the
ADMIN role and the corresponding backend permission (`users.lock` or
`users.unlock`) are required. Self-management and inactive/disabled accounts
have no action. Backend authorization remains authoritative, including protection
of the last active administrator with both account-management permissions.

Both actions require a NFKC-normalized, trimmed reason of 10–1,000 characters.
The confirmation contains the target account, reason and action buttons.
The backend revokes sessions/MFA challenges while preserving passwords, MFA
settings, roles and business records. Unlock requires a fresh login and does not
restore old sessions. Reasons are submitted to the backend
audit flow; the frontend does not write separate audit records.

The typed feature API posts through `/api/users/{userId}/{lock|unlock}`. The BFF
validates parameters/body, uses HttpOnly-cookie authentication with one refresh
attempt, and forwards to `/admin/users/{userId}/{lock|unlock}`. Zod validates the
response `{ id, status, lastLockedAt, updatedAt, changed }`; `lastLockedAt` is a
historical timestamp retained after unlock. No tokens are returned to the client.

Successful actions invalidate the user list and summary. Idempotent responses
(`changed: false`) show informational feedback. Backend conflicts stay inline,
preserve the reason and refresh stale list data. Pending actions disable submit,
cancel and Escape to prevent accidental duplicate actions or dismissal.

The implementation is verified against the sibling backend's
`src/modules/users/README.md`, routes, DTO, service and
`src/docs/account-lock.openapi.ts`. The backend must deploy UC7 and grant the
permissions before actions appear; an administrator with an older session may
need to sign in again.

Browser fixtures in `e2e/user-account-lock.spec.ts` exercise the flow without
changing real accounts and capture preview screenshots under `test-results/`.
