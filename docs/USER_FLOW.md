# User Flow & State Lifecycles

This document details the routing transitions, API triggers, and real-time state lifecycles of all core features.

---

## 1. Authentication & Signup Flow

```text
Landing Page
    │
    ├─► Click "Quick Citizen Access" Preset ──► Call Supabase Auth (Sign-in w/ default pwd 'kamla123')
    │                                                    │
    └─► Click "Create Identity" ──► Input credentials ───┘
                                       │
                                       ▼
                              Supabase Auth JWT Token
                                       │
                                       ▼
                              HTTP Request Headers
                       (Authorization: Bearer <JWT>)
                                       │
                                       ▼
                       Backend `requireAuth.js` Middleware
                                       │
                            ┌──────────┴──────────┐
                            ▼                     ▼
                     [User Exists]         [User Does Not Exist]
                            │                     │
                            │              Insert new row in
                            │              `users` table with
                            │              Supabase UUID and
                            │              metadata fields
                            │                     │
                            └──────────┬──────────┘
                                       ▼
                               req.dbUserId Set
                                       │
                                       ▼
                              Redirect to `/dashboard`
```

---

## 2. Location Voting Lifecycle
Democratic location selection is real-time and exclusive.

1.  **Navigating to `/vote`**: 
    *   The frontend mounts the page and fetches current options using `useListLocations()` and current vote state using `useListVotes()`.
2.  **Casting a Vote**:
    *   The user selects a location (e.g. "Rafir Chaad") and clicks the vote button.
    *   The frontend invokes the mutation `useCastVote()`, which sends a `POST /api/votes` request containing `{ locationId: <ID> }`.
3.  **Database Layer**:
    *   The backend validates the request. If the user already has a vote in `votes` table, it performs an update. If not, it performs an insert (enforced by a `UNIQUE` constraint on `user_id` in the schema).
4.  **Real-time Broadcast**:
    *   On a successful update, the backend invokes `wsServer.js` -> `broadcast({ type: "vote:cast", data: { userId, locationId } })`.
5.  **Cache Invalidation**:
    *   All active client web sockets receive the `vote:cast` message.
    *   The client's `WsProvider` catches the event and runs:
        ```javascript
        queryClient.invalidateQueries({ queryKey: getListVotesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        ```
    *   Vite React triggers a re-fetch, updating the vote charts and leaderboards on the screen immediately without page refresh.

---

## 3. Recording Schedule Lifecycle
Schedules determine when the next podcast recording session takes place.

1.  **Modify Schedule**:
    *   User navigates to `/schedule` and inputs new values for date and time.
    *   Clicking **Save** triggers `useUpdateSchedule()`, executing a `PUT /api/schedule` request.
2.  **Database Layer**:
    *   The backend updates the single schedule row in `schedule` table and writes the updating user's integer ID to `updated_by`.
3.  **Real-time Broadcast**:
    *   The backend calls `broadcast({ type: "schedule:updated", data: { date, time } })`.
4.  **Client Update**:
    *   The clients' WebSocket triggers:
        ```javascript
        queryClient.invalidateQueries({ queryKey: getGetScheduleQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        ```
    *   The UI displays the new date/time with a "just updated by <Citizen Name>" alert.

---

## 4. Chat Room & Reactions Lifecycle
The chatroom is located at `/chat` and facilitates direct group messaging.

1.  **Sending Message**:
    *   User inputs text and clicks **Send**.
    *   Triggers `useSendMessage()`, executing a `POST /api/messages`.
    *   The backend writes the message to the `messages` table.
2.  **Reactions**:
    *   Clicking an emoji on a message triggers `useAddReaction()`, executing a `POST /api/messages/:id/reactions` with `{ emoji: <emoji> }`.
    *   The backend writes a row to the `message_reactions` table.
3.  **Real-time Broadcast**:
    *   On write, the backend broadcasts `message:new` or `message:reaction`.
4.  **UI Update**:
    *   Clients catch the broadcast, invalidate queries, and automatically scroll the chat container to the bottom.

---

## 5. Contributions & Peer Lending (IOUs) Lifecycles

### A. Contributions Pool
*   **Action**: User updates their contribution target via `PUT /api/contributions/me`.
*   **Database**: Inserts or updates the row in `contributions` table.
*   **Real-time**: Broadcasts `contribution:updated`. The dashboard sum updates live.

### B. Lending (IOUs)
*   **Action**: Citizen A lends Citizen B $50. Citizen A fills the form at `/lending` (`POST /api/lending`).
*   **Status Lifecycle**:
    ```text
    [Active Loan Created] ──► Status: "active" ──► Visible in Outstanding debts list
                                                           │
                                                           ▼
                                                    Lender clicks "Mark Repaid"
                                                           │
                                                           ▼
    [Repayment Logged]   ──► Status: "repaid" ──► Repaid timestamp populated in database
    ```
*   **Real-time**: Every loan creation, deletion, or repayment state change triggers a `lending:new` or `lending:updated` WebSocket broadcast, invalidating lending logs and dashboard summaries.
