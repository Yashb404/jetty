---
trigger: model_decision
description: Whenever the model is working on frontend aspect of the project
---

You are managing a Next.js (App Router) + Tailwind CSS frontend. When incorporating generated UI code (e.g., from Stitch), you must strictly adhere to the following constraints.

You are forbidden from generating generic Web3 aesthetics. 
* **BANNED:** Blue, purple, pink, or neon color palettes.
* **BANNED:** Gradients (`bg-gradient-to-r`), glows, and soft drop-shadows (`shadow-lg`, `shadow-xl`).
* **BANNED:** Heavily rounded corners (`rounded-xl`, `rounded-full` except for avatars).

### 2. Code Modularization & Extraction
Never dump raw, un-componentized HTML/JSX directly into route files (`app/page.tsx`). When processing Stitch output, you must dissect it:
* **Atomic UI:** Extract standalone elements (buttons, inputs, badges) into `components/ui/`.
* **Layout Blocks:** Extract sections (sidebars, tables, stat grids) into `components/layout/`.
* **Page Assembly:** `app/[route]/page.tsx` must only contain the composition of these imported components, not raw DOM elements.

### 3. Safe Web3 Integration Boundary
* **Dumb Components:** All UI components in `components/ui/` and `components/layout/` must be "dumb". They accept data and callbacks via props (`interface Props { ... }`).
* **State Isolation:** Never embed `@solana/wallet-adapter-react` hooks or Anchor program calls directly inside atomic UI components.
* **Integration Layer:** Web3 logic and data fetching must remain in `lib/hooks/` or at the top-level route component, which then passes the raw data down to the UI components.

### 4. Integration Execution
When asked to implement a Stitch design:
1.  Read the generated code.
2.  Split the code into the required atomic components.
3.  Write the component files to `components/ui/` or `components/layout/`.
4.  Assemble the final view in the target `app/` route.