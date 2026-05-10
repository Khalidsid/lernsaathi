# UX Architecture

**Purpose:** Give future UI tasks a small, explicit design contract.  
**Audience:** Lower-reasoning implementation agents and humans reviewing UI work.  
**Rule:** UI decisions in this file override ad-hoc choices in a slice prompt unless the slice brief documents a deliberate exception.

---

## 1. Product Voice

Use two voices:

- System chrome: English.
- Learning content: formal aap-form Roman Hinglish plus German examples.

Examples:

- Tabs and buttons: `Chat`, `Revise`, `Mistakes`, `Continue`, `Skip`, `Show`, `Sign out`.
- Learning explanations: Hinglish with `aap`, not `tum`.
- German examples: keep German text exact and visually distinct where possible.

Do not mix English/Hinglish slash glosses on meaning lines.

---

## 2. Layout Invariants

The app shell is a chat-style application shell, not a long scrolling webpage.

Required:

- Header remains visible.
- Tab bar remains visible.
- Composer remains visible on chat tab.
- Message stream scrolls internally.
- Body/page scrolling is not needed for normal chat.
- Mobile safe-area bottom padding protects the composer.
- Desktop shell stays visually contained and centered.

Do not move settings, theme controls, logout, or history controls into the composer.

---

## 3. Chat Interaction Model

Chat tab regions:

1. Header and menu.
2. Tab bar.
3. Learning state panel.
4. Message stream.
5. Composer.
6. Name prompt modal when needed.

Rules:

- User messages append optimistically.
- Pending assistant state appears in the message stream.
- Failure appears as a recoverable assistant/system message with clear retry guidance.
- Composer disables only when sending or blocked by modal.
- Image attach button stays disabled until real image upload exists.

---

## 3.1 Auth And Account Visibility

Authentication is part of the product UX, not only provider plumbing.

Rules:

- The login screen must clearly show which sign-in methods are available.
- Do not show fake or disabled registration controls unless the disabled reason is explicit.
- If Google OAuth is not configured, the UI must still explain the available fallback or configuration state.
- After login, the authenticated shell must show which account owns the current learning data.
- Prefer signed-in email as the account label when available. Fallback order: display name, username, `Account`.
- The account label may be compact in the header, but the menu must show the full account identity or a clearly truncated value with accessible full text.
- Sign-out must stay near the account identity so the user understands which account is being signed out.
- Registration UI must not appear unless the backend route/action and provisioning policy are real.

Auth error examples:

- `This email is not allowed for this private app.`
- `Registration is not enabled for this app.`
- `That email already has an account. Sign in instead.`
- `Google sign-in is not configured yet. Use credentials or contact the app owner.`

---

## 3.2 Dashboard And Learning Modes

**Rationale:** User feedback identified confusion with chat-first auto-redirect. Dashboard provides deterministic navigation and clear learning mode selection.

### Navigation Flow

**Before (chat-first):**
```
Login → /chat → Tab navigation (Chat, Revise, Mistakes)
```

**After (menu-driven):**
```
Login → /dashboard → Select mode → Mode-specific UI or existing tab
```

### Dashboard Rules

- Login always redirects to `/dashboard`, never directly to chat
- Dashboard shows 7 learning mode tiles arranged in responsive grid:
  - Desktop (≥640px): 3-column grid
  - Mobile (<640px): 1-column stack
- Each tile shows: icon (emoji), label, brief description
- Active tiles (Chat, Revise, Mistakes) navigate to existing tabs
- Future tiles (Words, Grammar, Reading, Writing, Scenarios) show "Coming soon" state
- Disabled tiles use `opacity: 0.6`, `cursor: not-allowed`, no hover effect
- Active tiles show hover state: border color change, background lighten
- Dashboard includes "Today's Progress" widget showing reviewed count and due count
- Keyboard navigation: Tab through active tiles, Enter to navigate

### Mode Tile Specifications

**Active Mode Tile:**
- Clickable link to existing route
- Clear hover/focus states
- Accessible (keyboard + screen reader)
- Icon + label + description

**Disabled Mode Tile:**
- Visual disabled state (reduced opacity)
- "Coming soon" text
- No click handler
- cursor: not-allowed

