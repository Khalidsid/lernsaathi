# BUILD PROMPT — Slice 0 + Slice 1
## Hinglish-Mediated, Exam-Steered Diagnostic German Learning Companion

> **Read this entire file before writing any code.** Every section exists for a reason. Sections marked **DO NOT REMOVE** describe pieces that look unused in this slice but are required for slices 2–11 to land cleanly without rework.

---

## 0. How to use this prompt

- This is the build brief for **Slice 0 (Foundation)** + **Slice 1 (Word & Phrase Queries)** only.
- Paste this file into Codex (via Antigravity IDE). Build incrementally. Stop at the **Slice 1 Exit Criteria** in §15.
- Slices 2–11 are listed in §3 so that schema, file structure, and prompt architecture decisions made now will accommodate them. Do not "simplify" by removing schema fields, tables, or pipeline stages that look unused right now — they are load-bearing for later slices.
- After this slice ships, a separate prompt will be written for Slice 2. Do not anticipate Slice 2.

---

## 1. Product compass — preserve through every decision

The application is a **diagnostic German learning companion** for one specific learner: Hindi/Hinglish-speaking, weak in English, weak in formal Sanskritized Hindi, comfortable with colloquial Roman Hinglish, preparing for B1-level/DTZ/Goethe German exams, with a 3–4 year study gap and low confidence in writing and speaking.

The app is **exam-steered internally and learner-friendly externally** — the system carries the exam map; the learner does not see "B1" labels on every screen.

The single sentence to preserve through every line of code:

> The app should not only answer the learner's German question; it should discover *why* the question became difficult for that learner and turn that discovery into future learning support.

### What the app MUST become
A diagnostic companion that classifies input, repairs misunderstandings in simple Hinglish, stores meaningful mistakes, schedules transfer practice, and quietly maps progress to B1 readiness.

### What the app MUST NOT become
A Duolingo clone. A generic chatbot. A flashcard-only app. A streak/gamification app. A direct-answer generator. A template memorizer. A polished-German producer the learner cannot reproduce. An exam-readiness dashboard that does not repair real misunderstandings.

---

## 2. Stack & hosting

| Layer | Choice |
|---|---|
| Frontend + API | Next.js 15 (App Router), TypeScript, Tailwind |
| Hosting | Railway, single service, auto-deploy from GitHub `main` |
| Database | Postgres (Railway managed), accessed via Prisma |
| Auth | NextAuth v5, Credentials provider, single user, env-based password hash |
| LLM | OpenAI API (`gpt-5` for chat; `gpt-5` for vision in slice 4) |
| LLM SDK | `openai` npm package, structured outputs (JSON schema) for classifier |
| Image storage | Railway volume or S3-compatible bucket — **defer to slice 4** |
| Logging | Pino → console + `LearningEvent` rows in Postgres |
| Rate limit | Token bucket per IP on `/api/chat` (10/min), daily spend cap on OpenAI calls |

The repo is intended to be **public on GitHub**. All secrets live in Railway env vars. No `.env*` files committed (verify `.gitignore`).

---

## 3. Full slice map — DO NOT REMOVE

This slice covers **0 + 1** only. Listed in full so architecture accommodates the rest:

| # | Name | What it adds |
|---|---|---|
| 0 | Foundation | Scaffold, full schema, auth, OpenAI wrapper, prompt pipeline shape, logging |
| 1 | Word & phrase queries | Single text input, classifier-lite, Hinglish response, event logging |
| 2 | Grammar Q & sentence correction | Full classifier, adaptive depth router, "chhota check" verifier, mistake creation |
| 3 | Mistake memory & revision queue | SM-2 scheduling, daily review UI, prior-mistake injection, transfer-practice cards |
| 4 | Image input (screenshots/class pages) | File upload, GPT-5 vision, multi-exercise pages, uncertainty surfacing |
| 5 | Writing prompts | Step-by-step scaffold, no early answer, iterative attempt+feedback |
| 6 | Picture description | Observation-first guidance, visual vocab → revision items |
| 7 | Reading/listening question decoding | Task-phrase decoder, answer-strategy teaching |
| 8 | Speaking practice (text-only) | Teil 1/2/3 fill-in frames with Hinglish cues |
| 9 | Personal-story to German | Broken Hinglish narrative → chronological simple German |
| 10 | Hidden exam-readiness map | Skill-level updates from events; admin-only `/insights` view |
| 11 | Polish & PWA | Mobile install, offline revision queue, JSON export, theming |

---

## 4. Repository layout

Create exactly this structure in slice 0:

```
.
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (app)/page.tsx                  # main chat surface
│   ├── api/auth/[...nextauth]/route.ts
│   ├── api/chat/route.ts               # POST: input → response
│   ├── layout.tsx
│   └── globals.css
├── lib/
│   ├── auth.ts                         # NextAuth config
│   ├── db.ts                           # Prisma client
│   ├── openai.ts                       # OpenAI wrapper + rate limit + spend cap
│   ├── ratelimit.ts
│   ├── pipeline/
│   │   ├── index.ts                    # orchestrator
│   │   ├── classifier.ts               # stage 1
│   │   ├── responder.ts                # stage 2
│   │   └── verifier.ts                 # stage 3 (stub in slice 1)
│   └── logging.ts
├── prompts/                            # versioned, loaded at runtime
│   ├── system_core.md
│   ├── classifier.md
│   ├── response_word_query.md
│   ├── response_phrase_query.md
│   ├── style_guide_hinglish.md
│   └── few_shot_word_phrase.md
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── docs/
│   ├── ARCHITECTURE.md                 # decision log
│   ├── SLICE_MAP.md                    # copy of §3
│   └── PROMPT_PIPELINE.md              # explanation of §7
├── eval/
│   └── golden/
│       └── word_phrase_v1.jsonl        # 8 examples, run before commit
├── components/
│   ├── ChatShell.tsx
│   ├── MessageInput.tsx
│   └── MessageList.tsx
├── middleware.ts                        # auth + rate limit
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── README.md
└── .env.example
```

---

## 5. Database schema — implement ALL tables in slice 0

**DO NOT REMOVE** any table or field below, even if slice 1 only writes to two of them. Slices 2–10 each depend on at least one of these being present from day one.

```prisma
// prisma/schema.prisma

generator client { provider = "prisma-client-js" }
datasource db    { provider = "postgresql"; url = env("DATABASE_URL") }

model User {
  id            String    @id @default(cuid())
  username      String    @unique
  loginCount    Int       @default(0)
  firstLoginAt  DateTime?
  lastLoginAt   DateTime?
  createdAt     DateTime  @default(now())
  profile       LearnerProfile?
  events        LearningEvent[]
  mistakes      Mistake[]
  examMap       ExamReadinessMap?
}

model LearnerProfile {
  id                            String   @id @default(cuid())
  userId                        String   @unique
  user                          User     @relation(fields: [userId], references: [id])
  displayName                   String?  // captured at first login; used only at Level 2/3 difficult moments (slice 2+)
  displayNamePromptCount        Int      @default(0) // tracks how many times the name modal has been shown; stop at 2
  preferredExplanationLanguage  String   @default("roman_hinglish")
  preferredFormality            String   @default("aap_formal") // aap_formal | tum_informal — locked to aap for now
  englishLevel                  String   @default("weak")
  formalHindiLevel              String   @default("weak")
  germanLevel                   String   @default("A2_B1")
  examGoalInternal              String   @default("B1_or_DTZ")
  showExamLabelsToLearner       Boolean  @default(false)
  mainFears                     String[] @default([])
  preferredStyle                String   @default("simple_examples_first")
  createdAt                     DateTime @default(now())
  updatedAt                     DateTime @updatedAt
}

model LearningEvent {
  id                    String   @id @default(cuid())
  userId                String
  user                  User     @relation(fields: [userId], references: [id])
  inputType             String   // word_query | phrase_query | grammar_question | sentence_correction | screenshot | vocab_image | writing_prompt | speaking_task | picture_description | reading_listening_question | personal_story
  rawInput              String   @db.Text
  taskType              String?
  hiddenExamRelevance   String[] @default([])
  diagnosis             String[] @default([])
  responseDepth         String   // quick_answer | guided_explanation | full_diagnostic
  response              String   @db.Text
  learnerVisibleLabel   String
  verificationUsed      Boolean  @default(false)
  verificationPrompt    String?  @db.Text
  learnerResult         String?  // unknown | correct | incorrect | skipped
  mistakeCreated        Boolean  @default(false)
  mistakeId             String?
  uncertaintyFlagged    Boolean  @default(false)
  llmModel              String
  llmTokensIn           Int?
  llmTokensOut          Int?
  llmLatencyMs          Int?
  createdAt             DateTime @default(now())
  @@index([userId, createdAt])
}

model Mistake {
  id                     String         @id @default(cuid())
  userId                 String
  user                   User           @relation(fields: [userId], references: [id])
  sourceEventId          String
  mistakeType            String         // see §10 taxonomy
  subtype                String?
  exampleInput           String         @db.Text
  correctForm            String         @db.Text
  explanationGiven       String         @db.Text
  priority               String         @default("medium")  // low | medium | high
  hiddenExamImpact       String[]       @default([])
  likelyTransferContexts String[]       @default([])
  status                 String         @default("active") // active | mastered | archived
  reviewCount            Int            @default(0)
  lastReviewedAt         DateTime?
  createdAt              DateTime       @default(now())
  revisionItems          RevisionItem[]
  @@index([userId, status])
}

model RevisionItem {
  id                    String    @id @default(cuid())
  sourceMistakeId       String
  mistake               Mistake   @relation(fields: [sourceMistakeId], references: [id])
  revisionType          String    // vocabulary | task_phrase | grammar_pattern | writing_frame | speaking_frame | visual_vocab | mistake_repair | transfer_practice
  front                 String    @db.Text
  back                  String    @db.Text
  explanation           String?   @db.Text
  hiddenExamRelevance   String[]  @default([])
  learnerVisibleLabel   String    @default("Wiederholen, was schwer war")
  nextReview            DateTime
  intervalDays          Int       @default(1)
  ease                  Float     @default(2.5)
  reviewCount           Int       @default(0)
  createdAt             DateTime  @default(now())
  @@index([nextReview])
}

model ExamReadinessMap {
  id                String   @id @default(cuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id])
  examGoalInternal  String   @default("B1_or_DTZ")
  skills            Json     @default("{}")   // shape: see docs/ARCHITECTURE.md
  updatedAt         DateTime @updatedAt
}
```

