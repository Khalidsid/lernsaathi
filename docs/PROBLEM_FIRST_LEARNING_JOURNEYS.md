# Problem-First Learning Journeys

**Status:** product direction for Slices 3.14-3.16  
**Date:** 2026-05-10  
**Purpose:** Replace generic chat-first navigation with six problem-first learning journeys. This document is the design source for future slice briefs; do not ask implementation agents to infer this from older dashboard notes.

---

## 1. Product Decision

The app is not organized around app features such as `Chat`, `Revise`, or `Mistakes`.

The app is organized around the learner's immediate problem:

```text
Hello [Name], welcome to Lernsaathi.
Which problem do you need assistance with?

Aapko kis task mein madad chahiye?
```

The landing screen appears after login. The user must choose one of six high-gloss problem tiles before entering a journey.

Free chat remains available later as a secondary escape route, but it must not be one of the six primary tiles.

---

## 2. Six Tiles

Use German as the tile identity and Roman Hinglish as the explanation.

| ID | German Label | English Meaning | Hinglish Line | Primary Entry |
|---|---|---|---|---|
| `words` | `WOERTER` | Words | `Word ya phrase ka matlab samajhna` | Type one German word or phrase |
| `reading` | `LESEN` | Reading | `Letter, form, email ya notice padhna` | Paste German text |
| `writing` | `SCHREIBEN` | Writing | `Message, email ya reply likhna` | Choose what to write |
| `grammar` | `GRAMMATIK` | Grammar | `Sentence ya grammar mistake theek karna` | Type a German sentence |
| `listening` | `HOEREN` | Listening | `Jo suna hai uska matlab samajhna` | Type what was heard |
| `review` | `WIEDERHOLEN` | Review | `Apni mistakes revise karna` | Open revision queue |

Use ASCII German replacements (`WOERTER`, `HOEREN`) in code/docs unless the edited file is already safely UTF-8 end-to-end. UI can later render `Wörter` and `Hören` if verified.

---

## 3. Learning Principles

The UI must reduce cognitive load.

Do:

- Present one obvious next action per journey screen.
- Use recognition first, then recall, then production.
- Use short feedback immediately after each learner action.
- Convert mistakes into review items.
- Show progress as action guidance, not as large decorative stats.

Do not:

- Open old chat history by default.
- Ask the learner to choose between many abstract app features.
- Show large progress widgets above the active task.
- Add fake coming-soon controls that look clickable.
- Make free chat the default path.

---

## 4. Visual Specification

### Page Frame

- Route: `/dashboard`.
- Background: existing app body background. Do not add gradient-orb, bokeh, or decorative blob backgrounds.
- Content max width: `960px`.
- Desktop padding: `px-6 py-8`.
- Mobile padding: `px-4 py-5`.
- Header block max width: `680px`.

### Heading Text

Use exact visible text:

```text
Hello [Name], welcome to Lernsaathi.
Which problem do you need assistance with?

Aapko kis task mein madad chahiye?
```

Text sizes:

- Greeting line: `text-[15px]`, color `text-ink3 dark:text-ink4`.
- Main question: `serif text-[32px] leading-[1.12]` on desktop, `text-[26px] leading-[1.15]` on 375px.
- Hinglish line: `text-[15px] leading-[1.55]`, color `text-ink2 dark:text-[#CFCDC4]`.
- No negative letter spacing.

### Tile Grid

- Desktop: `grid-cols-3`, gap `14px`.
- Tablet: `grid-cols-2`, gap `12px`.
- Mobile 375px: `grid-cols-1`, gap `10px`.
- Tile min height: desktop `148px`, mobile `112px`.
- Tile border radius: `rounded-lg`.
- Touch target: entire tile, minimum `112px` high on mobile.

### High-Gloss Tile Style

Use a restrained glossy app-card treatment. The shine must not reduce text contrast.

Base classes:

```tsx
"group relative overflow-hidden rounded-lg border border-rule bg-paper2 p-4 text-left shadow-[0_12px_28px_rgba(31,31,31,0.08)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-teal hover:bg-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-teal active-press dark:border-[#2E2E2B] dark:bg-night2 dark:hover:border-tealLt2 dark:hover:bg-night"
```

Gloss layer:

```tsx
<span
  aria-hidden="true"
  className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-white/45 opacity-60 dark:bg-white/10"
/>
```

Bottom accent strip:

```tsx
<span
  aria-hidden="true"
  className="absolute inset-x-0 bottom-0 h-1 bg-teal/70 dark:bg-tealLt2/60"
/>
```

Do not use large purple/blue gradients. Do not use decorative orbs.

### Tile Content

Each tile contains:

1. German label in uppercase.
2. English meaning.
3. Hinglish task line.
4. Small action label.

Typography:

- German label: `serif text-[27px] leading-none`, desktop; `text-[24px]` mobile.
- English meaning: `mt-2 text-[12px] uppercase tracking-[0.08em] text-ink4`.
- Hinglish line: `mt-3 text-[14px] leading-[1.45] text-ink2 dark:text-[#CFCDC4]`.
- Action label: `mt-4 text-[12px] font-medium text-tealDk dark:text-tealLt2`.

### Tile Accent Colors

Use different accents so the screen does not become one-note teal.

| Tile | Accent utility |
|---|---|
| `WOERTER` | `bg-teal/70 dark:bg-tealLt2/60` |
| `LESEN` | `bg-sky-500/70 dark:bg-sky-300/60` |
| `SCHREIBEN` | `bg-amber-500/75 dark:bg-amber-300/65` |
| `GRAMMATIK` | `bg-rose-500/65 dark:bg-rose-300/55` |
| `HOEREN` | `bg-indigo-500/65 dark:bg-indigo-300/55` |
| `WIEDERHOLEN` | `bg-emerald-500/70 dark:bg-emerald-300/60` |

### Compact Learning Coach

The progress surface is not a large tile.

Default state: collapsed one-row strip below the heading and above the tiles.

Collapsed text:

```text
Practice status: [due] due - [active] active - [done] done today
```

Expanded purpose line:

```text
This tracks due reviews, active mistakes, and today's completed practice.
```

Dimensions:

- Collapsed height: target `44px`.
- Expanded max height: target `132px`.
- Border radius: `rounded-lg`.
- Padding: collapsed `px-3 py-2`, expanded `p-3`.
- Default expanded state: false.
- Toggle button text: `Show details` / `Hide details`.
- Toggle button must have `aria-expanded`.

---

## 5. Journey Requirements

Each journey starts with a focused entry screen, not an empty generic chat.

### WOERTER Journey

Flow:

1. Input word or phrase.
2. Meaning in simple Hinglish.
3. Two German examples.
4. One quick check.
5. One production prompt: "Ab aap ek sentence banaiye."
6. Save weakness to revision if answer is wrong or low confidence.

### LESEN Journey

Flow:

1. Paste text.
2. App detects type: letter, form, email, notice, message, unknown.
3. First show gist in one sentence.
4. Highlight difficult words.
5. Ask one comprehension question.
6. Offer "Explain line by line" only after gist.

### SCHREIBEN Journey

Flow:

1. Choose format: WhatsApp, email, official reply, application, other.
2. Ask for goal and recipient.
3. Generate scaffold.
4. User drafts.
5. App corrects with three levels: meaning, grammar, final polished version.

### GRAMMATIK Journey

Flow:

1. User enters sentence.
2. App identifies one main issue first.
3. Show corrected sentence.
4. Explain rule briefly.
5. Run two micro-drills.
6. Save repeated issue to revision.

### HOEREN Journey

Flow:

1. User types what they heard.
2. App suggests likely German sentence(s).
3. Explain meaning.
4. Ask user to choose the closest match.
5. Later Slice 4/8 may add audio input; do not fake audio controls before real support exists.

### WIEDERHOLEN Journey

Flow:

1. Opens existing revision queue.
2. Keeps existing spaced repetition behavior.
3. Does not show old chat history.

---

## 6. Roadmap Mapping

- Slice 3.14: Problem launcher, compact learning coach, login redirect to `/dashboard`.
- Slice 3.15: Active learning components (`QuickCheck`, `ProductionPrompt`, journey feedback patterns).
- Slice 3.16: Journey shells and first journey screens.
- Later slice: real conversation/thread history and timestamps.

Do not merge thread history/sidebar into Slice 3.14 unless the slice brief is explicitly upgraded.
