# Product Vision - KOI Platform

## 1. Core Mission
KOI is designed to be the definitive, lightweight hub for a small, tight-knit group of friends ("Citizens") to organize hangout events, record podcast sessions, democratically vote on meeting locations, chat in real-time, and maintain absolute financial transparency through shared expense pools (contributions) and a simple peer-to-peer lending registry (IOUs).

The core mission is **frictionless coordination**. It replaces disjointed chat threads, separate voting links, and external financial tracking apps with a unified, real-time dashboard.

---

## 2. Target Audience & Behavioral Patterns
The target audience consists of a specific, close group of recurring users (represented by presets like *Rafir*, *Ratul*, *Saif*, *Mushfiq*, *Reja*, and *Injam*). Their usage profile dictates the following product design rules:

### A. Quick & Frictionless Entry
*   **Behavior**: Users open the app frequently on both desktop and mobile to check schedules or send messages. Having to manually type credentials every session is a blocker.
*   **Design Response**: The login page must feature a "Quick Citizen Access" grid. Clicking a citizen's preset card performs a direct, behind-the-scenes auth query against Supabase Auth (defaulting to password `kamla123`), registering the user automatically if they are logging in on a new instance.

### B. High Real-time Expectations
*   **Behavior**: When a user casts a location vote or posts a chat message, they expect the group to see it immediately without reloading their browsers.
*   **Design Response**: Real-time WebSocket event broadcasting is a first-class citizen. Every write action (voting, chatting, scheduling, IoUs) triggers a WebSocket broadcast that invalidates Query Client caches instantly across all active sessions.

### C. Transparency over Auditing
*   **Behavior**: Friends lend each other money and contribute to a shared pool. They do not need complex, formal banking compliance; they need a clear, un-falsifiable record of who owes what and who has contributed to the hangout fund.
*   **Design Response**: Simple numeric balance summaries visible to all authenticated users, with peer-to-peer validation of repayments.

---

## 3. "Simplicity First" Philosophy for the MVP
To prevent architectural bloat and keep the code easily maintainable, the MVP enforces the following principles:

*   **No Redux/Complex State Managers**: Rely entirely on server-state cache via `@tanstack/react-query` and React Context for WebSocket streams.
*   **Single-file Schema**: All database tables are declared in a single Drizzle schema file (`backend/src/db/schema.js`) and initialized via a single SQL script (`schema.sql`).
*   **No Orval/SDK Overheads**: Communication with the backend is handled via simple, direct fetch requests wrapped in a unified handler (`fetchWithAuth`) in `frontend/src/lib/api.js`.
*   **CSS v4 Integration**: Styling relies strictly on native Tailwind CSS v4 variables and custom utility tokens, avoiding Tailwind configurations or separate PostCSS configurations where possible.
