# Lumyn Security Specification

## Data Invariants
1. A user can only access their own profile.
2. Tasks, habits, moods, decisions, and study plans must belong to a specific user and only that user can read/write them.
3. User profiles are created upon first login and must match the authenticated UID.
4. Timestamps (createdAt, updatedAt) must be server-side generated.
5. Status fields must follow predefined enums.

## The "Dirty Dozen" Payloads (Denial Expected)
1. Creating a task for a different user UID.
2. Updating a task to set a `system_internal` field if we had any.
3. Deleting another user's mood log.
4. Reading the `/users` collection without a specific UID filter.
5. Updating `createdAt` on any document after creation.
6. Spoofing `userId` in a habit document.
7. Creating a user profile with an admin role (if admin was implemented).
8. Injecting a 2MB string into a task title.
9. Listing all tasks across all users.
10. Updating a terminal status (e.g., 'archived') back to 'todo' if logic forbids it.
11. Creating a study plan with a non-existent subject ID (if referencing).
12. Modifying the `uid` of a user document.

## Test Runner (Conceptual)
Tests would verify PERMISSION_DENIED for all unauthorized cross-user access.
