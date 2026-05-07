# Lernsaathi — Implementation Prompt for Codex

You are implementing  **Lernsaathi** , a private German-learning chat app for a single learner. The complete visual and interaction design lives in `design_concept/Lernsaathi.html` (one HTML file containing every screen, all design tokens, the component dictionary, and every UI state). **Treat that file as the single source of truth for visuals.** Do not invent colors, fonts, spacing, copy tone, or layout choices. When in doubt, open the file and copy the values.

## Ground rules (read before writing any code)

1. **Read these files first, in order, before writing anything:**
   * `design_concept/Lernsaathi.html` — full screen inventory + tokens legend (section `// 0. design tokens`) + component dictionary (section `// 9. component dictionary`).
   * `design_concept/tweaks-panel.jsx` — only relevant if you are porting the in-design Tweaks system; otherwise ignore.
2. **Do not hallucinate brand assets.** No logos, no icons, no illustrations beyond what exists in the design file. Icons in the design are inline SVGs from lucide — re-use them via the `lucide-react` package, matching name-for-name (`MoreHorizontal`, `Image`, `ArrowUp`, `X`).
3. **Do not invent copy.** Every user-facing string — buttons, placeholders, empty states, labels — is already written in the design file in formal aap-form Hinglish ("Andar aaiye", "Yahan likhein...", "Aage badhein", "Aaj ke liye bas itna", etc.). Copy them verbatim.
4. **Do not add features that aren't in the design.** No streaks, no XP, no notifications, no social, no settings beyond what the `…` menu in the design implies.
5. If a requirement here conflicts with the design file, **the design file wins** — flag the conflict in your PR description, do not silently resolve it.

## What to build

A single-user web app with these screens (all present in the design file, labelled `// 6.x`):

| Section | Screen                                | Source in design file             |
| ------- | ------------------------------------- | --------------------------------- |
| 6.1     | Login                                 | `// 6.1 login`                  |
| 6.2     | First-login name modal                | `// 6.2 first-login name modal` |
| 6.3a    | Chat — empty state                   | `// 6.3a chat — empty state`   |
| 6.3b    | Chat — structured assistant response | `// 6.3b main chat surface`     |
| 6.3c    | Dark-mode chat                        | `// 6.3c dark mode`             |
| 6.4     | Daily revision card + done state      | `// 6.4 daily revision`         |
| 6.5     | Mistake list (grouped by week)        | `// 6.5 mistake list`           |
| 6.6     | Image upload in chat                  | `// 6.6 image upload`           |
| 6.7     | Admin stats page                      | `// 6.7 admin stats`            |

The three tabs along the top of every authed screen are **Baatcheet** (chat), **Dohraana** (revision), **Galtiyan** (mistakes). Active tab uses the `bg-paper2 text-ink border border-rule` pill style — see the design.

## Tech stack

* **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS.
* **Auth:** NextAuth credentials provider, single hard-coded user from env (`AUTH_USERNAME`, `AUTH_PASSWORD_HASH` — bcrypt). No signup flow.
* **DB:** SQLite via Prisma. Schema below.
* **LLM:** OpenAI (or Anthropic) via server route; never expose key to client.
* **Image upload:** local filesystem under `uploads/` (gitignored), served via signed Next.js route. No S3 in v1.
* **State:** React Query for server state, zustand for ephemeral UI (modal open, current tab).

## Design tokens — extract verbatim from the design file

Open `design_concept/Lernsaathi.html`, find the `tailwind.config = { ... }` block in `<head>`, and copy it into `tailwind.config.ts` exactly. Same colors, same font families (Fraunces, Inter, JetBrains Mono via `next/font/google`), same border radii. Then copy the `<style>` block from the same file into `app/globals.css` — particularly:

* `.serif`, `.mono`, `.bipair`, `.bipair-dark`, `.de`, `.hi`
* `.assistant-bg`, `.assistant-bg-dark`
* `.lemma-underline` (this is the gradient-underline trick on lemma anchors)
* `.statusbar`, `.phone` styles → drop these, they're for the design canvas only
* `.hairline`, `.hairline-dark`, `.tabpill`, `.send-btn`, `.send-btn-disabled`, `.fade-in` keyframe

## Component contract

Build these reusable components — names match the design's component dictionary:

```
components/
  AppShell.tsx         — top bar with "Lernsaathi" wordmark + … menu + tab pills
  TabBar.tsx           — Baatcheet / Dohraana / Galtiyan
  Composer.tsx         — input + attach button + send button (handles disabled state)
  UserBubble.tsx       — right-aligned, bg-paper2, rounded-2xl rounded-br-md
  AssistantBlock.tsx   — left, .assistant-bg, with optional italic label tag above
  LemmaAnchor.tsx      — serif text + .lemma-underline class
  BilingualPair.tsx    — { de: string; hi: string } → renders the 2px-rule pair
  StatusDot.tsx        — open | inRevision | settled (colors in design tokens)
  RevisionCard.tsx     — large lemma + prompt + Dekhein/Aage badhein
  MistakeRow.tsx       — dot + lemma + gloss + day-tag
  ImageChip.tsx        — pre-send attachment chip with remove button
  AdminStatCard.tsx    — label + serif numeral
```