The `skills` JSON shape (document in `ARCHITECTURE.md`):

```json
{
  "text_understanding":  { "task_instruction_decoding": "unknown", "main_idea_detection": "unknown", "detail_detection": "unknown", "vocabulary_in_context": "unknown" },
  "audio_understanding": { "time_signal_detection": "unknown", "action_detection": "unknown", "reason_detection": "unknown", "speaker_intention": "unknown" },
  "writing":             { "situation_understanding": "unknown", "formal_email_structure": "unknown", "point_coverage": "unknown", "register_control": "unknown", "simple_sentence_accuracy": "unknown" },
  "speaking":            { "self_introduction": "unknown", "picture_description": "unknown", "opinion_with_reason": "unknown", "planning_dialogue": "unknown", "question_response": "unknown" }
}
```

Allowed level values: `unknown` | `weak` | `medium` | `strong`.

### Seeding
On first boot, seed exactly one `User` (from `ADMIN_USERNAME` env), one default `LearnerProfile`, and one `ExamReadinessMap` with the shape above. This is the single user — no signup endpoint exists.

---

## 6. Auth & security

- **NextAuth Credentials provider**, single user.
- Env vars: `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` (bcrypt, cost 12), `NEXTAUTH_SECRET`, `DATABASE_URL`, `OPENAI_API_KEY`, `DAILY_SPEND_CAP_USD` (default `2.00`).
- No signup, no password reset endpoint, no public registration UI. Login is `/login`. Everything else is gated by middleware.
- Session: JWT, 7-day expiry, HTTP-only secure cookies.
- `middleware.ts`: redirect unauthenticated traffic on any non-`/login`, non-`/api/auth` path. Apply per-IP token bucket (10 req/min) on `/api/chat`.
- `lib/openai.ts`: before every call, check today's accumulated tokens × pricing against `DAILY_SPEND_CAP_USD`. If exceeded, return a friendly Hinglish "aaj ka limit khatam ho gaya, kal try karo" message; do **not** call OpenAI.
- `.env.example` committed; no real `.env*` ever committed.

---

## 7. Prompt architecture — pipeline, not single prompt — DO NOT COLLAPSE

Every `/api/chat` call goes through three stages, even in slice 1 where stages 1 and 3 are nearly trivial. The shape exists so slices 2–9 add behavior by editing one stage at a time.

```
user input
   │
   ▼
┌──────────────┐
│ classifier   │  → { inputType, taskType?, hiddenExamRelevance[], depthHint }
└──────────────┘
   │
   ▼
┌──────────────┐
│ responder    │  → { response, learnerVisibleLabel, diagnosis[], suggestedVerification? }
└──────────────┘
   │
   ▼
┌──────────────┐
│ verifier     │  → { verificationPrompt? } (stub in slice 1, returns null)
└──────────────┘
   │
   ▼
log LearningEvent
return { response, verificationPrompt? } to client
```

### Stage 1: Classifier
- OpenAI call with **structured output (JSON schema)**.
- System prompt: `prompts/classifier.md`.
- Input types it must recognize (full enum from §5): `word_query`, `phrase_query`, `grammar_question`, `sentence_correction`, `screenshot`, `vocab_image`, `writing_prompt`, `speaking_task`, `picture_description`, `reading_listening_question`, `personal_story`.
- In slice 1, classifier only ever returns `word_query` or `phrase_query` for valid German input. For anything else, it returns `out_of_scope` and the responder politely declines in Hinglish ("yeh feature abhi nahi hai, abhi sirf German word ya phrase ka matlab pooch sakte ho").
- Output schema:

