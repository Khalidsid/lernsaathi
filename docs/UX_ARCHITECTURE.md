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

