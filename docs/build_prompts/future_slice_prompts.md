# Build Prompts - Future Slices

> Read this file before starting any future slice after Slice 3. It turns the current product insights into implementation prompts. The goal is not to build a large "smart tutor" in one pass. The goal is to build a reliable learning system one bounded slice at a time.

**Current process note:** This file is now a legacy prompt library and product-direction reference. Future implementation should start from `docs/LOW_REASONING_DEV_PROTOCOL.md` plus the active `docs/slices/SLICE_*_BRIEF.md`. Use this file only for slice-specific product intent when the active brief points here.

## How To Use This File

- Treat each slice section as the prompt for that slice.
- Do not start a later slice until the earlier slice reaches its required status in `docs/SLICE_MAP.md`, is documented, and is verified.
- For lower-reasoning sessions, do not paste a large slice section directly into the task. Convert it into a work packet using `docs/LOW_REASONING_DEV_PROTOCOL.md`.
- Every future slice must have a short brief in `docs/slices/` before implementation starts.
- The active brief controls allowed files, non-goals, required reads, validation, and stop conditions.
- If a slice exposes UI, do a browser walk in light and dark mode before calling it done.
- If a slice changes the learning pipeline, add unit/eval coverage before relying on manual inspection.
- If a slice changes data ownership, auth, request identity, persistence, or scheduling, add server-side tests.
- If a feature cannot be made real in the current slice, hide it or mark it clearly as planned. Do not ship fake controls.

## Product Standard For All Future Slices

Every slice must preserve these standards:

- The app is a diagnostic German learning companion, not a generic chatbot.
- Automation owns structure, memory, timing, safety, and progress.
- The LLM owns nuance, explanation, examples, and flexible feedback inside a controlled module.
- Every useful turn should classify the learner need, pick a module, respond directly, add real-world or examiner-relevant context when appropriate, and offer one targeted next action.
- Learner-facing explanations stay formal aap-form Roman Hinglish plus German.
- UI chrome uses clear English action labels unless a documented learning surface specifically needs Hinglish.
- No streaks, XP, badges, leaderboards, or pressure-heavy public scores.
- No fake image upload, fake capture, fake history, fake analytics, or placeholder buttons that look functional.
- High contrast, stable layout, visible focus states, safe mobile viewport behavior, and predictable touch targets are part of the definition of done.
- Docs update is part of every slice, not an optional cleanup.

## Mandatory Reads Before Any Future Slice

Read these first for every future slice:

1. `docs/SLICE_MAP.md`
2. `docs/LOW_REASONING_DEV_PROTOCOL.md`
3. The active `docs/slices/SLICE_*_BRIEF.md`
4. The code touched by the slice

Read these only when the active brief requires them:

1. `docs/ARCHITECTURE.md`
2. `docs/PROMPT_PIPELINE.md`
3. `docs/RETROSPECTIVE_ARCHITECTURAL_ANALYSIS.md`
4. This file

For UI slices also read:

1. `docs/UX_ARCHITECTURE.md`
2. `docs/COMPONENT_CONTRACTS.md`
3. `docs/NAMING.md`
4. `components/AppShell.tsx`
5. `components/ChatShell.tsx`
6. `components/Composer.tsx`
7. `app/globals.css`
8. `tailwind.config.ts`

Read `docs/VISUAL_INTEGRATION_NOTES.md` and `docs/UI_PATCH_NOTES.md` only when changing established visual language or shell behavior.

For pipeline slices also read:

1. `prompts/system_core.md`
2. `prompts/style_guide_hinglish.md`
3. `prompts/classifier.md`
4. `lib/pipeline/*`
5. `lib/assistant-response.ts`
6. `eval/*`

## Shared Completion Checklist

Each slice reaches `complete` only when:

- Scope is implemented without pulling in later slices.
- Typecheck, lint, policy checks, unit tests, eval, and build are run when relevant.
- Docs record what was built, what was deferred, and what evidence remains pending.
- `docs/SLICE_MAP.md` uses exact status words from `docs/LOW_REASONING_DEV_PROTOCOL.md`.
- User-facing text follows formal aap-form rules.
- The UI has no known overflow, hidden composer, inaccessible menu, or dead control.
- Existing Slice 2 and Slice 3 learning flows still work.
- New behavior is backed by durable data where durability is promised.

