# ItsDrDan Question Bank

One shared place for the questions and reference tables used across Dr. Dan's chemistry study games,
so a game can borrow questions from another game, and a new game's questions show up everywhere they fit.

Live at **https://itsdrdan.github.io/questionbank/** (once GitHub Pages is turned on).

## What's in here

| Path | What it is |
|---|---|
| `bank/*.json` | Questions, one file per topic (or per course for Final Boss), all in the same format (below). |
| `data/*.json` | Shared reference tables: elements (names, Yellow Sheet masses, IE, EA, electronegativity), Green Sheet polyatomic ions, OpenStax ΔHf° values, activity series, the 123 Med Molecules, sugars. |
| `index.json` | Counts of questions per bank, per skill, and per chapter. Built automatically. |
| `skills.json` | **The skill map.** Every mode in every game, with its courses and study-hub chapter ids (`3A-10`, `1A-4`, `1B-ready`, `3B-9`…). Edit by hand when a game gains a mode. |
| `qb.js` | The loader games use to read the bank. |
| `tools/build.js` | Copies question lists out of the games into `bank/` and `data/`. |

Chapter ids match the study hub's course map (`games/data/hub.js`).

## Question format

```json
{
  "id": "redox-3fa2c1d0",
  "skill": "redox.activity-series",
  "courses": ["3A", "1A"],
  "chapters": ["3A-10", "1A-4"],
  "type": "mc",
  "prompt": "Will this reaction occur? Zn(s) + Cu²⁺(aq) → ?",
  "choices": ["Yes", "No"],
  "answer": "Yes",
  "hint": "…",
  "explain": "…",
  "origin": "original",
  "from": { "game": "redox", "list": "activityQuestions", "index": 0 }
}
```

- `why` (optional, `mc` only): one short reason per choice, in the same order as `choices` (`""` for the right answer). Games show it when a student picks that wrong choice and in a "Why the other choices are wrong" list. `QB.why(q, choice)` returns it.
- `type`: `mc`, `number` (optional `unit`, `tolerance`), `text` (optional `accept` list). Any game can show these.
  Game-specific types (`oxidation-chart`, `redox-balance`, `redox-identify`, `quantum-orbital`, …) carry their raw `data`
  and are shown by the game that owns them, or by a game that learns that type.
- `id` stays the same as long as the question's wording and answer don't change, so stats can follow a question across games.
- `origin`: `original` (written by Dr. Dan) or `openstax`.

## Using it in a game

```html
<script src="https://itsdrdan.github.io/questionbank/qb.js"></script>
<script>
  // 10 CHEM 3A Chapter 10 questions any game can show, not counting this game's own
  QB.get({ course: '3A', chapters: ['3A-10'], types: ['mc', 'number'], game: 'reactions', n: 10 })
    .then(items => { /* show them; QB.check(item, studentAnswer) grades mc/number/text */ });
  QB.data('polyatomic-ions').then(t => console.log(t.ions));
</script>
```

For Canvas embeds and downloaded copies, a game can also carry a snapshot as `window.QB_FALLBACK`,
so it still works when the bank can't be reached.

## Practice questions sampled from the games

Most games make their questions with code. `tools/samplers/<game>.js` runs a game's own question makers with a fixed
random seed and saves the results as `bank/<game>-practice.json` (so the same questions come out every night unless
the game changes, and question ids stay stable for stats). Every sampled answer is graded correct by the game's own
checker before it is saved. Text answers that are formulas or symbols are graded case-sensitively (`caseSensitive`),
and number answers with `sigfigs` must be typed with that many significant figures.

Sampled so far: sig figs, metric, elements, polyatomic ions, naming & formulas (real ions and real covalent compounds only),
moles, stoichiometry, gas laws, thermochemistry (Hess's law from OpenStax only).

To check one sampler: `node tools/sample.js <game>`.

## Keeping it up to date

`tools/build.js` runs every night (and any time you press **Run workflow** on the Actions tab).
It opens each game, copies its question lists, and saves any changes here. So, for now:
**edit questions in the game, and the bank follows.**

To add a new game's questions: add a block for it in `tools/build.js`, add its modes to `skills.json`,
and add its repo name to `.github/workflows/build.yml`.

## What is deliberately left out

The bank is public. Anything that follows a publisher test bank, an ACS exam, or Dr. Dan's own quizzes,
skill checks or exams stays out of it, even if a game uses it. Right now that means:
Quantum Quest items tagged `tro` or `acs`, and Bridge to 1B's Tro-aligned `BRIDGE_CONCEPTS`.
Skill Check questions are never copied into games; the Quantum Quest items that followed Skill Check 7 were rewritten (Nov 2026).
Lists still waiting for a source check (Reaction Rumble's true/false Blitz, the worksheet Hess's law set, Lewis items citing
textbook problem numbers) are also not included yet.

Final Boss (`finalexam`) is connected: `bank/final-exam-{3a,3b,1a,1b}.json` hold its standardized-final-style
multiple choice (original items; `made` says how each was written: `original`, `drawn`, `study-guide` or `video`).
Items Final Boss modeled on Dr. Dan's Canvas quizzes (`src: canvas-quiz` in the game) are skipped.
Items with structures or figures are type `finalboss-mc` (raw drawing data in `data`, original HTML in `html`);
Final Boss's renderer draws them, and so does Exam Practice in Organic Origins, Bond Voyage! and Sweet Structures.
