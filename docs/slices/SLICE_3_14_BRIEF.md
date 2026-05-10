# Slice 3.14 Brief: Learning Modes Dashboard

**Status:** planned
**Depends on:** Slices 3.10-3.13 (gates and contracts)
**Blocks:** Slice 4 (changes entry point), Slice 3.16 (mode UIs need dashboard)
**Primary protocol:** `docs/LOW_REASONING_DEV_PROTOCOL.md`
**Navigation protocol:** `docs/DOC_NAVIGATION.md`

---

## 0. Context Navigation

Read in this order:

1. `docs/DOC_NAVIGATION.md` - confirms this is a mixed UI/routing task
2. `docs/LOW_REASONING_DEV_PROTOCOL.md` - execution rules, stop conditions, completion report
3. `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md` - UI/routing gates
4. `docs/SLICE_MAP.md` - confirms dependencies and blockers
5. `docs/LEARNING_MODES_DASHBOARD_PLANNING.md` - full design rationale
6. `docs/UX_ARCHITECTURE.md` - dashboard/mode patterns (after this slice updates it)
7. `app/chat/page.tsx` - current post-login landing
8. `components/AppShell.tsx` - layout patterns
9. `app/api/learning-state/route.ts` - today's progress data source

Do not read:
- Pipeline files unless using TurnDecision for mode routing
- Revision files - existing revision tab stays unchanged
- Image/upload files - out of scope

---

## 1. Goal

Replace chat-first auto-redirect with menu-driven dashboard showing 7 learning mode tiles. User lands on dashboard after login and chooses their learning mode intentionally.

---

## 1.5. ⚠️ CONSTRAINT CARD (Check Before EVERY Edit)

**Allowed files (section 3)**:
- new `app/dashboard/page.tsx`
- new `components/DashboardTiles.tsx`
- new `components/TodayProgress.tsx`
- `app/(auth)/login/page.tsx` (redirect change only)
- `middleware.ts` (if default route needs update)
- `app/layout.tsx` or navigation config (if needed)
- `docs/SLICE_3_5_AUTH_SESSION_NOTES.md` (completion evidence)

**Forbidden areas (section 4)**:
- Existing `/chat`, `/mistakes` tabs (keep working as-is)
- Pipeline files (no learning logic changes)
- Database schema (uses existing LearningState data)
- Revision logic (keep existing spaced repetition)

**Expected git diff**:
```
A app/dashboard/page.tsx
A components/DashboardTiles.tsx
A components/TodayProgress.tsx
M app/(auth)/login/page.tsx
```

**Mandatory checks before committing (section 11)**:
- [ ] Only allowed files modified?
- [ ] Login redirects to /dashboard?
- [ ] All 7 tiles visible on desktop?
- [ ] Tiles display in 1-column on mobile (375px)?
- [ ] Today's progress widget shows due count?
- [ ] Chat/Revise/Mistakes tiles navigate to existing tabs?
- [ ] "Coming soon" tiles show disabled state?
- [ ] Keyboard navigation works (Tab through tiles)?
- [ ] Dark mode styling correct?
- [ ] Typecheck passes?
- [ ] Build passes?

**Stop conditions (section 12)**:
- Existing chat/revision/mistakes tabs break
- Database schema changes needed
- Pipeline logic needs modification
- More than 8 files need changes

---

## 2. Product Context

**User Problem:**
"User gets confused when sees chat screen directly after login. No determinism in navigation."

**Current Flow:**
```
Login → /chat → Tab navigation (Chat, Revise, Mistakes)
```

**New Flow:**
```
Login → /dashboard → Select mode → Mode-specific UI
              ↓
              Chat, Revise, Mistakes still accessible via tiles
```

---

## 3. Allowed Scope

### New Files
- `app/dashboard/page.tsx` - Server component, renders dashboard
- `components/DashboardTiles.tsx` - Grid of 7 mode tiles
- `components/TodayProgress.tsx` - Widget showing today's learning stats

### Modified Files
- `app/(auth)/login/page.tsx` - Change redirect from `/chat` to `/dashboard`
- `middleware.ts` - Update default authenticated route (if needed)

### Routes Created
- `/dashboard` - New landing page after login

---

## 4. Explicit Non-Goals