---

# Slice 3.5 - Auth And Session Hardening

## Purpose

Move the app from the original single-user credentials architecture toward safe identity, request ownership, and multi-session behavior before image upload or broader learning modules are added.

## Why This Comes First

Image upload, multi-device usage, and stronger personalization require trustworthy user identity and duplicate-request handling. Without this slice, later features can create wrong ownership, duplicate learning rows, duplicate revision progress, or unsafe file access.

## Build Scope

- Add Google OAuth as the primary login path.
- Use an allowlisted Google email policy first, not open signup.
- Preserve existing seeded user learning data by mapping it to the approved Google identity.
- Decide and implement the minimum schema provisions needed for future password registration.
- Keep learning data ownership based on stable `User.id`.
- Add request idempotency for chat submissions and revision review actions.
- Guard mistake and revision item creation against duplicate or parallel requests.
- Rework rate limiting and daily spend tracking so the design can handle multiple sessions and later multiple deployment instances.
- Keep credentials login only if explicitly documented as a temporary migration fallback.

## Explicit Anti-Goals

- Do not add public open registration.
- Do not add password reset UI.
- Do not add email magic-link auth.
- Do not add providers beyond Google.
- Do not implement image upload.
- Do not rewrite the learning pipeline.
- Do not expose a full settings/account-management product surface.

## Required Design Decisions Before Code

Document the answer to each in `docs/SLICE_3_5_AUTH_SESSION_NOTES.md`:

- Is the allowlist one email or several collaborator emails?
- Does the old credentials login remain temporarily?
- Is future password registration represented by `User.passwordHash` or an account/provider table?
- What idempotency key format does the client generate?
- Are spend limits global, per-user, or both?
- Is durable rate limiting implemented now or documented as a follow-up?

## Acceptance Criteria

- Approved Google account can sign in.
- Non-allowlisted Google account cannot enter the app.
- Existing learning data remains attached to the migrated user.
- Login counters and timestamps still behave correctly.
- All protected routes still reject unauthenticated access.
- Double-submitting a chat request does not create duplicate persisted turns.
- Double-clicking a revision review does not double-count progress.
- Parallel Revise tab loads do not create duplicate `RevisionItem` rows.
- Rate and spend behavior is documented and tested for multiple sessions.
- Password-registration provisions exist if chosen, but no public password registration UI is exposed.

## Validation

Run:

```bash
npm run typecheck
npm run lint
npm run check:policy
npm run test:unit
npm run eval
npm run build
```

Also manually verify login, logout, route protection, and migration of the existing learning user.

---

# Slice 3.6 - Learning Decision Contract

## Purpose

Define the contract that turns the app from "question in, LLM answer out" into a controlled decision engine. This slice creates the internal shape, tests, and module boundaries. It should not attempt a broad UI redesign.

## Core Principle

Every learner turn should produce an internal decision before any final response is rendered:

```ts
type TurnDecision = {
  inputType: string;
  module: string;
  responseDepth: "quick_answer" | "guided_explanation" | "full_diagnostic";
  learnerNeed: string | null;
  realWorldLens: string | null;
  examLens: string | null;
  memoryAction: "none" | "create_mistake" | "update_mistake" | "schedule_revision";
  nextAction: "none" | "chhota_check" | "micro_practice" | "review_due_card" | "show_pattern";
  confidence: "high" | "medium" | "low";
};
```

The exact TypeScript shape can differ if the implementation needs it, but the fields above must be represented conceptually.

## Build Scope

- Add a documented `TurnDecision` contract.
- Define supported modules:
  - `word_query`
  - `phrase_query`
  - `grammar_question`
  - `sentence_correction`
  - `revision_attempt`
  - `mistake_practice`
  - `writing_support`
  - `exam_task_decoding`
  - `image_description`
  - `out_of_scope`
- Define response contracts for each module.
- Define how prior mistakes, due revision cards, and learner profile influence routing.
- Add unit tests for deterministic decisions using fixed inputs and fixture learner state.
- Update docs so later slices do not invent a new routing model.

