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
- Tab bar remains visible where the current chat shell is used.
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
3. Compact learning coach or learning state panel when used.
4. Message stream.
5. Composer.
6. Name prompt modal when needed.

Rules:

- User messages append optimistically.
- Pending assistant state appears in the message stream.
- Failure appears as a recoverable assistant/system message with clear retry guidance.
- Composer disables only when sending or blocked by modal.
- Image attach button stays disabled until real image upload exists.
- Old chat history must not load into a fresh problem journey by default.

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

## 3.2 Problem-First Landing And Learning Journeys

**Rationale:** User feedback identified that chat-first auto-redirect creates confusion and cognitive load. The app should start from the learner's real task, not from app features.

### Navigation Flow

Before:

```text
Login -> /chat -> tab navigation
```

After:

```text
Login -> /dashboard -> choose problem tile -> focused journey screen or existing revision flow
```

### Landing Screen Rules

- Login always redirects to `/dashboard`, never directly to chat.
- `/dashboard` asks: `Which problem do you need assistance with?`
- The Hinglish support line is: `Aapko kis task mein madad chahiye?`
- The landing screen shows exactly six primary problem tiles:
  - `WOERTER`
  - `LESEN`
  - `SCHREIBEN`
  - `GRAMMATIK`
  - `HOEREN`
  - `WIEDERHOLEN`
- German label is the main tile identity; Hinglish explains the task.
- Free chat must not be one of the six primary tiles. It can appear as a quiet secondary link after the user has task context.
- The progress surface is a compact learning coach, collapsed by default, not a large tile.
- Detailed product, tile, copy, visual, and journey rules live in `docs/PROBLEM_FIRST_LEARNING_JOURNEYS.md`.

### Problem Tile Specifications

Required:

- Entire tile is clickable.
- Tile is a real link when it navigates.
- Focus ring visible.
- Hover state indicates clickability, but hover is not required to understand the tile.
- Tile content order: German label, English meaning, Hinglish task line, small action label.
- Tile grid: 3 columns desktop, 2 columns tablet, 1 column at 375px.
- Use `rounded-lg`.
- Do not use fake disabled primary tiles.

### Compact Learning Coach

Default collapsed text:

```text
Practice status: [due] due - [active] active - [done] done today
```

Expanded purpose line:

```text
This tracks due reviews, active mistakes, and today's completed practice.
```

Rules:

- Collapsed by default.
- Target collapsed height: about `44px`.
- Expanded height target: no more than `132px`.
- Uses `aria-expanded` on the toggle.
- Uses `aria-live="polite"` for count updates.
- Does not hide the start of a chat or journey response.

### Journey-Specific UI

When journey UIs are implemented in Slice 3.16+:

- Each problem can get a dedicated route under `/modes/*`.
- Use `JourneyShell` wrapper component for consistent chrome.
- Journey header shows German label, English meaning, Hinglish task line, and back-to-dashboard link.
- Journey content area scrolls independently.
- Each journey has one obvious next action above the fold.
- Old chat history must not appear by default inside a fresh journey.
- Do not fake audio/image controls before real support exists.

### Integration With Existing Routes

Existing routes remain accessible:

- `/chat`
- `/chat?tab=revision`
- `/chat?tab=mistakes`

Do not break existing direct URLs while introducing the problem-first landing flow.

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