- **No** mode-specific UIs yet (that's Slice 3.16)
- **No** quiz components (that's Slice 3.15)
- **No** changes to chat/revision/mistakes functionality
- **No** removal of existing tabs
- **No** image upload (still Slice 4)
- **No** backend API changes
- **No** database schema changes
- **No** learning pipeline modifications

Tiles for Words, Grammar, Reading, Writing, and Scenarios will show "Coming soon" state and not navigate anywhere yet.

---

## 5. Seven Learning Modes

### Active Modes (Navigate to Existing Tabs)
1. **💬 Chat** - Navigate to `/chat` (existing chat tab)
2. **🔄 Revise** - Navigate to `/chat?tab=revise` (existing revision tab)
3. **📝 Mistakes** - Navigate to `/chat?tab=mistakes` (existing mistakes tab)

### Future Modes (Show "Coming Soon")
4. **📚 Words** - Disabled, shows "Coming soon" tooltip/state
5. **✏️ Grammar** - Disabled, shows "Coming soon" tooltip/state
6. **📖 Reading** - Disabled, shows "Coming soon" tooltip/state
7. **✍️ Writing** - Disabled, shows "Coming soon" tooltip/state

Note: Real-World Scenarios mode deferred to Slice 3.16E. Dashboard shows 7 tiles total for now.

---

## 6. Dashboard Layout

### Desktop (≥640px)
```
┌─────────────────────────────────────┐
│ Lernsaathi              [Menu]      │
├─────────────────────────────────────┤
│ Today's Progress                    │
│ ┌─────────────────────────────────┐ │
│ │ 3 cards due • 12 words reviewed │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Learning Modes                      │
│ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │ 💬   │ │ 🔄   │ │ 📝   │         │
│ │ Chat │ │Revise│ │Errors│         │
│ └──────┘ └──────┘ └──────┘         │
│ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │ 📚   │ │ ✏️   │ │ 📖   │         │
│ │Words │ │Grammar│ │Read │         │
│ │soon  │ │ soon │ │ soon │         │
│ └──────┘ └──────┘ └──────┘         │
│ ┌──────┐                            │
│ │ ✍️   │                            │
│ │Write │                            │
│ │ soon │                            │
│ └──────┘                            │
└─────────────────────────────────────┘
```

### Mobile (<640px)
```
┌──────────────┐
│ Lernsaathi   │
│        [Menu]│
├──────────────┤
│ Today        │
│ 3 due • 12   │
│              │
│ ┌──────────┐ │
│ │ 💬 Chat  │ │
│ └──────────┘ │
│ ┌──────────┐ │
│ │ 🔄 Revise│ │
│ └──────────┘ │
│ ┌──────────┐ │
│ │ 📝 Errors│ │
│ └──────────┘ │
│ ┌──────────┐ │
│ │ 📚 Words │ │
│ │   soon   │ │
│ └──────────┘ │
│ ...          │
└──────────────┘
```

---

## 7. Tile Specifications

### Active Tile (Chat/Revise/Mistakes)
```tsx
<Link href="/chat?tab=revise">
  <div className="rounded-2xl border border-rule bg-paper2 p-6 transition hover:bg-paper hover:border-teal">
    <div className="text-4xl">🔄</div>
    <div className="mt-3 text-lg font-medium">Revise</div>
    <div className="mt-1 text-sm text-ink3">Review your mistakes</div>
  </div>
</Link>
```

### Disabled Tile (Coming Soon)
```tsx
<div className="rounded-2xl border border-rule bg-paper3 p-6 opacity-60 cursor-not-allowed">
  <div className="text-4xl opacity-50">📚</div>
  <div className="mt-3 text-lg font-medium">Words</div>
  <div className="mt-1 text-sm text-ink4">Coming soon</div>
</div>
```

---

## 8. Today's Progress Widget

### Data Source
Use existing `/api/learning-state` endpoint (from Slice 3.8):
```ts
{
  dueCount: number,
  activeCount: number,
  reviewedToday: number
}
```

### Display Format
```
Today: {reviewedToday} reviewed • {dueCount} due
```

Examples:
- "Today: 12 reviewed • 3 due"
- "Today: 0 reviewed • 5 due"
- "Today: 8 reviewed • 0 due"

### Empty State
```
Today: No activity yet
```

---

## 9. Technical Implementation

### app/dashboard/page.tsx
```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardTiles } from "@/components/DashboardTiles";
import { TodayProgress } from "@/components/TodayProgress";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-paper dark:bg-night">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1>Lernsaathi</h1>
        <TodayProgress userId={session.user.id} />
        <DashboardTiles />
      </div>
    </main>
  );
}
```

### components/DashboardTiles.tsx
```tsx
import Link from "next/link";

type ModeT ile = {
  id: string;
  icon: string;
  label: string;
  description: string;
  href?: string;
  comingSoon?: boolean;
};

const modes: ModeTitle[] = [
  { id: "chat", icon: "💬", label: "Chat", description: "Ask anything", href: "/chat" },
  { id: "revise", icon: "🔄", label: "Revise", description: "Review mistakes", href: "/chat?tab=revise" },
  { id: "mistakes", icon: "📝", label: "Mistakes", description: "See all errors", href: "/chat?tab=mistakes" },
  { id: "words", icon: "📚", label: "Words", description: "Learn meanings", comingSoon: true },
  { id: "grammar", icon: "✏️", label: "Grammar", description: "Practice rules", comingSoon: true },
  { id: "reading", icon: "📖", label: "Reading", description: "Read passages", comingSoon: true },
  { id: "writing", icon: "✍️", label: "Writing", description: "Write emails", comingSoon: true },
];

export function DashboardTiles() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {modes.map((mode) => (
        <TileCard key={mode.id} mode={mode} />
      ))}
    </div>
  );
}
```

### components/TodayProgress.tsx
```tsx
"use client";

import { useEffect, useState } from "react";

type ProgressData = {
  dueCount: number;
  reviewedToday: number;
};

export function TodayProgress({ userId }: { userId: string }) {
  const [data, setData] = useState<ProgressData | null>(null);

  useEffect(() => {
    fetch("/api/learning-state")
      .then((res) => res.json())
      .then(setData);
  }, []);

  if (!data) {
    return <div>Loading...</div>;
  }

  if (data.reviewedToday === 0 && data.dueCount === 0) {
    return <div>Today: No activity yet</div>;
  }

  return (
    <div>
      Today: {data.reviewedToday} reviewed • {data.dueCount} due
    </div>
  );
}
```

---

## 10. UX States

| State | Behavior |
|---|---|
| Initial load | Shows dashboard with all 7 tiles |
| Loading progress | Progress widget shows skeleton or "Loading..." |
| No activity | Progress shows "No activity yet" |
| Hover active tile | Border changes to teal, background lightens |
| Click active tile | Navigates to corresponding route |
| Hover disabled tile | Cursor shows not-allowed, no navigation |
| Keyboard focus | Visible focus ring on active tiles |
| Dark mode | All tiles respect dark mode color tokens |

---

## 11. Acceptance Criteria

- [ ] Dashboard renders at `/dashboard` route
- [ ] Login redirects to `/dashboard` instead of `/chat`
- [ ] All 7 mode tiles visible
- [ ] Chat tile navigates to `/chat`
- [ ] Revise tile navigates to `/chat?tab=revise`
- [ ] Mistakes tile navigates to `/chat?tab=mistakes`
- [ ] Words/Grammar/Reading/Writing tiles show "Coming soon"
- [ ] Today's progress widget shows due count and reviewed count
- [ ] Desktop: 3-column grid layout
- [ ] Mobile (375px): 1-column stack
- [ ] Dark mode colors correct
- [ ] Keyboard navigation works (Tab through tiles, Enter to activate)
- [ ] Hover states work on active tiles
- [ ] Disabled tiles show cursor: not-allowed
- [ ] Existing chat/revision/mistakes tabs still work
- [ ] No console errors

---

## 12. Validation

Run:
```bash
npm run typecheck
npm run lint
npm run build
npm run validate:slice docs/slices/SLICE_3_14_BRIEF.md
```

Manual checks:
- [ ] Login → lands on dashboard
- [ ] Click Chat tile → goes to chat
- [ ] Click Revise tile → goes to revision tab
- [ ] Click Mistakes tile → goes to mistakes tab
- [ ] Click Words tile → nothing happens (disabled)
- [ ] Today's progress shows correct counts
- [ ] Test on 375px width (mobile)
- [ ] Test on 1024px width (desktop)
- [ ] Test in dark mode
- [ ] Tab through tiles with keyboard
- [ ] Enter on active tile navigates
- [ ] Screen reader announces tiles correctly

---

## 13. Stop Conditions

Stop and ask if:
- Existing chat/revision/mistakes tabs break
- More than 8 files need changes
- Database schema migration appears necessary
- Pipeline logic needs modification
- API routes beyond learning-state need changes

---

## 14. Completion Report Format

```markdown
Changed:
- `app/dashboard/page.tsx`: [summary]
- `components/DashboardTiles.tsx`: [summary]
- `components/TodayProgress.tsx`: [summary]
- `app/(auth)/login/page.tsx`: [summary]

Validation:
- `npm run typecheck`: pass/fail
- `npm run lint`: pass/fail
- `npm run build`: pass/fail
- `npm run validate:slice`: pass/fail

Manual:
- Login redirects to dashboard: pass/fail
- All 7 tiles visible: pass/fail
- Chat tile navigation: pass/fail
- Revise tile navigation: pass/fail
- Mistakes tile navigation: pass/fail
- Coming soon tiles disabled: pass/fail
- Today's progress widget: pass/fail
- Mobile 375px layout: pass/fail
- Desktop layout: pass/fail
- Dark mode: pass/fail
- Keyboard navigation: pass/fail
```

---

## 15. Estimated Time

**4-6 hours** (new route, 3 components, redirect change, testing)
