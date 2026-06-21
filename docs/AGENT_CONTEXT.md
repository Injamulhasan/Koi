# Master Agent Rules & Context (`AGENT_CONTEXT.md`)

> **ATTENTION FUTURE AGENTS & DEVELOPERS:**  
> Read this document and the entire `/docs` directory **BEFORE** writing a single line of code or modifying any files in the workspace. Failure to follow these rules will violate core constraints and may result in build breakages.

---

## 1. Core Constraints & AI Behavioral Rules

### Rule 1: No TypeScript in JavaScript Files
The codebase is structured as a **pure JavaScript** project. 
*   Do NOT add TypeScript configurations, `.ts` files, or `.tsx` files.
*   Do NOT use Type definitions or compile-time annotations in code. Use standard JS modules.
*   Keep files as `.js` (helper logic/hooks) and `.jsx` (React UI files).

### Rule 2: Keep the Core Simple & Integrated
*   Avoid adding external libraries or NPM packages unless explicitly requested. Use native JS APIs (like the `ws` module for WebSockets or native browser `WebSocket` client API).
*   Avoid creating redundant custom helper frameworks. Interface with the backend strictly through the `fetchWithAuth` client in `frontend/src/lib/api.js`.

### Rule 3: Enforce SSL and Pooler Details for Supabase DB
*   When writing database connection code, always allow bypass for self-signed certificates (`ssl: { rejectUnauthorized: false }`) when connecting to Supabase poolers.
*   Use the transaction pooler host `aws-1-ap-southeast-1.pooler.supabase.com` on port `6543` in your default connection configurations for local development in IPv4 environments.

### Rule 4: Presets Must Remain Frictionless
*   Never remove or disable the "Quick Citizen Access" presets from the sign-in provider (`frontend/src/lib/auth.jsx`).
*   Any new citizen preset added in the future must follow the exact auto-signup/auto-signin flow with default credentials (`kamla123`) to ensure zero-friction testing.

---

## 2. Operational Workflow & Approval Checkpoints

You **MUST** pause execution and obtain explicit human approval before performing any of the following actions:

| Action Category | Target Files / Actions | Pause & Approval Required? |
| :--- | :--- | :--- |
| **Database Migrations** | Altering `schema.sql` or `schema.js` | **YES** — Confirm table alterations or primary key modifications. |
| **Dependency Changes** | Running `pnpm add` or changing `package.json` | **YES** — Confirm version number and security policies. |
| **Routing Changes** | Adding pages or modifying `App.jsx` routes | **YES** — Confirm user paths and routing limits. |
| **Deployment Changes** | Modifying `render.yaml` or build steps | **YES** — Confirm host environment compatibilities. |

---

## 3. Verification & Testing Requirements

Before concluding any work session, you must perform the following validation protocol:

### A. Production Build Check
Run the production compiler at the root of the project to ensure there are no module resolution or syntax errors:
```bash
pnpm run build
```
The client React assets under `frontend/dist` must compile with **zero errors**.

### B. Dev Server Health check
Start the backend dev server locally and verify that it boots up without throwing unhandled exceptions:
```bash
pnpm --filter podcast-planner-backend run dev
```
Confirm the logger outputs:
`INFO: WebSocket server initialized at /api/ws`  
`INFO: Server listening port: 3000`

### C. Check for Git Cleanliness
Verify that no sensitive credentials (`.env` files, local testing scripts, build output files) are tracked by Git:
```bash
git status
```
If any untracked or sensitive files are staged, remove them immediately.