## Explicit Anti-Goals

- Do not add Google auth here; that is Slice 3.5.
- Do not implement a broad new UI.
- Do not implement image upload.
- Do not implement writing support end to end.
- Do not replace all existing prompts in one pass.
- Do not make the LLM decide the entire decision object without guardrails.

## Acceptance Criteria

- The app has a typed or otherwise enforceable decision contract.
- Each existing input path maps to one supported module.
- Prior-mistake awareness is represented in the contract.
- Real-world and examiner-context fields exist internally, but user-facing exam pressure remains controlled.
- Existing Slice 2 and Slice 3 flows still work.
- Tests prove representative decisions for word, phrase, grammar question, sentence correction, prior-mistake lookup, due revision, and out-of-scope input.

## Documentation

Update:

- `docs/ARCHITECTURE.md`
- `docs/PROMPT_PIPELINE.md`
- `docs/SLICE_MAP.md`
- a new `docs/SLICE_3_6_DECISION_CONTRACT_NOTES.md`

---

# Slice 3.7 - Decision Engine V1

## Purpose

Implement the first production decision engine using the Slice 3.6 contract. This slice makes routing practical and reliable but keeps UI changes minimal.

## Build Scope

- Insert a decision-planning stage between classifier/context lookup and responder.
- Load learner context before response planning:
  - recent relevant `LearningEvent` rows
  - active mistakes
  - due revision cards
  - learner profile
  - relevant exam-readiness skill hints
- Route each turn to one module-specific response contract.
- Ensure each useful answer has one targeted next action when appropriate.
- Ensure prior mistakes can upgrade a plain lookup into guided explanation.
- Make responder prompts consume the decision object instead of improvising module behavior.
- Log decision metadata into `LearningEvent` if schema support is needed.

## Explicit Anti-Goals

- Do not redesign the chat UI.
- Do not create a dashboard.
- Do not implement image upload.
- Do not expose exam-readiness scores to the learner.
- Do not add many next actions per answer. One clear next action is the default.
- Do not let the LLM override deterministic scheduling or ownership rules.

## Acceptance Criteria

- Existing word/phrase queries still answer directly.
- Grammar and sentence correction still trigger the diagnostic loop.
- Prior related mistakes reliably influence depth and response shape.
- Out-of-scope input remains cheap and controlled.
- The decision object is logged or inspectable in a safe internal form.
- Evals cover each module currently reachable by UI.
- The app never returns a blank or generic failure when classification succeeds.

## Quality Bar

The learner should feel the response is targeted, not just generated. The response should answer the actual question first, then explain the pattern, then offer one useful next action.

---

# Slice 3.8 - Learning Momentum UI

## Purpose

Make the app feel alive by exposing useful learning state and next actions without turning it into a cluttered dashboard. Implement smooth animations, microinteractions, and loading states that make the app feel polished and responsive.

## Build Scope

### Core UI Features
- Add a compact "today" or learning-state surface in the authenticated shell.
- Show due revision count.
- Show active mistake count.
- Show today's completed review count if available.
- Add better empty states with quick-start actions.
- Add visible feedback when a mistake is saved or scheduled.
- Add a clear next-best-action entry point.
- Improve composer ergonomics if needed:
  - auto-growing multiline input
  - quick action chips
  - better disabled/pending reason
  - hide or clearly disable unavailable upload controls

### Motion Design & Animations

**State Transition Animations**
- Empty → populated states: Fade in content with 200ms ease-out + subtle scale (0.95 → 1.0)
- Count updates: Spring animation when numbers change (due count, mistake count, completed count)
- Tab switching: Slide transition with 250ms cubic-bezier(0.4, 0.0, 0.2, 1)
- Panel expand/collapse: Height transition 300ms with ease-in-out

**Microinteractions**
- Button press: Scale down to 0.96 on press, spring back on release
- Quick action chips: Ripple effect on tap, subtle hover lift on desktop (translateY(-1px))
- Count badges: Pulse animation when count increases (scale 1.0 → 1.15 → 1.0 over 300ms)
- Success feedback: Green checkmark with scale + fade animation when mistake saved
- Error state: Shake animation (translateX: 0 → -4px → 4px → 0) over 400ms

