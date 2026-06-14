# Aisling Edits — Changelog & Findings

Customer Inbox Triage — Week 2 Baseline Assessment.

This document records what I found in the existing app, what I changed, and how
I verified it.

---

## 1. Top 3 areas for improvement (findings)

### #1 — Urgency scoring is inverted (`src/utils/urgencyScorer.js`) — **highest business impact**

The original scorer ran backwards relative to what a triage product needs:

| Rule (original) | Effect | Problem |
| --- | --- | --- |
| `!` adds `+30` each | Exclamations raise urgency | Thank-you notes spike to High |
| `len < 50` → `-40`, `len < 20` → `-60` | Short messages lose urgency | Terse emergencies sink to Low |
| Weekend `-20`, after-hours `-15` | Off-hours lowers urgency | 2 a.m. outage downranked |
| (no urgency keywords at all) | Meaning ignored | Severity never actually measured |

Worked examples under the old code:

| Message | Old score | Old label | Correct |
| --- | --- | --- | --- |
| `Database connection lost` | `50 − 40` = 10 | Low | **High** |
| `Server down now` | `50 − 40 − 60` = −50 | Low | **High** |
| `Thank you so much! ... today!` | `50 + 60 − 30` = 80 | High/Med | **Low** |

Why this is #1: Relay AI's value proposition *is* prioritizing and routing.
Inverted urgency means the product actively pushes the worst tickets to the
bottom of the queue — the single most damaging failure mode for the business.

### #2 — Category classification is brittle & nondeterministic (`src/utils/llmHelper.js`)

- Prompt was just `"Categorize this customer support message: <msg>"` — no list
  of allowed categories, no output format, no system role.
- `temperature: 0.7` → the same message could return different categories.
- The category was then picked by **substring-matching the model's prose**
  (`content.toLowerCase().includes('billing')`). If the model wrote "this is
  *not* a billing issue," it still tagged **Billing**. First match in the
  if/else chain won.

### #3 — Wrong action templates + dead escalation (`src/utils/templates.js`)

- `Feature Request → "Ask user to check billing portal."` — copy-paste bug;
  nonsensical recommended action.
- `shouldEscalate()` escalated on `message.length > 100` only — it ignored
  urgency *and* category, and **nothing in the app called it**. Dead code that
  looked like a feature.
- `getRecommendedAction()` accepted an `urgency` argument but never used it
  (and `AnalyzePage` didn't pass one), so recommendations never varied by
  priority.

**Honorable mentions:** silent mock fallback in `llmHelper.js` (API failure
returned a fabricated result presented as real, with no UI warning); the Groq
API key is exposed in the browser (`dangerouslyAllowBrowser: true`); no input
validation beyond an empty-string check; `localStorage` history grows unbounded.

---

## 2. What I changed (this session)

I implemented **all three** improvements. The urgency scorer (#1) is the
flagship change; #2 and #3 followed because they were small and high-value.

### #1 — Urgency scorer rewrite

- **`src/utils/urgencyScorer.js` — full rewrite** using a **policy / mechanism**
  split:
  - `urgencyConfig` = the **policy**: three keyword tiers (`critical +50`,
    `elevated +25`, `calming −30`) plus High/Low score thresholds.
  - `calculateUrgency(message)` = the **mechanism**: lowercases the text, adds
    each tier's weight once if any of its terms appear, maps the total to a
    label. Pure function, same signature/return type as before, so
    `AnalyzePage.jsx` consumed it unchanged.
  - **Removed wall-clock time** from the score — *when* a message arrives is a
    routing/SLA concern, not message severity, and `new Date()` made the
    function non-deterministic and untestable.
  - Scoring is now based on what a message *means*, not its punctuation/length.
- **`src/utils/urgencyScorer.test.js`** — dependency-free Node harness, 12 cases
  covering the exact failures the old scorer produced (terse emergencies → High,
  friendly notes → Low, "something's off" → Medium). Exits non-zero on any fail.
- **`package.json`** — added `"test": "node src/utils/urgencyScorer.test.js"`.

Trade-off recorded: `thresholds.low = 0`, so a message with **no urgency signal
at all defaults to Low**. Risk = a genuinely urgent message that uses none of the
keywords gets buried (false negative). Mitigation: keep the term lists broad, and
note that the constrained LLM classifier (#2) reduces reliance on keyword
matching. A safer-but-noisier alternative is `low = -10` (neutral → Medium, "let
a human look").

### #2 — Constrained LLM classification

- **`src/utils/llmHelper.js` — rewrite of `categorizeMessage`:**
  - Exported `CATEGORIES` enum; system prompt defines the taxonomy and requires
    JSON output (`response_format: { type: 'json_object' }`).
  - `temperature: 0` for determinism.
  - Parses a guaranteed `category` field and **validates it against the enum**
    (out-of-vocabulary → `General Inquiry`) instead of substring-scanning prose.
  - **Honest fallback:** every result now carries `source: 'ai' | 'mock'`. The
    keyword fallback (no key / API error / unparseable response) tags
    `source: 'mock'` and prefixes its reasoning with `[Keyword fallback — AI
    unavailable]`, so a fabricated result can no longer masquerade as real AI.

### #3 — Correct templates + real escalation

- **`src/utils/templates.js`:**
  - Fixed the `Feature Request` action (now: log in product backlog + acknowledge).
  - All actions rewritten to concrete routing steps.
  - `getRecommendedAction(category, urgency)` now **uses** urgency — High-urgency
    tickets get an "Escalate immediately" prefix.
  - `shouldEscalate(category, urgency)` rewritten to key off urgency + category
    (High → escalate; Technical Problem + Medium → escalate) and is now **wired
    into the app**.
- **`src/pages/AnalyzePage.jsx`:**
  - Passes `urgency` to `getRecommendedAction`; computes `shouldEscalate`.
  - Stores `escalate` and `source` on each analysis.
  - Renders an amber banner when `source === 'mock'` and a red "Flagged for
    escalation" banner when `escalate` is true.

---

## 3. Verification

| Check | Command | Result |
| --- | --- | --- |
| Urgency unit tests | `npm test` | **12 / 12 passing** |
| Production build | `npm run build` | **success** (235 modules, no errors) |
| Lint (changed files) | `npx eslint <changed files>` | **clean** |

Note: `npm run lint` across the whole repo still reports pre-existing
`react-hooks/set-state-in-effect` issues in `DashboardPage.jsx` /
`HistoryPage.jsx`. Those predate this work and were left untouched (out of scope).

---

## 4. Still open (next candidates)

- **Security:** the Groq API key is still exposed in the browser
  (`dangerouslyAllowBrowser: true`). Real fix = move LLM calls to a backend
  proxy. Out of scope for a frontend-only assessment but the most important
  production blocker.
- **Pre-existing lint** issues in Dashboard/History (`set-state-in-effect`).
- **Unbounded `localStorage` history** (no cap / dedupe).
- **Input validation** beyond empty-string (min length, max length).
- **Urgency false-negative risk** from `low = 0` (see #1 trade-off).

---

## 5. Delivery

- Committed and pushed to the **fork** (`jp-bmn/l2assessment`, remote
  `github-desktop-jp-bmn`), branch `pr/2`. **Not** pushed to the company
  upstream (`origin` = `jimenezatmit/l2assessment`).
- Date: 2026-06-14.
- Includes `package.json` (`npm test` script) and a `package-lock.json`
  normalization (only `"peer": true` metadata, from `npm install`).