**Color Tokens:**
- Use existing design tokens (teal, paper, ink, rule)
- Dark mode: respect theme tokens
- Focus ring: use CSS focus-visible

### Mode-Specific UI (Future)

When mode UIs are implemented (Slice 3.16+):

- Each mode gets dedicated route: `/modes/{mode-name}`
- Use `ModeShell` wrapper component for consistent chrome
- Mode header shows: mode icon + title + back to dashboard link
- Mode content area scrolls independently
- Keep composer pattern for interactive modes
- Card/list pattern for drill/exercise modes

### Integration with Existing Tabs

Chat, Revise, and Mistakes tabs remain accessible:
- Via dashboard tiles
- Via direct URL (`/chat`, `/chat?tab=revise`, `/chat?tab=mistakes`)
- Existing tab navigation preserved
- No breaking changes to current functionality

---

## 4. Required UI States

Every async UI surface must define these states.

| State | Required Behavior |
|---|---|
| Loading | Show skeleton or inline pending copy. Do not leave blank space. |
| Empty | Explain what the user can do next. Include an action when possible. |
| Error | Explain what failed, whether retry helps, and provide retry where possible. |
| Disabled | Make the reason visually clear or inferable from context. |
| Success | Confirm save/review/send completion when the result is not otherwise obvious. |

Do not create a new loading style unless an existing one clearly does not fit.

---

## 5. Error Tone

Errors should be calm and actionable.

Use:

- `Couldn't save right now. Please try again.`
- `Connection issue. Check your internet and retry.`
- `Your session expired. Sign in again.`

Avoid:

- Technical stack details.
- Blame language.
- Silent failures.
- Generic `Something went wrong` without recovery.

---

## 6. Accessibility Contract

Target WCAG 2.2 AA for core flows.

Required:

- Visible focus indicators.
- Keyboard access for every interactive element.
- No keyboard trap except intentional modal focus trap.
- Escape closes menus and modals where expected.
- Focus returns to the trigger after closing menu/modal.
- Dynamic status changes use `aria-live` where the visual change is not enough.
- Icons used only for decoration have `aria-hidden="true"`.
- Icon-only buttons have `aria-label`.
- Reduced motion is respected.

Keyboard shortcut rule:

- Global shortcuts must not fire while focus is in an input, textarea, select, or contenteditable element.

Use this guard:

```ts
function isTextEntryTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}
```

---

## 7. Mobile Contract

Minimum required viewport: `375px` width.

Rules:

- Primary touch targets should be at least `44px x 44px` unless documented.
- Composer must not be hidden by safe area or keyboard in normal use.
- Text must not require horizontal scrolling.
- Menus must fit within viewport width.
- Cards must not rely on hover-only behavior.
- Action buttons must be reachable by thumb on small screens when frequently used.

Manual checks before UI completion:

- 375px mobile viewport.
- Desktop viewport.
- Light theme.
- Dark theme.
- Keyboard-only path.

---

## 8. Motion Contract

Motion must clarify state, not decorate randomly.

Use existing tokens in `app/globals.css`:

- `--motion-duration-instant`
- `--motion-duration-fast`
- `--motion-duration-normal`
- `--motion-duration-slow`
- `--motion-ease-standard`
- `--motion-ease-decelerate`
- `--motion-ease-accelerate`
- `--motion-ease-spring`

Rules:

- Respect `prefers-reduced-motion`.
- Do not add new keyframes without checking existing animations.
- Use shimmer only for skeleton loading.
- Use slide/fade only where movement helps show cause and effect.
- Do not use animation as the only feedback for success or failure.

---

## 9. Component Selection Rules

Before creating a component:

1. Search existing `components/`.
2. Check `docs/COMPONENT_CONTRACTS.md`.
3. Reuse existing visual tokens.
4. Create a new component only if no existing component fits.
5. Add states and accessibility before marking done.

Do not create one-off variants if a small prop on an existing component is enough.

---

## 10. UI Slice Checklist

Before coding:

- Define happy path.
- Define loading path.
- Define empty path.
- Define error path.
- Define disabled path.
- Define mobile behavior.
- Define keyboard behavior.
- Define focus behavior.

Before completion:

- Typecheck passes.
- Lint passes.
- Touched flow works at 375px.
- Light and dark theme checked.
- Keyboard-only path checked.
- No fake controls.
- Docs updated.