**Loading States**
- Skeleton screens for:
  - Learning state panel while loading today's data
  - Revision count cards during initial fetch
  - Mistake list rows before data arrives
- Skeleton animation: Shimmer effect using CSS gradient animation (1.5s linear infinite)
- Composer pending: Pulsing indicator dot beside "Thinking..." text
- Loading spinner: Smooth rotation with spring-based deceleration when completing

**Touch & Gesture Polish**
- Touch target minimum: 44x44px for all interactive elements
- Active state feedback: 100ms opacity change (1.0 → 0.7) on touch
- Swipe-down to refresh on mobile (pulls down learning state panel)
- Overscroll bounce effect on lists (mistakes, revision cards)
- Pull-to-dismiss gesture for non-critical notifications

**Focus & Accessibility Motion**
- Focus ring: Smooth 150ms transition for outline appearance
- Keyboard navigation: Highlight current focus with subtle glow animation
- Reduced motion: Respect `prefers-reduced-motion` media query - disable all non-essential animations
- Screen reader announcements for dynamic count updates

**Timing & Easing Standards**
Define CSS custom properties in `app/globals.css`:
```css
--motion-duration-instant: 100ms;
--motion-duration-fast: 200ms;
--motion-duration-normal: 300ms;
--motion-duration-slow: 500ms;
--motion-ease-standard: cubic-bezier(0.4, 0.0, 0.2, 1);
--motion-ease-decelerate: cubic-bezier(0.0, 0.0, 0.2, 1);
--motion-ease-accelerate: cubic-bezier(0.4, 0.0, 1, 1);
--motion-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

**Performance Requirements**
- All animations run at 60fps minimum
- Use `transform` and `opacity` properties (GPU-accelerated) instead of `left`, `top`, `width`, `height`
- Apply `will-change` sparingly and remove after animation completes
- Debounce rapid state changes to prevent animation jank
- Test on low-end Android devices (target: smooth on ~3-year-old mid-range phones)

## Explicit Anti-Goals

- Do not add gamified streaks, XP, levels, or badges.
- Do not expose pressure-heavy exam labels.
- Do not build a broad analytics dashboard.
- Do not add fake upload/capture.
- Do not use decorative UI that does not improve action clarity.
- Do not add animations longer than 500ms for normal interactions.
- Do not implement 3D transforms or complex particle effects.
- Do not use animation libraries that significantly increase bundle size (prefer CSS and native Web Animations API).

## Acceptance Criteria

### Functional Requirements
- The learner can immediately see what to do next.
- Empty chat, empty revision, and empty mistake states each offer useful actions.
- Due/active counts match persisted data.
- UI remains stable on narrow mobile and constrained desktop.
- Dark mode contrast remains readable.
- Keyboard focus and touch targets are correct.
- Existing chat, revise, and mistakes flows remain intact.

### Motion & Polish Requirements
- All state transitions are smooth with no visual jumps.
- Loading states appear immediately (no blank screens).
- Touch interactions feel responsive (<100ms visual feedback).
- Count updates are visible and smooth (not jarring number changes).
- Empty → populated transitions feel intentional and polished.
- Reduced motion preference is respected throughout.
- No animation jank or dropped frames during normal use.
- Focus states are clearly visible for keyboard navigation.

## Browser Validation

Walk these states manually:

**Basic States**
- first login/name modal
- empty chat
- chat with long response
- pending response
- revision empty state
- revision due state
- mistakes empty state
- mistakes with many rows
- light and dark themes
- narrow mobile width around 360px

**Animation & Motion Validation**
- Tab switch animation smoothness
- Count update animations (trigger by creating/completing mistakes)
- Empty state → populated transition (clear data, then add)
- Button press feedback on touch device
- Quick action chip interactions
- Loading skeleton appearance and shimmer
- Composer auto-grow animation with multi-line input
- Success feedback when saving mistake
- Reduced motion mode (enable in browser settings)
- Overscroll behavior on mobile
- Focus ring transitions during keyboard navigation

---

# Slice 3.9 - Revision And Mistake Practice Upgrade

## Purpose

Turn the Slice 3 revision/mistake surfaces from basic persistence into a serious practice loop. Implement intuitive card-based interactions with swipe gestures, smooth transitions, and responsive touch feedback.

## Build Scope

### Core Practice Features
- Add revision session progress, such as `2 / 8`.
- Show why a card is due when that reason is available.
- Add richer review options if justified:
  - `Again`
  - `Hard`
  - `Good`
  - `Easy`
- Show after-review feedback, such as next review timing.
- Add a mistake detail view or drawer.
- Show original learner input, corrected form, explanation, and source context.
- Add "practice this pattern" from mistake detail.
- Link assistant-generated mistakes to the practice flow.
- Improve keyboard flow for review actions.

### Card Interactions & Gestures

**Swipe Gestures for Review Actions**
- Swipe left: "Again" (red accent, needs more practice)
- Swipe right: "Good" (green accent, comfortable with this)
- Swipe up: "Hard" (yellow accent, challenging)
- Swipe down: "Easy" (blue accent, very comfortable)
- Visual feedback:
  - Card follows finger/pointer during drag
  - Color tint intensifies as swipe progresses
  - Action label fades in at 30% swipe threshold
  - Haptic feedback at commit threshold (70% swipe distance)
  - Spring animation on release if below threshold (card snaps back)
  - Smooth exit animation if above threshold (card flies off screen)

**Card Flip Animations**
- Front: Question/mistake pattern
- Back: Answer/correction with explanation
- Flip trigger: Tap on card body or "Show Answer" button
- Animation: 3D rotate-y transform (400ms cubic-bezier(0.4, 0.0, 0.2, 1))
- Preserve card position during flip (no layout shift)
- Disable flip during active swipe gesture

**Card Stack Behavior**
- Display current card in focus with subtle shadow
- Show next 1-2 cards behind current (scaled 0.95, 0.9, opacity 0.6, 0.3)
- Z-index stacking creates depth illusion
- When current card exits, next card smoothly scales up and moves forward (300ms spring)
- Stack updates immediately but smoothly (no sudden pops)

**Mistake Detail Drawer**
- Trigger: Tap mistake row in list
- Animation: Slide up from bottom with backdrop fade-in (350ms ease-out)
- Drawer height: 70vh on mobile, 500px max on desktop
- Drag handle at top for pull-to-dismiss gesture
- Swipe down to close: Drawer follows finger, closes if velocity > threshold or distance > 40%
- Spring back if dismiss threshold not met
- Backdrop click closes drawer with slide-down animation

**Progress Transitions**
- Session progress counter: Animated number increment (count up from previous to new over 500ms)
- Progress bar: Smooth width transition with gradient fill
- Completion celebration: Gentle confetti burst or success modal (if appropriate to learning context)
- "Next card" transition: Brief pause (200ms) → fade out old card → slide in new card from right

**Review Feedback Animations**
- Correct/Good response: Green pulse on card border (300ms)
- Incorrect/Again response: Red shake animation (like error state)
- Next review timing: Fade in below card with gentle slide up (200ms delay after action)
- Timing estimate: Smooth number animation if duration changes

**Touch & Gesture Polish**
- Swipe detection: Minimum 50px movement, velocity-aware for quick flicks
- Gesture cancellation: Pinch or multi-touch cancels active swipe
- Button tap vs swipe: Clear 150ms tap timeout before swipe starts
- Edge swipe protection: Ignore swipes starting within 20px of screen edge (conflicts with browser back gesture)
- Visual drag affordance: Card slightly lifts (translateZ) during drag with enhanced shadow

**Keyboard Shortcuts**
- Arrow keys for review actions:
  - Left arrow: Again
  - Right arrow: Good
  - Up arrow: Hard
  - Down arrow: Easy
  - Spacebar: Flip card
  - Enter: Show next card (after review action)
- Keyboard actions trigger same animations as gestures (swipe-like exit)
- Visible keyboard hint on first card of session (fades after 3s or first interaction)

**Loading & Transition States**
- Card data loading: Skeleton card with shimmer (reuse Slice 3.8 skeleton pattern)
- "Fetching next card...": Subtle spinner in card stack area
- No cards remaining: Smooth transition to completion state (not jarring empty screen)
- Drawer content loading: Skeleton for mistake details while fetching

**Performance Optimizations**
- Use CSS transforms for all card movements (GPU-accelerated)
- Virtualize card stack (only render visible + next 2 cards in DOM)
- Debounce rapid swipe gestures to prevent animation queue buildup
- Preload next card data during current card review
- Cancel in-flight animations if new gesture starts

**Accessibility & Reduced Motion**
- All gestures have button alternatives (Again/Hard/Good/Easy buttons always visible)
- Reduced motion mode:
  - Disable card flip 3D rotation (use opacity crossfade instead)
  - Disable swipe-exit animations (use simple fade)
  - Keep progress transitions but remove spring physics
- Screen reader: Announce card number, total cards, current question, and review result
- Focus management: When drawer opens, focus moves to drawer content; when closes, focus returns to trigger button

**Animation Timing Standards** (extends Slice 3.8)
Add to `app/globals.css`:
```css
--motion-card-flip: 400ms;
--motion-card-swipe: 300ms;
--motion-drawer-slide: 350ms;
--motion-stack-advance: 300ms;
--motion-ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