```json
{
  "inputType": "word_query | phrase_query | out_of_scope",
  "taskType": "string | null",
  "hiddenExamRelevance": ["string"],
  "depthHint": "quick_answer | guided_explanation | full_diagnostic"
}
```

### Stage 2: Responder
- OpenAI call.
- System prompt = concatenation of: `prompts/system_core.md` + `prompts/style_guide_hinglish.md` + (depending on `inputType`) `prompts/response_word_query.md` or `prompts/response_phrase_query.md` + `prompts/few_shot_word_phrase.md`.
- Structured output:

```json
{
  "response": "string (markdown, Hinglish + German)",
  "learnerVisibleLabel": "Wörter verstehen | Aufgabe verstehen | ...",
  "diagnosis": ["string"],
  "suggestedVerification": "string | null"
}
```

### Stage 3: Verifier
- In slice 1: **stub**. Returns `{ verificationPrompt: null }` regardless. The function signature and call must exist; it will be filled in slice 2.

### Why this matters
Collapsing this into one prompt now saves 200 lines of code today and costs 2,000 lines of refactor in slice 2. Keep it three stages.

---

## 8. Hinglish style guide (compact — full version in `prompts/style_guide_hinglish.md`)

### USE
- **Formal aap form throughout.** Verbs directed at the learner use the aap-form, never the tum-form. This is non-negotiable.
- Roman Hinglish (devanagari avoided).
- Simple Hindi/Urdu words a bilingual urban speaker uses every day.
- Short sentences (8–14 words typical).
- Concrete everyday examples before any abstract rule.
- Direct cues in formal voice: `Bas itna yaad rakhein:`, `Chhota check:`, `Ab try karein:`, `Dhyaan dijiye:`.
- Low grammar terminology. When unavoidable, give it a Hinglish handle: "Akkusativ (movement wala case)".

### Formality table — locked

| Forbidden (tum form) | Required (aap form) |
|---|---|
| karo | karein |
| likho | likhein |
| rakho | rakhein |
| batao | bataein |
| seekho | seekhein |
| suno | sunein |
| dekho | dekhiye / dekhein |
| pooch sakte ho | pooch sakte hain |
| try karo | try karein |
| yaad rakho | yaad rakhein |
| tum / tumhara / tumhe | aap / aapka / aapko |
| chalo | chaliye |

### AVOID
- **Mixing English glosses with Hinglish glosses on the meaning line.** A construction like `= performance / kaam ka result ya quality` is forbidden because it pairs an unfamiliar English word with a Hinglish phrase as if they are equivalent options — for a learner weak in English this causes critical comprehension failure. The meaning must be a **single fluid Hinglish phrase.** Naturally integrated English loanwords that are part of normal urban Hinglish speech (`school`, `office`, `appointment`, `phone`, `email`, `practice`) are fine **inside** the Hinglish phrase. What is forbidden is presenting a pure-English word **as the primary meaning gloss** alongside a Hinglish one.
- Tum-form verbs anywhere in user-facing text (see table above).
- Academic English ("denotes", "governed by", "non-directional").
- Sanskritized formal Hindi (no "स्थिति", "क्रिया", "विषय").
- Long theoretical paragraphs.
- Random praise ("Great question!", "You're doing amazing!").
- Exam-pressure vocabulary on learner-facing surfaces ("B1 Prüfung", "TELC", "exam-ready"). Internal labels OK in JSON, never in `response` field.
- German above ~B1 level in examples. Stay inside the learner's reach.

### Output structure (word/phrase queries)

```
[lemma] = [single fluid Hinglish meaning phrase, no English/Hinglish "/" pairing]
[Plural / article note if noun. Pattern note if verb/phrase.]

Example:
[one short German sentence]
[Hinglish translation of same sentence — naturally integrated English loanwords are fine here]

[Optional one-line use note OR pattern note OR Chhota check — formal aap form]
```

### Length

Aim for **150–200 words** for word/phrase queries. This is a **soft target**, not a hard cap. Do not enforce a maximum length via validation that rejects responses — the model needs buffer for clarity. Brevity is preferred, but never at the cost of leaving the learner confused.

---

## 9. Few-shot examples — file: `prompts/few_shot_word_phrase.md`

Exactly these 8 examples, in this order, in this format. They are the strongest signal Codex will use to lock the model's voice. Do not paraphrase them. Every meaning gloss is a single fluid Hinglish phrase — no English-Hinglish pairing on the `=` line. Every imperative is in formal aap form.

