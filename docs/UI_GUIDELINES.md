# UI Guidelines & Code Style

This document defines coding conventions, component modularity, design tokens, and error handling patterns for the React client.

---

## 1. Visual Theme & Design Tokens

KOI uses a **Cyberpunk Neobrutalist Dark Mode** visual theme. Style declarations are built using Tailwind CSS v4 design variables.

### Key CSS Variables & Styling Tokens
*   **Colors**: Harmony-curated dark HSL values.
    *   `--primary`: Vibrant yellow/gold (`hsl(47 100% 56%)`).
    *   `--background`: Dark navy-charcoal (`hsl(210 28% 7%)`).
    *   `--card`: Dark slate (`hsl(210 26% 10%)`).
    *   `--card-border`: Medium slate (`hsl(210 18% 21%)`).
*   **Radii**: Standardized rounded corners of `0.5rem` (`--radius`).
*   **Grid Pattern**: A custom linear grid layout is layered on the body to enhance the digital neobrutalist aesthetic:
    ```css
    background-image:
      linear-gradient(hsl(var(--border) / 0.28) 1px, transparent 1px),
      linear-gradient(90deg, hsl(var(--border) / 0.22) 1px, transparent 1px);
    background-size: 28px 28px;
    ```
*   **Shadows**: High-contrast, sharp, solid shadows to create elevation (e.g. `shadow-[8px_8px_0_hsl(var(--primary))]`).
*   **Animations**: Smooth micro-interactions utilizing `framer-motion` and `tw-animate-css` transitions.

---

## 2. Component Modularity & Code Conventions

*   **Single Responsibility**: Components must reside in their own files under `components/` or `components/ui/` and serve a single functional goal.
*   **No Placeholders**: Do not render mock labels or placeholder text. When loading, render the custom `<Skeleton />` component or `<Toaster />`.
*   **JSX Extension**: All React components must use the `.jsx` file extension, keeping imports clear.
*   **Tailwind Best Practices**: Avoid inline style definitions or complex arbitrary Tailwind values. Use the `cn(...)` utility helper (from `src/lib/utils.js`) to merge class strings cleanly.

---

## 3. Strict Code Constraints

### A. TypeScript Handoff Constraint
The current codebase is written in **pure JavaScript (ES modules)** for maximum code simplicity. However, if TypeScript is introduced in future extensions, the following rules apply:
1.  **Strict `no-any` Policy**: The use of `any` types is strictly prohibited. All parameters, returns, and variables must have explicit interface or type mappings.
2.  **Generic typing**: Type generic components (e.g. customized Select dropdowns) explicitly using generic parameters `<T>`.

### B. React Query Mutators & Error Handling
All server mutations (e.g., casting votes, posting messages, updating IOUs) must wrap request calls with explicit error handlers and toast feedback:

```javascript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast.js";

export function useCastVote() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables) => {
      try {
        const response = await fetchWithAuth("/api/votes", {
          method: "POST",
          body: JSON.stringify(variables.data),
        });
        return response;
      } catch (err) {
        // Enforce explicit error message bubble
        toast({
          variant: "destructive",
          title: "Vote Failed",
          description: err.message || "Failed to submit your vote. Please try again.",
        });
        throw err;
      }
    },
    onSuccess: () => {
      toast({
        title: "Vote Cast",
        description: "Your vote has been logged successfully.",
      });
    }
  });
}
```
*   **No Silent Failures**: Every write operation must display user-facing alert toasts (`use-toast.js` / `<Toaster />`) in case of failures.
