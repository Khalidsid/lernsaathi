# Learning Modes Dashboard - Implementation Planning

**Date:** 2026-05-10
**Status:** Planning phase - No code written yet
**Impact:** Major UX restructure - Changes app from chat-first to menu-driven

---

## 1. Problem Statement

**Current State:**
- User logs in → auto-redirects to `/chat`
- Chat is the only interface (3 tabs: Chat, Revise, Mistakes)
- No structured learning modes
- User feels "confused" seeing chat directly
- No clear learning path or mode selection

**User Request:**
> "I want to enforce some determinism to the app auto logout mechanism, user gets confused when sees chat screen directly. It should show tiles pertaining to typical problems faced by a foreigner in Germany."

**Desired State:**
- User logs in → sees dashboard with learning mode tiles
- Each tile represents a different learning mode
- User chooses mode based on their current need
- Chat becomes one option, not the default
- Clear, deterministic learning paths

---

## 2. Proposed Learning Modes

### Mode 1: Word & Phrase Lookup
**Icon:** 📚 Book
**Description:** "Learn word meanings and phrases"
**Entry:** Click tile → Opens focused word lookup interface
**Features:**
- Input field for word/phrase
- Get meaning with examples
- **Interactive quiz:** Click to verify understanding
- Save to mistakes if needed

### Mode 2: Grammar Practice
**Icon:** ✏️ Pencil
**Description:** "Practice grammar with interactive exercises"
**Entry:** Click tile → Choose exercise type
**Sub-modes:**
- Fill in the blanks
- True/false statements
- Sentence correction
**Features:**
- Clickable answer options
- Immediate feedback
- Track progress

### Mode 3: Reading Comprehension
**Icon:** 📖 Open Book
**Description:** "Read passages and answer questions"
**Entry:** Click tile → Choose difficulty level
**Features:**
- German text passages
- Multiple choice questions
- Translation hints available
- Timed reading option

### Mode 4: Writing Practice
**Icon:** ✍️ Writing Hand
**Description:** "Practice writing emails and letters"
**Entry:** Click tile → Choose writing type
**Sub-modes:**
- Formal email (job, housing)
- Informal email (friends, family)
- Official letter (government, bank)
**Features:**
- Template guidance
- Real-time feedback
- Common phrase suggestions

### Mode 5: Real-World Scenarios
**Icon:** 🗣️ Speech Bubble
**Description:** "Practice common situations in Germany"
**Entry:** Click tile → Choose scenario
**Scenarios:**
- Asking for help (directions, translation)
- Shopping (market, pharmacy, bakery)
- Doctor appointment
- Job interview
- Government office (Ausländerbehörde, Finanzamt)
**Features:**
- **Rapid interaction** - Time-limited responses
- Audio questions (future: Slice 8 integration)
- Image context (future: Slice 4 integration)
- Multiple response options

### Mode 6: Revision Queue
**Icon:** 🔄 Cycle
**Description:** "Review your saved mistakes"
**Entry:** Click tile → Opens revision queue
**Features:**
- Existing spaced repetition system
- **Fix:** Make cards clickable to start review
- Progress tracking

### Mode 7: Free Chat
**Icon:** 💬 Chat
**Description:** "Open conversation with tutor"
**Entry:** Click tile → Opens chat interface
**Features:**
- Existing chat functionality
- Full conversation history
- Decision engine routing

---

## 3. Dashboard UI Structure

### Layout (Desktop)
```
┌─────────────────────────────────────────┐
│  Lernsaathi            👤 username   ⋮  │ ← AppShell header
├─────────────────────────────────────────┤
│                                         │
│   Learning Modes                        │
│   ───────────────                       │
│                                         │
│   ┌───────┐  ┌───────┐  ┌───────┐     │
│   │  📚   │  │  ✏️   │  │  📖   │     │
│   │ Words │  │Grammar│  │Reading│     │
│   └───────┘  └───────┘  └───────┘     │
│                                         │
│   ┌───────┐  ┌───────┐  ┌───────┐     │
│   │  ✍️   │  │  🗣️   │  │  🔄   │     │
│   │Writing│  │Scenarios│ │Revise │     │
│   └───────┘  └───────┘  └───────┘     │
│                                         │
│   ┌───────┐                            │
│   │  💬   │                            │
│   │ Chat  │                            │
│   └───────┘                            │
│                                         │
│   Today's Progress                      │
│   ─────────────────                     │
│   📊 5 words learned                    │
│   ✅ 3 reviews completed                │
│   📝 1 exercise done                    │
│                                         │
└─────────────────────────────────────────┘
```

