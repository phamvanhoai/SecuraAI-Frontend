# User management

## Deactivate or remove users

The **Manage** action offers Deactivate for `users.deactivate` and Remove for
`users.remove`. Both require an audited reason. Deactivate blocks sign-in while
keeping the profile visible; Remove performs a backend soft delete, hiding the
account from the list while retaining historical references. Existing sessions
are revoked by the backend. The current administrator cannot manage their own
availability, and the backend protects the last active administrator.

## Edit user accounts

Administrators with `users.update` can edit a user's name, phone, employee code,
and department. Role assignment is a separate privileged action. The dialog loads the current View User data,
keeps email read-only, and refreshes the list and detail cache after a successful
PATCH request. Password and lock status remain separate workflows.

## Assign user roles

ADMIN with `users.assign-role` can open **Assign roles** from a user's actions.
The dialog shows only roles not already assigned, leaves existing roles intact,
warns when ADMIN is selected, and refreshes the list and user details on success.
The recipient must sign in again to receive new permissions. Creating a user
with roles requires both `users.create` and `users.assign-role`.

## View user accounts

The user table is backed by the paginated administration API. Users with
`users.read` can select **View** on any row to load current account details from
`/api/users/{userId}`. The dialog presents profile, department, assigned roles,
Account activity is shown with explicit loading, retry, empty-value and
not-found/error states. The same-origin BFF keeps tokens in HttpOnly cookies and
forwards the request to `/admin/users/{userId}`.

## Add user accounts

Administrators with both `users.create` and `users.assign-role` can open the **Add user** dialog. The form
loads active departments and assignable roles from the backend instead of asking
for internal UUIDs or manually entered role codes. It validates labeled profile
fields, requires at least one role, disables submission until reference data is
available, and provides inline error, retry, pending, and success feedback.

The typed same-origin BFF forwards creation and option requests with HttpOnly
cookie authentication. Successful creation refreshes the user list; the
temporary password is delivered by the backend email flow and never enters the
browser response.
