---
trigger: always_on
description: Whenever the model is working on frontend aspect of the project
---

Applies to all work in the Next.js (App Router) + Tailwind CSS frontend, including integrating generated UI (e.g., from Stitch) and any new component or page work.


1. Design System — Use What Already Exists, Do Not Invent

Jetty already has an established visual theme. Before writing or modifying any styling, read the actual current design tokens — tailwind.config.ts, globals.css, and any existing shared components in components/ui/ — and use only the colors, spacing, radius, and shadow values already defined there.

Hard rules:


Never introduce a new color that isn't already a defined token in the current theme config. If a needed color genuinely doesn't exist yet, stop and flag it rather than picking one — do not guess a hex value.
Never introduce a border-radius, shadow, or spacing value outside what's already used elsewhere in the codebase. Match existing components exactly rather than approximating.
When incorporating generated UI (Stitch or otherwise) that uses colors, gradients, glows, or rounding not present in the existing theme, strip those and replace them with the closest existing token — do not preserve generic Web3 defaults (blue/purple/pink palettes, heavy gradients, soft glow shadows, rounded-xl/rounded-full on non-avatar elements) just because the source design included them.
Exceptions to rounding rules (e.g., avatars, toggles, pills/badges) should match whatever the existing codebase already does for those element types — check an existing instance before deciding, don't assume.
Confirm whether the existing theme has defined semantic colors (error/success/warning) separately from the primary palette — reuse those exact tokens for state-based UI, don't invent new ones.


If no relevant existing pattern can be found for a specific case, ask before inventing one.


2. Code Modularization & Extraction

Never dump raw, un-componentized HTML/JSX directly into route files (app/page.tsx). When processing any generated design output, dissect it:


Atomic UI (components/ui/): standalone elements — buttons, inputs, badges, toggles.
Layout Blocks (components/layout/): sections — sidebars, tables, stat grids, headers.
Page Assembly (app/[route]/page.tsx): composition only. No raw DOM elements beyond basic structural wrappers — everything meaningful is an imported component.


Naming convention: components in PascalCase (TokenCard.tsx), files match the component name exactly. No ambiguity between file name and export name.


3. Web3 Integration Boundary


Dumb components: every component in components/ui/ and components/layout/ accepts all data and callbacks via a typed interface Props { ... }. No any in prop types — every prop is explicitly typed.
No wallet or Anchor logic inside atomic/layout components. Never import @solana/wallet-adapter-react hooks or call Anchor program methods directly inside components/ui/ or components/layout/.
Wallet/connection state is still just a prop. If a dumb component needs to render based on connection status (e.g., a connected-wallet badge), that status is computed once at a higher level and passed down as a prop like any other data — it does not get an exception to import wallet hooks directly.
Single integration pattern — hooks only. All Web3 logic, data fetching, and account resolution lives in lib/hooks/ (e.g., useHookConfig, useAllowlistEntries). Route components call these hooks and pass the resulting data down as props. Do not put Web3 logic directly in a top-level route component as an alternative pattern — one pattern, everywhere, for consistency across sessions.



4. Component Data Contracts

Every data-driven component (anything rendering on-chain state) must handle three explicit states, not just the happy path:


Loading — while a hook's fetch is in flight
Error — fetch failed or returned invalid data
Empty — fetch succeeded but there's nothing to show (e.g., no allowlist entries yet)


Define these as part of the component's prop contract, not as an afterthought.


5. Accessibility

This dashboard configures compliance rules for real token mints. Treat accessibility as required, not optional:


Sufficient contrast for all text/background pairs, especially important given the restricted palette in Section 1 — verify contrast against actual theme tokens, don't assume.
All interactive elements (toggles, buttons, form inputs) keyboard-navigable.
ARIA labels on all toggles and icon-only buttons.



6. Integration Execution Steps

When implementing any new design or generated UI:


Read the generated code.
Cross-reference every color, radius, and shadow value against the existing theme (Section 1) — replace anything that doesn't match.
Split the result into atomic components (components/ui/) and layout blocks (components/layout/).
Write typed prop interfaces for each (Section 3).
Assemble the final view in the target app/[route]/page.tsx as composition only.



7. Package Manager

Always use yarn. Never default to npm or generate npm install / package-lock.json instructions.

This is enforced technically, not just by instruction — confirm package.json includes:

json"packageManager": "yarn@<version>"

so npm refuses to run in any Corepack-enabled environment. If this field is missing, add it rather than relying on the instruction alone.