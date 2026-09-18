# View Login History

Admin navigation uses `/admin/login-history`; Security Officer uses `/login-history`. Both use the same feature. Menu visibility and direct navigation require an active session with ADMIN or SECURITY_OFFICER and `login-history.read`. Disallowed accounts redirect to `/forbidden`; missing/expired sessions redirect to login. Backend 403 also redirects to forbidden without displaying historical data.

The BFF GET `/api/login-history` validates bounded, allow-listed parameters and forwards to GET `/api/v1/login-history` through the existing HttpOnly cookie flow, including token refresh. Backend remains the authority for authentication, account state and authorization. TanStack queries are disabled until authorization succeeds and use AbortSignal with no automatic retries.

Search names/attempted emails, filter success/failed, inclusive timestamps, exact IP and optional user UUID. Dates entered in local device time are sent as ISO UTC. Pagination defaults to 20 (choices 20/50/100); order defaults to newest first. No sample metrics or reconstructed historical events. Unknown user names and absent metadata have explicit fallback states. User agent is shown as recorded, without inferred device details.

All feature copy is in English. Filters load automatically; search, IP and user UUID inputs debounce for 350 ms. Select/date changes apply immediately, with page reset to 1. Invalid input keeps the last valid results and shows inline errors. IP filtering uses an exact recorded address; ::1 is IPv6 localhost. Expand User ID in a row to copy its UUID; name/email search remains available.
