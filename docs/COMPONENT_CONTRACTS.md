# Component Contracts

**Purpose:** Make UI component work deterministic for future agents.  
**Rule:** If a component listed here is changed, preserve its contract unless the slice brief explicitly changes it.

---

## 1. AppShell

Owns:

- Fixed app viewport.
- Header.
- Overflow menu.
- Signed-in account visibility when session identity is available.
- Tab bar.
- Optional learning state panel.
- Footer/composer region.

Must:

- Keep header and footer stable.
- Keep message/revision/mistake content in an internal scroll area.
- Respect mobile safe area.
- Provide visible keyboard focus.
- Keep menu actions explicit.
- Show which account is signed in, at least inside the menu.
- Keep sign-out visually and semantically tied to the signed-in account.

Must not:

- Put chat-specific state inside shell.
- Directly submit messages.
- Put image upload controls in the menu.
- Hide account identity once multi-account or registration paths exist.

---

## 1.1 LoginForm

Owns:

- Visible sign-in method choices.
- Credentials sign-in fields when enabled.
- Google sign-in action when configured.
- Registration entry point only when registration is implemented and enabled.

Must:

- Show only real available auth methods.
- Explain when no auth method is configured.
- Show inline errors for failed sign-in or registration.
- Disable actions while pending.
- Keep all controls keyboard reachable.
- Use English chrome.

Must not:

- Show a fake registration button.
- Silently hide Google configuration problems when no fallback exists.
- Persist or log raw passwords.
- Decide account provisioning rules client-side.

---

## 2. TabBar

Owns:

- Navigation between `Chat`, `Revise`, and `Mistakes`.

Must:

- Use English labels.
- Expose navigation semantics.
- Keep active state visible in light and dark themes.

Must not:

- Hide unavailable routes with fake tabs.
- Use Hinglish labels unless product voice changes.

---

## 3. Composer

Owns:

- Main chat text input.
- Disabled image button until Slice 4.
- Send button.

Must:

- Disable send when input is empty or sending.
- Submit on Enter.
- Allow Shift+Enter only if textarea support is added later.
- Keep focus visible.
- Keep image button clearly disabled until real upload exists.

Must not:

- Stage fake images.
- Own global chat state.
- Show settings, logout, or theme controls.

---

## 4. MessageList

Owns:

- Rendering empty chat state.
- Rendering user and assistant messages.
- Rendering pending assistant placeholder.

Must:

- Provide helpful empty state actions.
- Show pending state while chat request is active.
- Preserve message order.
- Avoid parsing markdown for structured content if structured fields exist.

Must not:

- Fetch data directly.
- Persist messages directly.

---

## 5. NamePromptModal

Owns:

- First-login display name capture.
- Skip action.

Must:

- Disable actions while saving.
- Show save error inline.
- Trap focus after focus-management baseline is implemented.
- Return focus after close.
- Use English chrome.

Must not:

- Block permanently if save fails.
- Store personal data outside profile API.

---

## 6. LearningStatePanel

Owns:

- Due revision count.
- Active mistake count.
- Today's review count.
- Refresh action.

Must:

- Show skeleton while loading.
- Show retryable error state.
- Use accurate data source.
- Announce count updates after accessibility baseline is implemented.

Must not:

- Count data that is not actually persisted.
- Create learning state as a client-only illusion.

---

## 7. RevisionCard

Owns:

- One revision prompt.
- Reveal state.
- Rating controls.
- Keyboard shortcuts for reveal and ratings.

Must:

- Hide answer until reveal.
- Disable actions while saving.
- Support `again`, `hard`, `good`, and `easy`.
- Guard shortcuts while user is typing.
- Provide visible button labels and keyboard hints.

Must not:

- Fire global shortcuts from text entry fields.
- Update revision state without server confirmation.

---

## 8. RevisionQueue

Owns:

- List of due revision cards.
- Progress through current queue.
- Save/review request.
- Queue empty state.

Must:

- Prevent duplicate submissions while pending.
- Show save errors.
- Update local queue only after confirmed review.
- Keep progress count accurate.

Must not:

- Double-count reviews.
- Hide failed saves.

---

## 9. MistakesPanel

Owns:

- Grouped mistake list.
- Empty mistakes state.

Must:

- Group by recency.
- Use clear status labels.
- Link to revision only if revision flow is available.

Must not:

- Show fake detail drawers.
- Promise practice flows that do not exist.

---

## 10. Toast

Owns:

- Temporary non-blocking feedback.

Must:

- Use `role="alert"` or equivalent live announcement.
- Be dismissible.
- Not replace inline errors for forms.

Must not:

- Be added for every minor state change.
- Hide critical failures.

Decision:

- If not integrated into a real flow, keep it out of user-visible architecture or remove it.

---

## 11. New Component Checklist

Before adding a component:

- Can an existing component be reused?
- What state does it own?
- What state comes from props?
- What loading state exists?
- What error state exists?
- What empty state exists?
- What keyboard behavior exists?
- What ARIA labels are needed?
- What mobile behavior exists?
- What docs must be updated?
