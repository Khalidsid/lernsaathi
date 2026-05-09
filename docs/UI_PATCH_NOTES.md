# UI Patch Notes

## Patch name
Chat UI Stabilization Patch

## Position in roadmap
After Slice 2, before Slice 3.

## Why this patch exists
The RCA in `rca.md` identified production UI regressions and implementation gaps in the authenticated chat shell:
- The three-dot button directly logs the user out.
- Theme is system-only, with no manual `System` / `Light` / `Dark` control.
- The desktop chat surface is too wide and feels more like a generic webpage than the mobile-first design artifact.
- Pending chat requests disable the composer but show no assistant placeholder.
- Composer focus can show browser/default colored outlines.
- The chat layout can behave like a long webpage, allowing the composer or top bar to move out of the stable chat frame.

## Enforced UI invariants

### 1. Safe overflow menu
- The three-dot button is an overflow-menu affordance only.
- Clicking it opens/closes a menu, popover, or drawer.
- Opening the menu must never log out the user.
- `Sign out` is a separate explicit menu item.
- The menu closes on Escape.
- The menu closes on outside click.
- The menu is keyboard accessible.
- The button must be `type="button"`.

### 2. Theme control
- Theme choices are `System`, `Light`, and `Dark`.
- Default is `System`.
- User choice persists in `localStorage`.
- Theme is applied on `<html>` using `data-theme` or an equivalent root-level mechanism.
- `System` follows OS/browser `prefers-color-scheme`.
- System preference changes are respected while the selected mode is `System`.
- Do not invent new colors. Use the existing design tokens for light and dark surfaces.

### 3. Chat viewport and scroll model
- The authenticated chat UI behaves like a chat application, not like a long scrolling webpage.
- Browser/body/page should not be the normal chat scroll container.
- App shell uses fixed viewport height, preferably `h-dvh` / `min-h-dvh`.
- App shell uses `overflow-hidden`.
- TopBar remains visible.
- Composer remains visible at the bottom.
- MessageStream is the independent scroll container.
- Long conversations must not push TopBar or Composer out of view.
- Mobile safe-area bottom padding is respected.
- The composer must not require page scrolling to reach it.

### 4. Composer focus behavior
- The composer input must not use browser/default orange, red, or aggressive focus outlines.
- Focus state uses Lernsaathi design tokens.
- Focus is calm but visibly keyboard-accessible.
- Light and dark modes both show a visible non-aggressive focus state.
- Composer contains only input-related controls: attach, send, and staged-image removal if applicable.
- Theme, logout, navigation, settings, and history controls do not live inside Composer.

### 5. Pending assistant state
- User bubble appears immediately.
- Composer disables while `/api/chat` or `/api/chat/attempt` is pending.
- A temporary assistant card appears with:

```txt
Soch raha hoon...
```

- The placeholder is replaced by the assistant response.
- On error, the placeholder is replaced by the existing error surface.
- Motion respects `prefers-reduced-motion`.

### 6. Visual tightening
- Do not add `.phone`.
- Do not add fake `.statusbar`.
- Do not add design-artifact browser chrome.
- Runtime remains a real web app, not a fake phone mockup.
- Desktop max width should be narrow and deliberate, roughly `430px` to `520px`.
- Mobile remains full width.
- Side background uses the app surface token.
- Chat spacing should approximate `// 6.3b` and `// 6.3c`.
- Dark mode should align with design tokens.

## Explicitly out of scope
- DB-backed conversation history.
- Full collapsible ChatGPT-like conversation panel.
- Samsung Store reskin.
- Full desktop sidebar with real recent conversations.
- Revision queue data wiring.
- Mistake list data wiring.
- Profile management beyond existing name modal behavior.
- Schema changes.
- Prisma migration.
- Prompt changes.
- LLM pipeline changes.
- API behavior changes except frontend-only needs.
- Auth-provider rewrite.

## Implementation acceptance checklist
- Clicking `...` opens the menu and does not log out.
- Escape closes the menu.
- Outside click closes the menu.
- `Sign out` logs out only when explicitly clicked.
- `System`, `Light`, and `Dark` theme options are visible in the menu.
- Theme selection persists after refresh.
- `System` follows OS/browser preference.
- TopBar remains visible during normal chat use.
- Composer remains visible at the bottom.
- MessageStream is the only normal scroll container for conversation content.
- Composer respects mobile safe-area bottom padding.
- Composer input has no orange/default browser focus outline.
- Composer focus remains keyboard-visible in light and dark modes.
- Sending a message immediately shows the user bubble.
- Pending assistant placeholder shows `Soch raha hoon...`.
- Real assistant response replaces the placeholder.
- Error response replaces the placeholder with the existing error surface.
- Desktop shell is constrained and intentional.
- Mobile around 360px remains full width and usable.
- No `.phone`, `.statusbar`, fake browser chrome, or design-canvas wrappers are added.

## Validation commands
```bash
npm run typecheck
npm run lint
npm run check:policy
npm run eval
npm run build
```

## Implementation status
Completed locally on 2026-05-09.

- Safe overflow menu implemented in `components/AppShell.tsx`; the three-dot button only opens the menu, and `Sign out` is a separate menu item.
- Theme control implemented with `System`, `Light`, and `Dark`; choice persists in `localStorage` under `lernsaathi-theme` and applies resolved theme on `<html data-theme>`.
- Tailwind dark mode now follows `[data-theme="dark"]`; the old system-only CSS media override was removed.
- Chat shell now uses fixed viewport height, constrained desktop width, stable header/footer regions, and an internal message scroll container.
- Composer and attempt inputs use token-based `focus-within` border/ring states in light and dark modes.
- Pending `/api/chat` and `/api/chat/attempt` requests render a temporary `Soch raha hoon...` assistant card; errors replace the placeholder with the existing fallback message.
- No schema, Prisma migration, prompt, pipeline, auth-provider, DB-backed history, revision queue, or mistake-list data wiring was added.

## Validation evidence
- `npm run typecheck`: pass.
- `npm run lint`: pass.
- `npm run check:policy`: pass.
- `npm run test:unit`: pass.
- `npm run eval`: pass.
- `npm run build`: pass after rerunning outside the sandbox because the first sandboxed build hit `spawn EPERM` during Next.js worker startup.