### Layout (Mobile 375px)
```
┌─────────────────┐
│ Lernsaathi   ⋮  │
├─────────────────┤
│                 │
│ Learning Modes  │
│                 │
│ ┌─────────────┐ │
│ │  📚 Words   │ │
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │  ✏️ Grammar │ │
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │  📖 Reading │ │
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │  ✍️ Writing │ │
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │ 🗣️ Scenarios│ │
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │  🔄 Revise  │ │
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │  💬 Chat    │ │
│ └─────────────┘ │
│                 │
│ Today: 5 words  │
│        3 reviews│
│                 │
└─────────────────┘
```

---

## 4. Interactive Quiz Component

### Current Problem
When explaining meanings, response is just text. User has to read and understand, but no verification that they got it.

### Proposed Solution: QuizCard Component

**Example - Word Meaning Quiz:**

User asks: "What does 'Entschuldigung' mean?"

**Response with quiz:**
```
┌──────────────────────────────────────┐
│ "Entschuldigung" means "excuse me"   │
│ or "sorry" in German.                │
│                                      │
│ Example: "Entschuldigung, wo ist    │
│ der Bahnhof?" (Excuse me, where is  │
│ the train station?)                  │
│                                      │
│ Quick Check: Which is correct?       │
│                                      │
│ ○ I use it to say goodbye            │
│ ● I use it to apologize or get       │
│   someone's attention                │
│ ○ I use it to say thank you          │
│ ○ I use it to say hello              │
│                                      │
│         [Check Answer]               │
└──────────────────────────────────────┘
```

After clicking:
```
┌──────────────────────────────────────┐
│ ✅ Correct!                          │
│                                      │
│ "Entschuldigung" is used to:        │
│ • Apologize (Sorry!)                │
│ • Get attention (Excuse me!)        │
│ • Ask to pass (Excuse me, please)   │
│                                      │
│ Want to practice more? → Grammar     │
└──────────────────────────────────────┘
```

**Implementation Notes:**
- QuizCard component with radio buttons
- Immediate feedback on selection
- Link to related learning modes
- Track quiz performance in LearningEvent
- New input type: `quiz_answer_check`

---

## 5. Revision Clickability Issue

### Current Bug
**User Report:** "In revision section the item is not clickable"

### Investigation Needed
1. Check `components/RevisionQueue.tsx` - are cards clickable?
2. Verify "Start Review" or card click initiates review
3. Test keyboard accessibility (Space/Enter to activate)

### Proposed Fix (SLICE_3_9_2)
- Make entire card clickable to start review
- Add hover state to indicate clickability
- Add keyboard shortcut hint
- ARIA role="button" for accessibility

---

## 6. Required Slice Changes

### New Slices to Create

**SLICE_3_9_2: Revision Clickability Fix**
- **Estimate:** 30 minutes
- **Files:** `components/RevisionQueue.tsx`
- **Scope:** Make cards clickable, add hover states
- **Blocks:** Nothing (can do anytime)

**SLICE_3_14: Learning Modes Dashboard**
- **Estimate:** 4-6 hours
- **Files:**
  - `app/dashboard/page.tsx` (new)
  - `components/DashboardTiles.tsx` (new)
  - `components/TodayProgress.tsx` (new)
  - `app/chat/page.tsx` (update redirect)
- **Scope:**
  - Dashboard page with 7 learning mode tiles
  - Today's progress widget
  - Responsive grid layout (desktop 3-col, mobile 1-col)
  - Redirect login to `/dashboard` instead of `/chat`
- **Blocks:** Slice 4 (changes entry point expectations)

**SLICE_3_15: Interactive Quiz Components**
- **Estimate:** 3-4 hours
- **Files:**
  - `components/QuizCard.tsx` (new)
  - `lib/pipeline/quiz-generator.ts` (new)
  - `app/api/chat/route.ts` (update to support quiz responses)
- **Scope:**
  - QuizCard UI with radio/checkbox options
  - Quiz generation logic (4 options, 1 correct)
  - Answer verification
  - Track quiz performance in LearningEvent
- **Blocks:** Slice 5 (writing practice needs quiz component)

**SLICE_3_16: Mode-Specific Interfaces**
- **Estimate:** 6-8 hours
- **Files:**
  - `app/modes/words/page.tsx` (new)
  - `app/modes/grammar/page.tsx` (new)
  - `app/modes/reading/page.tsx` (new)
  - `app/modes/writing/page.tsx` (new)
  - `app/modes/scenarios/page.tsx` (new)
  - `components/ModeShell.tsx` (new)