Every component must accept a `className` prop and forward refs.

## Data model (Prisma)

```prisma
model Mistake {
  id         String   @id @default(cuid())
  lemma      String   // "die Leistung"
  gloss      String   // short Hinglish gloss
  status     String   // "open" | "inRevision" | "settled"
  createdAt  DateTime @default(now())
  lastReview DateTime?
  reviewCount Int     @default(0)
}

model Message {
  id         String   @id @default(cuid())
  role       String   // "user" | "assistant"
  content    String   // markdown / structured JSON
  imagePath  String?
  label      String?  // "wörter verstehen" | "grammatik samajhna" | "satz banana" | "tasveer dekhna"
  lemma      String?  // if assistant block anchors a lemma
  createdAt  DateTime @default(now())
}

model Event {
  id         String   @id @default(cuid())
  kind       String   // login | message_sent | response_rendered | mistake_logged | revision_opened | revision_card_revealed | revision_done
  payload    Json?
  createdAt  DateTime @default(now())
}

model UserProfile {
  id    String @id @default("singleton")
  name  String?
}
```

## LLM contract

The assistant must return a structured JSON object the client can render into an `AssistantBlock`. Define this schema in `lib/llm/schema.ts`:

```ts
type AssistantResponse = {
  label: "wörter verstehen" | "grammatik samajhna" | "satz banana" | "tasveer dekhna";
  lemma?: { article?: "der" | "die" | "das"; word: string; plural?: string; gloss: string };
  examples?: Array<{ de: string; hi: string }>;
  use?: string;        // Hinglish prose, 1–2 sentences
  freeform?: string;   // fallback when none of above fit
};
```

System prompt rules (put in `lib/llm/systemPrompt.ts`):

* Respond in **formal aap-form Hinglish** (aap, aapka, aapse — never tum/tu).
* Never use praise filler. Acknowledgments are limited to: "Achha kaam.", "Theek hai.", "Aage chaliye."
* Never use red/green for correctness. Don't return color hints in the payload.
* Bilingual examples: German line first, Hinglish line second, equal weight.
* Never gamify. No streaks, points, levels.
* Keep `use` to 1–2 sentences. Plain language.

## Routes

```
/                       → redirect to /login or /chat
/login                  → screen 6.1
/chat                   → 6.3a/6.3b (default tab)
/chat?tab=revision      → 6.4
/chat?tab=mistakes      → 6.5
/admin/stats            → 6.7  (auth-gated; same single user)

POST /api/messages      → save user msg, call LLM, save assistant msg
POST /api/upload        → receive image → returns imagePath
POST /api/mistakes      → log a mistake (called when assistant returns a lemma)
PATCH /api/mistakes/:id → update status
GET  /api/revision/next → next due mistake
POST /api/revision/done → mark card reviewed
GET  /api/admin/stats   → counts + last 8 events
```

## Spaced repetition (v1, simple)

Pick the oldest `Mistake` with `status = "open"` OR with `lastReview` more than `2^reviewCount` days ago (cap at 14 days). After "Aage badhein": `reviewCount += 1`, `lastReview = now`. After 3 successful reviews → `status = "settled"`. No SM-2, no Anki — keep it boring.

## Acceptance checklist

* [ ] Visual diff of every built screen against its `// 6.x` counterpart in `design_concept/Lernsaathi.html` is pixel-close (typography, spacing, colors, radii).
* [ ] All copy strings match the design file verbatim.
* [ ] Bilingual pairs render with the 2px low-opacity teal left rule, German `font-medium`, Hinglish `font-normal`, equal size.
* [ ] Lemma anchors use the `.lemma-underline` gradient treatment in: assistant blocks, revision cards, mistake list rows.
* [ ] Dark mode toggles via `prefers-color-scheme` and matches `// 6.3c`.
* [ ] Status dots use only the three teal-family shades from the design — never red/green.
* [ ] No emoji anywhere unless they appear in the design (they do not).
* [ ] No streaks, levels, badges, or any gamification surface.
* [ ] `prefers-reduced-motion` respected — animations are fade-only, ≤ 220ms.
* [ ] Admin page renders the five stat cards + the 8-row mono event log exactly like `// 6.7`.

## Out of scope for v1

* Multi-user, signup, password reset
* Push notifications, email
* Native mobile apps
* TTS / audio
* Cloud storage for uploads
* Any analytics beyond the local `Event` table

## When you finish

In your PR description, list any place you deviated from the design file and why. If you couldn't find a value (color, size, copy string) in the design file, **stop and ask** rather than guessing.