## Explicit Anti-Goals

- Do not rewrite the whole scheduler without evidence.
- Do not add gamified scoring.
- Do not show complex internal ease/interval values to the learner.
- Do not create a generic flashcard app detached from the learner's real mistakes.
- Do not implement overly complex gesture recognizers (keep swipe logic simple).
- Do not add animations that interfere with rapid card review (respect user pace).
- Do not make swipe gestures the only way to review (buttons must always work).
- Do not use 3D transforms beyond simple rotations (avoid perspective complexity).

## Acceptance Criteria

### Functional Requirements
- The learner understands what they are reviewing and why.
- Review actions update scheduling once and only once.
- Mistake rows can open meaningful details.
- Practice from a mistake creates a targeted module path, not a random chat answer.
- Settled mistakes remain visible or explainably hidden according to documented rules.
- Long German/Hinglish text does not overflow cards or buttons.

### Interaction & Motion Requirements
- Swipe gestures feel responsive and natural on touch devices.
- Card flip animation is smooth without layout shift.
- Card stack depth effect is visible and consistent.
- Progress counter animates smoothly when advancing.
- Drawer opens/closes smoothly with proper focus management.
- Review feedback is immediate and clear (visual + timing info).
- Keyboard shortcuts work reliably and trigger appropriate animations.
- All gestures have accessible button alternatives.
- Reduced motion mode provides non-distracting alternatives.
- No animation jank during rapid card review.
- Swipe-to-dismiss works consistently for drawer.