- **Scope:**
  - Dedicated UI for each learning mode
  - Mode-specific controls and layout
  - Back to dashboard navigation
  - Mode state persistence
- **Blocks:** Slices 4-9 (they'll integrate with mode UIs)

### Slices to Update

**SLICE_4: Image Input (Updated)**
- **Change:** Instead of chat-only, integrate with:
  - Words mode (image → word lookup)
  - Scenarios mode (image context for real-world practice)
  - Reading mode (image-based reading exercises)
- **New entry points:** Multiple modes, not just chat
- **Estimate:** Same time, different integration points

**SLICE_5: Writing Prompts (Updated)**
- **Change:** Dedicated writing mode interface
- **Integration:** Use QuizCard for grammar checks in writing
- **New UI:** Writing mode with template selection

**SLICE_6-9: Similar updates**
- Each mode gets dedicated interface
- Integration with dashboard tiles
- Mode-specific UX patterns

---

## 7. Data Model Changes

### New LearningEvent Input Types

Current: `"learner_message"`, `"revision_attempt"`, etc.

Add:
- `"quiz_answer_check"` - User answered a quiz question
- `"mode_entry"` - User entered a learning mode
- `"mode_exit"` - User exited a learning mode
- `"grammar_exercise"` - Completed grammar exercise
- `"reading_comprehension"` - Completed reading exercise
- `"writing_submission"` - Submitted writing for review
- `"scenario_practice"` - Completed real-world scenario

### QuizAnswer Schema (Future)

```typescript
type QuizAnswer = {
  questionId: string;
  question: string;
  options: string[];
  correctIndex: number;
  selectedIndex: number;
  isCorrect: boolean;
  timestamp: Date;
};
```

Store in `LearningEvent.structured` for quiz attempts.

---

## 8. User Flow Changes

### Current Flow
```
Login → /chat → Tab navigation (Chat, Revise, Mistakes)
```

### New Flow
```
Login → /dashboard → Select mode → Mode-specific UI
                   ↓
                   Back to dashboard anytime (header button)
```

**Example User Journey:**
1. User logs in
2. Sees dashboard with 7 tiles + today's progress
3. Clicks "🗣️ Scenarios" tile
4. Chooses "Asking for help at pharmacy"
5. Engages in rapid Q&A scenario
6. Completes scenario, sees results
7. Clicks "Back to Dashboard" or chooses related mode
8. Dashboard now shows updated progress

---

## 9. Technical Architecture

### Route Structure (New)
```
/dashboard                    - Landing page with tiles
/modes/words                  - Word lookup mode
/modes/grammar                - Grammar exercises
/modes/grammar/fill-blanks    - Specific exercise type
/modes/grammar/true-false     - Specific exercise type
/modes/reading                - Reading comprehension
/modes/writing                - Writing practice
/modes/writing/formal-email   - Specific writing type
/modes/scenarios              - Real-world scenarios
/modes/scenarios/[scenarioId] - Specific scenario
/chat                         - Free chat (existing)
/revision                     - Revision queue (existing, but also accessible from dashboard)
/mistakes                     - Mistakes list (existing, but also accessible from dashboard)
```

### Component Hierarchy
```
AppShell
├── DashboardPage
│   ├── DashboardTiles
│   │   ├── ModeTile × 7
│   │   └── TodayProgress
│   └── QuickStats
├── ModeShell (for all mode pages)
│   ├── ModeHeader (title, back button)
│   ├── ModeContent (mode-specific UI)
│   └── ModeFooter (progress, hints)
└── ChatShell (existing, now one of many modes)
```

### State Management
- **Dashboard:** Server component, no client state
- **Modes:** Client components with local state for exercises
- **Progress:** Fetch from `/api/learning-state` (existing)
- **Navigation:** Next.js App Router (existing)

---

## 10. Migration Strategy

### Phase 1: Add Dashboard (Don't Remove Chat Yet)
- Create `/dashboard` route
- Add tiles linking to `/chat`, `/revision`, `/mistakes`
- Other tiles show "Coming soon" state
- Update login redirect: `/chat` → `/dashboard`
- **Users can still access chat directly** via tile

### Phase 2: Add Mode UIs One at a Time
- SLICE_3_16A: Words mode
- SLICE_3_16B: Grammar mode (with QuizCard)
- SLICE_3_16C: Reading mode
- SLICE_3_16D: Writing mode
- SLICE_3_16E: Scenarios mode
- **Each slice:** Build mode UI, update dashboard tile to link to it

### Phase 3: Integrate Image/Audio (Slice 4+)
- Slice 4: Image input integrates with Words, Scenarios, Reading
- Slice 8: Speaking integrates with Scenarios
- **No breaking changes** to existing slices

### Backward Compatibility
- `/chat` route still works (don't break existing bookmarks)
- Chat accessible from dashboard tile
- Existing tabs (Chat, Revise, Mistakes) work as before
- Progressive enhancement: add modes without removing functionality

---

## 11. Acceptance Criteria

### SLICE_3_14 (Dashboard)
- [ ] User logs in → sees dashboard (not chat)
- [ ] 7 tiles visible on desktop (3-column grid)
- [ ] 7 tiles visible on mobile (1-column stack)
- [ ] Today's progress widget shows accurate counts
- [ ] Clicking Chat tile → opens `/chat`
- [ ] Clicking Revise tile → opens `/revision`
- [ ] Clicking Mistakes tile → opens `/mistakes`
- [ ] Other tiles show "Coming soon" state
- [ ] 375px layout doesn't overflow
- [ ] Keyboard navigation works (Tab to tiles, Enter to activate)

### SLICE_3_15 (Quiz Components)
- [ ] QuizCard renders with 4 options
- [ ] Clicking option selects it (radio button behavior)
- [ ] "Check Answer" button validates selection
- [ ] Correct answer shows ✅ feedback
- [ ] Incorrect answer shows ❌ feedback with correct answer
- [ ] Quiz results saved to LearningEvent
- [ ] Works at 375px width
- [ ] Keyboard accessible (arrow keys to select, Enter to submit)

### SLICE_3_16 (Mode UIs)
- [ ] Each mode has dedicated route
- [ ] ModeShell wraps all mode pages
- [ ] "Back to Dashboard" button in header
- [ ] Mode content area scrolls independently
- [ ] Mode state persists during session
- [ ] Mode progress updates dashboard widget
- [ ] Works at 375px width
- [ ] Keyboard navigation throughout

---

## 12. Risks and Mitigations

### Risk 1: Scope Creep
**Risk:** Building all modes at once takes too long
**Mitigation:** Phase 2 approach - one mode at a time, progressive enhancement

### Risk 2: Breaking Existing Features
**Risk:** Dashboard changes break chat/revision/mistakes
**Mitigation:** Keep existing routes, add dashboard as new entry point

### Risk 3: User Confusion
**Risk:** Too many options overwhelm user
**Mitigation:**
- Clear tile labels and icons
- Today's progress guides user to next action
- "Coming soon" for incomplete modes

### Risk 4: Mobile UX
**Risk:** 7 tiles on mobile feels cluttered
**Mitigation:**
- Single column layout
- Prioritize most-used modes at top
- Consider collapsible sections

### Risk 5: Performance
**Risk:** Dashboard fetches too much data
**Mitigation:**
- Server component for initial render
- Lazy load progress widget
- Cache today's stats

---

## 13. Estimated Timeline

### Quick Win (Today/Tomorrow)
- **SLICE_3_9_2:** Revision clickability fix - 30 minutes

### Dashboard Foundation (This Week)
- **SLICE_3_14:** Learning modes dashboard - 4-6 hours
- **SLICE_3_15:** Interactive quiz components - 3-4 hours
- **Total:** ~8-10 hours

### Mode UIs (Next Week)
- **SLICE_3_16A-E:** Five mode interfaces - 6-8 hours each
- **Total:** ~30-40 hours (spread over multiple slices)

### Integration (Following Weeks)
- **SLICE_4 (Updated):** Image input with modes - Same as before
- **SLICE_5-9 (Updated):** Other features with modes - Same as before

**Overall Impact:** Adds ~40-50 hours of work before Slice 4, but provides much better UX foundation.

---

## 14. Next Steps

### Immediate (Before Any Code)
1. ✅ Create this planning document
2. ⏳ Review with user - get approval on direction
3. ⏳ Decide on phasing (all at once vs. incremental)
4. ⏳ Create SLICE_3_9_2 brief (revision fix)
5. ⏳ Create SLICE_3_14 brief (dashboard)
6. ⏳ Create SLICE_3_15 brief (quiz components)

### After Approval
1. Implement SLICE_3_9_2 (quick win)
2. Implement SLICE_3_14 (dashboard foundation)
3. Implement SLICE_3_15 (quiz components)
4. Incrementally add mode UIs (SLICE_3_16A-E)
5. Update SLICE_MAP with new slices
6. Update Slice 4-9 briefs with mode integration

### Documentation Updates Needed
- `docs/SLICE_MAP.md` - Add new slices 3.9.2, 3.14, 3.15, 3.16
- `docs/UX_ARCHITECTURE.md` - Document dashboard and mode structure
- `docs/COMPONENT_CONTRACTS.md` - Add DashboardTiles, ModeShell, QuizCard
- `docs/slices/SLICE_3_9_2_BRIEF.md` - Create brief
- `docs/slices/SLICE_3_14_BRIEF.md` - Create brief
- `docs/slices/SLICE_3_15_BRIEF.md` - Create brief
- `docs/slices/SLICE_3_16_*_BRIEF.md` - Create briefs for each mode

---

## 15. Open Questions for User

1. **Phasing:** Do you want dashboard + all modes at once, or incremental (dashboard first, then modes one by one)?

2. **Chat vs. Modes:** Should free chat still be accessible via a tab, or only via dashboard tile?

3. **Progress Widget:** What metrics are most important to show? (words learned, reviews done, exercises completed, time spent?)

4. **Mode Priority:** Which mode should we build first after dashboard? (My suggestion: Grammar, since it's most interactive)

5. **Revision Fix:** Should we do the revision clickability fix immediately before dashboard work?

6. **Real-World Scenarios:** Do you have specific scenarios in mind, or should I propose a set?

7. **Audio Integration:** Slice 8 adds speaking practice. Should we plan for audio in Scenarios mode from the start, or add it later?

8. **Mobile-First:** Should we design for mobile first and scale up, or desktop first?

---

## 16. Appendix: Example Mode Wireframes

### Words Mode Interface
```
┌─────────────────────────────────────┐
│ ← Back to Dashboard    Words Mode   │
├─────────────────────────────────────┤
│                                     │
│  Look up a German word or phrase    │
│  ┌───────────────────────────────┐ │
│  │ Entschuldigung             🔍 │ │
│  └───────────────────────────────┘ │
│                                     │
│  "Entschuldigung" means:           │
│  • Excuse me                        │
│  • Sorry                            │
│  • Pardon                           │
│                                     │
│  Example:                           │
│  "Entschuldigung, wo ist der       │
│  Bahnhof?"                          │
│                                     │
│  Quick Check: When do you use it?   │
│  ○ To say goodbye                   │
│  ● To apologize or get attention    │
│  ○ To say thank you                 │
│  ○ To greet someone                 │
│                                     │
│  [Check Answer]  [Add to Practice] │
│                                     │
└─────────────────────────────────────┘
```

### Grammar Mode - Fill in the Blanks
```
┌─────────────────────────────────────┐
│ ← Back to Dashboard  Grammar Mode   │
├─────────────────────────────────────┤
│                                     │
│  Fill in the Blanks                 │
│  ━━━━━━━━━━━━━━━━━━                 │
│                                     │
│  Complete the sentence:             │
│                                     │
│  Ich _____ nach Berlin.             │
│                                     │
│  Choose the correct word:           │
│  ┌─────┐ ┌─────┐ ┌─────┐          │
│  │gehe │ │gehst│ │geht │          │
│  └─────┘ └─────┘ └─────┘          │
│                                     │
│  Progress: 3/10 ━━━━━━━━░░░░       │
│                                     │
│  [Skip]           [Submit Answer]   │
│                                     │
└─────────────────────────────────────┘
```

### Scenarios Mode - At the Pharmacy
```
┌─────────────────────────────────────┐
│ ← Back to Dashboard  Scenarios      │
├─────────────────────────────────────┤
│                                     │
│  🏥 At the Pharmacy                 │
│  ━━━━━━━━━━━━━━━━━━                 │
│                                     │
│  You need to ask for headache       │
│  medicine. The pharmacist asks:     │
│                                     │
│  💬 "Was kann ich für Sie tun?"     │
│                                     │
│  How do you respond?                │
│  ⏱️ Time: 10s                       │
│                                     │
│  ┌───────────────────────────────┐ │
│  │Ich habe Kopfschmerzen.       │ │
│  │(I have a headache)           │ │
│  └───────────────────────────────┘ │
│  ┌───────────────────────────────┐ │
│  │Ich möchte etwas gegen        │ │
│  │Kopfschmerzen.                │ │
│  │(I'd like something for...)   │ │
│  └───────────────────────────────┘ │
│  ┌───────────────────────────────┐ │
│  │Haben Sie Aspirin?            │ │
│  │(Do you have aspirin?)        │ │
│  └───────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

---

**End of Planning Document**

This document should be reviewed and approved before any implementation begins.