---

**Input:** `die Leistung`

**Output:**
```
die Leistung = kaam ka result, ya kaam kitna achha hua
Plural: die Leistungen

Example:
Seine Leistung in der Schule ist sehr gut.
Uska school ka kaam bahut achha hai.

Use:
School, office, sport — jahan bhi kisi ke kaam ka result dekhna ho, yeh word use hota hai.
```

---

**Input:** `die Gelegenheit`

**Output:**
```
die Gelegenheit = mauka, ek aisa waqt jab kuch ho sake
Plural: die Gelegenheiten

Example:
Das ist eine gute Gelegenheit, Deutsch zu üben.
Yeh German practice karne ka achha mauka hai.

Use:
Naukri, padhai, baat-cheet — jahan kuch karne ka theek waqt mile.
```

---

**Input:** `erledigen`

**Output:**
```
erledigen = kaam pura karna, ya nipta dena

Example:
Ich muss heute noch zwei Aufgaben erledigen.
Mujhe aaj do aur kaam khatam karne hain.

Pattern:
etwas (Akkusativ) erledigen
= kisi kaam ko nipta dena

Common:
to-do list, office email, ghar ka kaam.
```

---

**Input:** `sich ärgern`

**Output:**
```
sich ärgern = gussa hona, ya chid hona

Yeh reflexive verb hai (sich + ärgern).

Example:
Ich ärgere mich über den Lärm.
Mujhe shor se gussa aata hai.

Pattern:
sich ärgern + über + Akkusativ
"kis cheez par gussa" = über + Akk
```

---

**Input:** `zurechtkommen`

**Output:**
```
zurechtkommen = kaam chala lena, ya kisi situation ke saath theek se rehna

Separable verb: zurecht + kommen.

Example:
Ich komme mit der neuen Arbeit gut zurecht.
Main naye kaam ke saath theek se chala raha hoon.

Pattern:
mit + Dativ + zurechtkommen
= kisi cheez ya insaan ke saath chal lena
```

---

**Input:** `übrig bleiben`

**Output:**
```
übrig bleiben = bach jana, jo use nahi hua woh reh jana

Example:
Es ist noch Suppe übrig geblieben.
Soup abhi bach gaya hai.

Note:
Khaana, paisa, time — kuch bhi bach jaaye yahan use hota hai.
"übrig" akele bhi aata hai: "Ist noch etwas übrig?" = "Kuch bacha hai?"
```

---

**Input:** `Bescheid sagen`

**Output:**
```
Bescheid sagen = kisi ko khabar dena, kuch bata dena

Yeh phrase fixed hai. "Bescheid" akele kam use hota hai.

Example:
Ich sage dir Bescheid, wenn der Termin steht.
Jab appointment fix ho jaaye, main aapko bata doonga.

Pattern:
jemandem (Dativ) Bescheid sagen
= kisi ko khabar dena

Common:
email, office, doctor ka appointment.
```

---

**Input:** `anstrengend`

**Output:**
```
anstrengend = thakane wala, mehnat wala

Yeh adjective hai.

Example:
Der Tag war sehr anstrengend.
Aaj ka din bahut thakane wala tha.

Use:
Kaam, safar, exercise, exam — jo bhi energy le, woh anstrengend.
```

---

## 10. Misunderstanding taxonomy — DO NOT REMOVE

Slice 1 only uses two of these (`word_meaning`, `phrase_meaning`). The full enum below is committed in slice 0 to `lib/pipeline/taxonomy.ts` so the classifier and `Mistake.mistakeType` field accept the full vocabulary from day one.

```typescript
export const MISTAKE_TYPES = [
  "task_instruction_confusion",
  "situation_context_confusion",
  "word_meaning",
  "phrase_meaning",
  "article_gender_confusion",
  "case_confusion",
  "verb_form_confusion",
  "word_order_confusion",
  "formality_register_confusion",
  "writing_structure_confusion",
  "speaking_structure_confusion",
  "visual_observation_failure",
  "exam_strategy_failure",
  "retention_failure",
  "confidence_freeze_failure",
  "transfer_failure",
] as const;
```

---

## 11. Learner-facing naming rule

The system tracks internal exam skills, but learner-facing UI never shows exam labels. The `learnerVisibleLabel` field comes from this map:

| Internal | Learner-facing |
|---|---|
| writing | Schreiben Schritt für Schritt |
| speaking | Sprechen üben |
| reading | Text verstehen |
| listening | Audio verstehen |
| task_instruction_decoding | Aufgabe verstehen |
| grammar_accuracy | Satz richtig machen |
| vocabulary_in_context | Wörter verstehen |
| revision | Wiederholen, was schwer war |
| picture_speaking | Bild beschreiben |
| answer_strategy | Antwort finden |