## Browser Validation

Walk these states manually:

**Basic Revision Flow**
- Revision session with multiple cards (test full flow)
- Card flip interaction (tap and spacebar)
- All four review actions (Again/Hard/Good/Easy via buttons)
- Session progress updates
- Completion state after last card
- Empty revision state

**Gesture & Animation Validation**
- Swipe gestures in all four directions (touch device required)
- Swipe threshold detection (should snap back if <70% swipe)
- Card exit animation for each direction
- Card stack advancement animation
- Partial swipe then cancel (test snap-back)
- Quick flick vs slow drag (velocity detection)

**Mistake Detail Drawer**
- Open drawer from mistake list
- Drawer slide-up animation smoothness
- Backdrop interaction (click to close)
- Swipe-down to dismiss gesture
- Practice button from drawer triggers correct flow
- Focus management (open and close)

**Keyboard Navigation**
- All arrow keys for review actions
- Spacebar for card flip
- Enter for next card
- Tab order through buttons
- Focus visibility during keyboard navigation

**Edge Cases & Performance**
- Rapid review actions (spam clicking buttons)
- Simultaneous gesture attempts (pinch while swiping)
- Card with very long German text (overflow handling)
- Drawer with long explanation (scroll behavior)
- Browser back button during revision session
- Network delay loading next card (skeleton state)
- Reduced motion mode (all key interactions)
- Light and dark themes with all animations

---

