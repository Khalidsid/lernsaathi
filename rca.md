# Root-cause report

## Summary
The three-dot button logs out because `components/AppShell.tsx` directly wires the MoreHorizontal button to `signOut()`. Theme is currently system-only through `prefers-color-scheme`; there is no manual toggle or persisted override. The visual mismatch is mostly from an intentionally unframed runtime shell that is still too wide and web-like on desktop compared with the mobile-first design artifact. Pending chat requests disable the composer but do not show an assistant placeholder.

## Findings

### A. Three-dot logout
- Current behavior: clicking the three-dot button immediately signs the user out.
- Root cause: `components/AppShell.tsx` imports `signOut` from `next-auth/react` and attaches `onClick={() => signOut({ callbackUrl: "/login" })}` directly to the three-dot button.
- File(s): `components/AppShell.tsx`, in the header button rendered inside `AppShell`.
- Checked and ruled out: the button is not an anchor, is not inside a form submit path, and no hidden menu is firing logout. The button already has `type="button"`.
- Why unsafe: a three-dot affordance conventionally opens more options; using it as immediate logout makes an exploratory click destructive to the session.
- Design expectation: `docs/design_concept/Lernsaathi.html` shows the MoreHorizontal control as a menu button in the chat headers, not as a direct logout action.
- Required fix: make the three-dot button open a menu/popover/drawer. `Sign out` should be a separate explicit menu item.

### B. Dark/light mode
- Current behavior: dark mode follows OS/browser system preference only.
- Root cause / design status: `tailwind.config.ts` does not set `darkMode`, so Tailwind defaults to media-based dark mode. `app/globals.css` also uses `@media (prefers-color-scheme: dark)`. `app/layout.tsx` does not apply a theme class or `data-theme`.
- File(s): `tailwind.config.ts`, `app/globals.css`, `app/layout.tsx`, `components/AppShell.tsx`.
- No persisted theme state found: no runtime `localStorage`, cookie, DB field, `data-theme`, or user-facing toggle exists.
- Design status: visual integration originally specified `prefers-color-scheme`; absence of a manual toggle was acceptable then. The current product expectation makes it an implementation gap.
- Required fix: add `System`, `Light`, `Dark` controls in the three-dot menu. Default to `System`, persist override in `localStorage`, and apply via `data-theme` or Tailwind `.dark` on `<html>`.

### C. Visual mismatch
- Current behavior: production chat is centered in a wide desktop viewport and feels more like a broad web panel than the constrained mobile-first artifact.
- Intentional deviations:
  - Runtime intentionally did not port `.phone`, `.statusbar`, or canvas-only scaffolding.
  - The app should not reintroduce the fake phone frame unless explicitly requested.
  - Revise/Dohraana and Mistakes/Galtiyan data surfaces remain deferred to Slice 3.
- Accidental deviations:
  - `components/AppShell.tsx` uses a broad `max-w-3xl` shell; the design artifact's phone surface is 360px wide.
  - Runtime header spacing differs from the design chat screens.
  - Runtime applies tabs globally in the chat shell, while the specific `// 6.3a`, `// 6.3b`, and `// 6.3c` design chat surfaces are more compact.
  - `components/TabBar.tsx` still uses Hinglish chrome labels (`Baatcheet`, `Dohraana`, `Galtiyan`) even though post-Slice-2 docs record English chrome as intended (`Chat`, `Revise`, `Mistakes`).
  - Dark token usage is partial: Tailwind tokens exist, but several dark colors are hard-coded in components.
- CSS/classes present and used:
  - Present in `app/globals.css`: `.serif`, `.mono`, `.bipair`, `.bipair-dark`, `.assistant-bg`, `.assistant-bg-dark`, `.lemma-underline`, `.hairline`, `.hairline-dark`, `.tabpill`, `.send-btn`, `.send-btn-disabled`, `.fade-in`.
  - Used by `AssistantBlock`, `Composer`, `BilingualPair`, `LemmaAnchor`, and shell components.
- Required fix: keep the real web shell, but constrain width/spacing more deliberately for desktop, use design tokens consistently, and apply English chrome labels in the tab/action surface.

### D. Await animation
- Current behavior: on send, the user bubble appears and the composer disables, but no assistant pending placeholder is shown.
- Root cause: `components/ChatShell.tsx` appends only the user message before awaiting `/api/chat`; the assistant message is appended only after the response JSON arrives. `MessageList` has no pending message rendering path.
- File(s): `components/ChatShell.tsx`, `components\MessageList.tsx`, `components\Composer.tsx`.
- Required fix: while waiting, render a temporary assistant card saying `Soch raha hoon...`; remove/replace it on response or error; keep composer disabled while pending; respect reduced motion.

## Proposed patch plan
1. Replace direct logout on the MoreHorizontal button with an accessible menu. Keep logout as an explicit `Sign out` item.
2. Add theme menu controls: `System`, `Light`, `Dark`; persist in `localStorage`; apply via `data-theme` or Tailwind `.dark`; default remains system preference.
3. Tighten the chat shell width/spacing without adding `.phone` or `.statusbar`.
4. Add pending assistant placeholder rendering during `/api/chat` and `/api/chat/attempt`.
5. Update docs after implementation with validation evidence.

## Safety boundaries
- No schema changes.
- No prompt changes.
- No LLM pipeline changes.
- No auth-provider changes.
- No Prisma migration.
- Keep Postgres/Railway setup untouched.