Slice 1 will almost always emit `Wörter verstehen`. Map is committed in slice 0 to `lib/pipeline/labels.ts`.

**Forbidden in any user-facing string:** `B1`, `TELC`, `Goethe`, `DTZ`, `Prüfung`, `exam`, `readiness`, `score`. These can appear only inside JSON fields the user never sees (`hiddenExamRelevance`, internal docs, etc.).

---

## 11.5. User name capture & personalization rule

The learner has a `displayName` (separate from the auth `username`). It is captured once and used sparingly.

### Capture
- On the first successful login *only*, before the chat surface renders, show a single small modal:
  > Aapka naam kya hai? — Yeh sirf personalisation ke liye hai.
  
  One text input + a "Aage badhein" button. On submit, write to `LearnerProfile.displayName`. If the field is later cleared by the user from a future settings view (slice 11), the modal does not reappear — empty `displayName` is a valid state.
- Skipping is allowed: a "Abhi nahi" link saves `null`. The modal does not reappear in the same session, but reappears once on the next login. After two skips, never ask again (track via a `displayNamePromptCount` field — add it to `LearnerProfile` if needed during slice 0).

### Personalization rule (slice 1: capture only, do not display)
- **Slice 1 captures the name but never uses it in chat responses.** Reason: Level 1 word/phrase replies are short, factual, and routine — inserting the learner's name there feels patronizing and trains the model to over-personalize.
- **From slice 2 onward**, `displayName` may be injected only at Level 2 and Level 3 moments where the task is genuinely difficult or the learner has just failed a check. Examples:
  - Before introducing a tricky grammar contrast: `[Name], yeh wala thoda dhyaan se dekhna padega.`
  - After a failed verification: `[Name], koi baat nahi — ek aur tareeke se dekhte hain.`
- **Hard limits on usage:**
  - Never more than **once per assistant turn**.
  - Never in the meaning gloss line itself.
  - Never as filler ("Sure, [Name]!") or fake intimacy.
  - If `displayName` is null, all personalization templates fall back to no-name versions.

### Visitor / session tracking
- On every successful login, the NextAuth `signIn` callback increments `User.loginCount` and updates `User.lastLoginAt`. On the first login, also sets `User.firstLoginAt`.
- A read-only admin route `/admin/stats` (gated by the same single-user auth) shows: `loginCount`, `firstLoginAt`, `lastLoginAt`, total `LearningEvent` count, total `LearningEvent` count today. **No charts, no analytics SDKs, no third-party telemetry** — just a small JSON dump rendered as a `<pre>` block. This is the foundation for future collaborator usage insight.

---

## 12. Adaptive depth rule

Three levels. Slice 1 always uses Level 1; rule is committed now so slice 2 can wire it without rearchitecting.

| Level | Trigger | Behavior |
|---|---|---|
| 1 — Quick answer | Single word/phrase query, no prior open mistake on this lemma | Meaning + one example. Aim 150–200 words (soft target, no validation rejection). No verification. |
| 2 — Guided explanation | Grammar Q, sentence correction, lemma with prior open mistake | Explanation + example + tiny check. Aim 200–280 words (soft). May use `displayName` once. |
| 3 — Full diagnostic | Writing prompt, screenshot, picture description, repeated mistake | Task demand → context → example → learner attempt → diagnosis → revision. Multi-turn. May use `displayName` once per turn. |

**Length validation rule:** the API never rejects an LLM response for being over the soft target. Length is a guideline for the model, not a contract with the client. If the model drifts to 400+ words consistently, the fix is prompt tuning, not validation.

Slice 1 hard-codes `depth = 1` for `word_query`/`phrase_query` and rejects everything else.

---

## 13. Logging spec

Every `/api/chat` call writes one `LearningEvent` row. Required fields: all of those listed in the schema. Token counts and latency come from the OpenAI response. `llmModel` records the exact model string (e.g. `gpt-5-2025-09-01`).

Console (Pino) also logs: timestamp, userId, inputType, depthHint, latencyMs, tokensIn, tokensOut, errorIfAny. **Never log raw OpenAI API key. Never log full image bytes (slice 4+).**

---

## 14. Slice 1 scope — exactly what is built