# Slice 4 - Image Upload And Capture

## Purpose

Add real image upload/capture only after auth, ownership, idempotency, and decision routing are stable.

## Build Scope

- Implement real file upload.
- Implement camera capture where browser support allows it.
- Store uploaded images with authenticated ownership.
- Validate file type, size, and image safety constraints.
- Add a real staged image preview with remove action.
- Route image-based inputs through the decision engine.
- Use vision only where the image adds learning value.
- Support screenshots, class pages, handwritten/printed exercise pages, and visual vocabulary where feasible.
- Persist image metadata, not raw bytes in logs.

## Explicit Anti-Goals

- Do not use dummy predefined images.
- Do not show capture/upload controls unless they are functional.
- Do not send images to the LLM without explicit user action.
- Do not store public unauthenticated file URLs.
- Do not implement broad picture-description pedagogy here unless it is required for the first image path. Slice 6 deepens that module.

## Acceptance Criteria

- Upload works for an allowed image.
- Capture works or is gracefully hidden on unsupported browsers.
- Remove staged image works.
- Oversized or invalid files are rejected clearly.
- Uploaded image belongs to the authenticated user.
- The app can answer a simple image-based German learning request.
- Failed upload/vision calls have clear retry or recovery.
- The old disabled image button is gone or replaced by the real control.

---

# Slice 5 - Writing And Exam Task Modules

## Purpose

Add structured support for writing prompts and task-oriented German responses. The app should scaffold the learner's own answer instead of immediately producing polished German they cannot reproduce.

## Build Scope

- Add `writing_support` module behavior in the decision engine.
- Add `exam_task_decoding` behavior for written prompts and task instructions.
- Teach task demand first:
  - what is being asked
  - what points must be covered
  - what register is needed
  - what simple structure can work
- Ask for or guide a learner attempt before giving a final polished version when appropriate.
- Store writing-related mistakes and revision items.
- Add UI affordances for draft, feedback, and improved version.

## Explicit Anti-Goals

- Do not produce a final perfect answer as the first response for every writing task.
- Do not expose forbidden pressure-heavy labels in learner-facing text.
- Do not add a full document editor.
- Do not support every exam format in one pass.

## Acceptance Criteria

- The learner gets a plan before a full answer.
- The app can decode a simple task prompt.
- The app can improve a learner attempt with clear explanation.
- Writing mistakes are stored with useful taxonomy.
- The UI distinguishes plan, attempt, correction, and final version.

---

# Slice 6 - Picture Description Module

## Purpose

Build a focused picture-description learning module on top of the image foundation. This is not just OCR or captioning; it should teach observation, vocabulary, sentence frames, and exam-useful structure.

## Build Scope

- Add `image_description` module behavior.
- Guide observation before polished description.
- Extract or suggest visual vocabulary.
- Provide simple sentence frames.
- Let the learner attempt a description.
- Give feedback on sentence accuracy and completeness.
- Create revision items from useful visual vocabulary or repeated patterns.

## Explicit Anti-Goals

- Do not turn every image into a long essay.
- Do not overclaim uncertain visual details.
- Do not skip learner attempt when the pedagogical goal is speaking/writing practice.
- Do not duplicate Slice 4 upload plumbing.

## Acceptance Criteria

- Image description starts with observation and useful vocabulary.
- The learner can practice a short description.
- The model flags uncertainty when needed.
- Revision items can be created from visual vocabulary.
- UI remains readable for image plus text on mobile.

---

# Slice 7 - Reading And Listening Question Decoding

## Purpose

Help the learner understand task instructions, question wording, and answer strategy for reading/listening-style exercises.

## Build Scope

- Add `exam_task_decoding` support for task phrases.
- Teach common instruction words and answer demands.
- Separate "what the question asks" from "what answer strategy to use".
- Support pasted text, short question snippets, and screenshot/OCR output where available.
- Store task-phrase misunderstandings as mistakes.

## Explicit Anti-Goals

- Do not solve every full reading/listening paper in one response.
- Do not expose pressure-heavy exam labels in routine learner-facing UI.
- Do not add audio ingestion yet unless explicitly planned later.

## Acceptance Criteria

- Learner can paste a task instruction and get a clear decoding.
- The app explains what to look for in the text/audio.
- Confusing instruction patterns become reviewable mistakes.
- Response remains concise and action-oriented.

---

# Slice 8 - Speaking Practice Text Mode

## Purpose

Support speaking preparation using text-only frames, prompts, and feedback before any audio recording feature exists.

## Build Scope

- Add `speaking_practice` module.
- Provide simple speaking frames.
- Support self-introduction, opinion with reason, picture description follow-up, and planning dialogue in text form.
- Ask the learner to draft a spoken answer.
- Give feedback on clarity, correctness, and reproducibility.
- Store recurring speaking-frame issues.

## Explicit Anti-Goals

- Do not add audio recording unless a later slice explicitly expands scope.
- Do not generate over-polished German that the learner cannot say.
- Do not score pronunciation in text-only mode.

## Acceptance Criteria

- Learner gets reusable sentence frames.
- Learner can attempt an answer.
- Feedback is practical and repeatable.
- Practice connects to existing mistakes/revision where useful.

---

# Slice 9 - Personal Story To German

## Purpose

Help the learner turn messy Hinglish personal context into simple, usable German while preserving learner agency.

## Build Scope

- Add `personal_story` module.
- Break learner input into chronological points.
- Ask clarifying questions only when necessary.
- Produce simple German versions in stages.
- Explain key grammar or vocabulary choices.
- Turn reusable phrases into revision items.

## Explicit Anti-Goals

- Do not create advanced polished German that exceeds the learner's level.
- Do not invent personal facts.
- Do not store sensitive story content beyond the normal authenticated learning event model without explicit reason.

## Acceptance Criteria

- The app can convert a short Hinglish story into simple German.
- The learner sees how the story was structured.
- Useful phrases are reviewable.
- Sensitive content handling is documented.

---

# Slice 10 - Exam Readiness Insights

## Purpose

Use the existing hidden skill map to produce useful internal and optional admin insights without making the learner feel judged by scores.

## Build Scope

- Make `ExamReadinessMap` updates more systematic.
- Add admin-only insight views if useful.
- Add optional learner-facing gentle skill summaries if approved.
- Tie insights to next actions, not static scores.
- Keep skill labels practical and non-threatening.

## Explicit Anti-Goals

- Do not add public scores, ranks, badges, or pressure-heavy labels.
- Do not expose raw internal JSON as learner guidance.
- Do not claim mastery from too little data.

## Acceptance Criteria

- Skill updates are traceable to learning events.
- Insights suggest concrete next actions.
- Admin view helps diagnose product/learning behavior.
- Learner-facing insight, if any, is calm and useful.

---

# Slice 11 - Polish, PWA, Export, And Offline Boundaries

## Purpose

Make the mature app installable, resilient, and easier to maintain without changing the learning model.

## Build Scope

- Add PWA installability if still appropriate.
- Add offline-friendly revision queue only if data consistency can be preserved.
- Add export of user learning data.
- Tighten theme, accessibility, and responsive polish.
- Add production observability that does not compromise learner privacy.
- Finalize settings/profile surfaces only where there is real user value.

## Explicit Anti-Goals

- Do not add analytics SDKs without explicit approval.
- Do not make offline chat appear possible if LLM access is unavailable.
- Do not add settings pages full of unused controls.
- Do not redesign the brand without a specific reason.

## Acceptance Criteria

- App is installable or the reason not to ship PWA is documented.
- Offline behavior is honest and safe.
- Data export works for authenticated user data.
- Accessibility audit issues are addressed or documented.
- The app remains fast and stable on mobile.

---

# Slice Restructure Summary

The practical path is:

```txt
3.5 identity/session safety
3.6 decision contract
3.7 decision engine v1
3.8 learning momentum UI
3.9 revision and mistake practice upgrade
4 image upload/capture
5 writing/task modules
6 picture description
7 reading/listening decoding
8 speaking text practice
9 personal story to German
10 readiness insights
11 polish/PWA/export
```

Do not merge these into one large implementation pass. The standard is durable, testable, and pedagogically coherent implementation, not a large visible feature set.