### UI (`app/(app)/page.tsx`)
- Single-column mobile-first chat layout. Calm, soft, light theme. Tailwind only — no UI library.
- Persistent message list (in-memory for slice 1; DB-backed in slice 3).
- One text input + send button at bottom.
- No streak, no badges, no progress bars, no exam labels, no "great job" messaging.
- Header: app name "Sprachhilfe" (or learner's chosen label, configurable in env), nothing else.
- Empty state: small Hinglish hint in formal voice — "German ka koi word ya phrase likhein. Main matlab aur ek example doonga."

### First-login onboarding modal
- Shown exactly once on first login (and at most once more if skipped — see §11.5).
- Renders before the chat surface; chat input is disabled behind it.
- Copy:
  > Aapka naam kya hai?
  > 
  > Yeh sirf personalisation ke liye hai. Aap chahein to skip kar sakte hain.
- Two actions: text input + "Aage badhein" (saves), or "Abhi nahi" link (saves null, increments `displayNamePromptCount`).
- After save, modal closes; chat surface enables. Slice 1 does not display the name anywhere yet.

### API (`app/api/chat/route.ts`)
- POST `{ input: string }` → `{ response: string, learnerVisibleLabel: string, verificationPrompt: null }`.
- Auth required (middleware enforces).
- Rate limit + spend cap enforced.
- Pipeline: classifier → responder → verifier (stub) → log event → return.
- For `out_of_scope` classifier result: respond in Hinglish (formal aap form) that this slice only handles word/phrase queries; do NOT call the responder LLM (saves cost). Suggested copy: `Yeh feature abhi available nahi hai. Filhal aap sirf koi German word ya phrase ka matlab pooch sakte hain.`

### Daily-limit message
When `DAILY_SPEND_CAP_USD` is exceeded, the chat returns this fixed Hinglish string without invoking OpenAI:
> Aaj ka limit khatam ho gaya hai. Kal try karein.

### Auth
- `/login` page: username + password fields, NextAuth credentials.
- On successful sign-in, NextAuth `signIn` callback increments `User.loginCount`, sets `User.lastLoginAt`, and on first login sets `User.firstLoginAt`.
- Logout link in header.

### Admin stats route (`/admin/stats`)
- Same auth as everything else. Returns a small `<pre>`-rendered JSON block with: `loginCount`, `firstLoginAt`, `lastLoginAt`, `totalEvents`, `eventsToday`. No charts, no SDKs.

### Prompt files
All six files in `prompts/` populated with the content from §8 and §9. `prompts/system_core.md` contains the compass from §1 (compressed), the formality table from §8, and the forbidden-words list from §11.

### Eval
- `eval/golden/word_phrase_v1.jsonl` with the 8 inputs from §9 and their expected outputs (the same content).
- `pnpm eval` (or `npm run eval`) script that runs all 8 through the pipeline against the live OpenAI API and prints a diff against expected outputs. Treat as smoke test, not strict equality — Codex should output a similarity score and flag major drift. **Run this before every commit to `prompts/`.**
- Eval also runs three **negative checks** on every output:
  1. No tum-form imperative present (regex against the forbidden list in §8).
  2. No English-Hinglish mixed gloss on the `=` line (heuristic: the `=` line should not contain ` / ` separating an English word from a Hinglish phrase — flag any ` / ` occurrence on a line starting with the lemma).
  3. No forbidden exam vocabulary present (`B1`, `TELC`, etc.).
  Failure on any negative check blocks the commit.

---

## 15. Slice 1 exit criteria — definition of done

Mark slice complete when ALL of the following are true:

1. Repo deploys to Railway from `main` push, no manual steps. Public URL works.
2. `/login` accepts the seeded admin credentials; wrong password rejected.
3. **First-login flow:** the displayName modal appears once on first successful login; "Aage badhein" saves the name and never reappears; "Abhi nahi" saves null and increments `displayNamePromptCount`. After 2 skips, modal stops appearing.
4. Logged-in user can submit `die Leistung` and receive a response that visibly matches the §9 format (lemma line, example, Hinglish translation, one note) — in formal aap form.
5. Submitting `Hello, can you write me a 200-word essay on climate change?` returns the Hinglish out-of-scope message in formal aap form; no responder LLM call is made (verify in logs).
6. Each successful chat creates one `LearningEvent` row with all required fields populated. `mistakeCreated = false`. `verificationUsed = false`.
7. `/api/chat` rejects unauthenticated requests (401).
8. 11th request from same IP within 60 seconds returns 429.
9. After hitting `DAILY_SPEND_CAP_USD`, further calls return the Hinglish daily-limit message (formal aap) without invoking OpenAI.
10. `pnpm eval` runs all 8 golden examples; output is reviewed by hand and committed alongside the prompts. Major drift on any example, or any negative-check failure (tum-form, English-Hinglish mixed gloss, forbidden exam word) blocks the commit.
11. **Formality grep test** (run as part of CI): no occurrence of `karo`, `likho`, `rakho`, `batao`, `seekho`, `suno`, `pooch sakte ho`, `try karo`, `tum`, `tumhara`, `tumhe`, `chalo` in any file under `app/`, `components/`, or `prompts/`. Code identifiers and JSON keys are exempt; user-facing strings and prompt files are not.
12. **No-mixing grep test:** in `prompts/few_shot_word_phrase.md`, no line beginning with a German lemma followed by ` = ` contains the ` / ` separator. Single-line meanings only.
13. **Login tracking:** after the second login, `User.loginCount = 2`, `User.firstLoginAt` is the first-login timestamp, `User.lastLoginAt` is the second-login timestamp.
14. **Admin stats:** `/admin/stats` returns a JSON block with the five fields listed in §14 and renders behind auth.
15. `docs/ARCHITECTURE.md` records: stack choices, schema rationale (especially "why all five tables in slice 0"), pipeline rationale (why three stages), prompt-file convention, eval convention, formality decision, displayName usage rule.
16. `README.md` has setup steps for a new contributor: clone, set env, `pnpm install`, `pnpm prisma migrate dev`, `pnpm dev`.
17. No file in `app/`, `lib/`, `components/`, or `prompts/` contains the strings `B1`, `TELC`, `Goethe`, `DTZ`, `Prüfung`, `exam`, `readiness`, `score` in any string the user sees. (Internal type names and JSON field keys are allowed.)

---

## 16. Anti-goals for this slice — explicitly do NOT build

- Mistake creation. (Slice 2.)
- Revision queue, daily review UI, SM-2 scheduler. (Slice 3.)
- Image upload, vision API. (Slice 4.)
- Writing scaffolds, picture description, speaking frames. (Slices 5–8.)
- **Use of `displayName` in routine Level 1 word/phrase responses.** Slice 1 captures the name but never displays it in chat output. Personalization moments are reserved for Level 2/3 difficult tasks (slice 2+).
- Streaks, XP, levels, achievement badges, daily goals, leaderboard. (Never.)
- Multi-user signup, password reset, OAuth. (Never — single user.)
- Public marketing/landing page. (Login is the front door.)
- Mobile native shell. (PWA in slice 11.)
- Internationalization framework. (Strings are Hinglish + German hard-coded; that is the product.)
- Any analytics/telemetry SDK. (Privacy. The `/admin/stats` route is a hand-rolled JSON dump, not a third-party library.)
- A "settings" page. (One env-driven config; no UI. The displayName modal is *not* a settings page.)
- Tum-form Hinglish anywhere user-facing. The grep test in §15 enforces this.

If Codex is tempted to add any of the above "while we're here", stop and re-read this section.

---

## 17. Rules for the coding assistant (Codex / Antigravity)

1. **Read this entire file before generating any code.** If anything is unclear, ask the human before generating.
2. **One commit per logical unit** (schema, auth, OpenAI wrapper, classifier, responder, verifier stub, UI, eval, docs). Roughly 8–10 commits for this slice.
3. **Do not edit `prompts/` and `lib/pipeline/` in the same commit.** Prompt changes must be reviewable in isolation.
4. **Never inline a system prompt as a TS string literal.** Always read from `prompts/*.md` at runtime so prompts are diffable in git.
5. **Versioning convention:** when a prompt file changes meaningfully, append `_v2`, `_v3`, etc. to its filename and bump the loader. Eval reruns on version bump.
6. **No new dependencies** without recording them in `docs/ARCHITECTURE.md` with a one-line justification.
7. **Schema migrations:** generate via `prisma migrate dev --name <descriptive>`. Never hand-edit migration SQL.
8. **TypeScript strict mode on.** No `any` without an inline `// reason:` comment.
9. **When in doubt about pedagogy, re-read §1, §8, §11, §11.5.** When in doubt about scope, re-read §16.
10. **Formality is non-negotiable.** Every user-facing string and every prompt template uses formal aap-form Hinglish. The grep test in §15 enforces this; do not write tum-form anywhere outside of legal git history.
11. **Meaning glosses are pure Hinglish.** No `English / Hinglish` pairing on the `=` line of any vocabulary explanation. Naturally integrated English loanwords inside a Hinglish phrase are fine; English presented as a parallel meaning is forbidden.
12. **At end of slice:** produce a short "what was built / what was deferred / what surprised me" note in `docs/SLICE_1_NOTES.md`. This becomes input to the Slice 2 prompt.

---

## 18. The two sentences to keep on the wall

> The app should not only answer the learner's German question; it should discover *why* the question became difficult for that learner and turn that discovery into future learning support.

> The app should carry the exam map internally so that the learner does not have to carry the exam pressure on every screen.

End of build prompt. Slice 2 prompt will be issued separately after Slice 1 ships and `SLICE_1_NOTES.md` is reviewed.
