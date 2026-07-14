# CLAUDE.md — Leverage Lab

A browser strategy game about middle-power leverage in the AI order. Read `CONCEPT.md` first — it is
the design contract. Companion to the working paper *Leverage outside the chain*
(github.com/earpini/brazil-ai-analysis); keep the game's vocabulary consistent with the paper's
(positional vs. convertible leverage, accommodation trap, instruments M1–M6, criteria C1–C7).

## Ground rules

- **Brand**: follow `BRAND.md` exactly — its `--ea-*` CSS variables for all colour, type,
  spacing, radius, motion. Do not invent hex values, fonts, or radii. Gold is a spark, never
  body text or links. Sentence case everywhere.
- **Stack**: static site, no build step, no framework. `index.html` + ES modules + JSON data.
  Must run from `file://` and from GitHub Pages. No localStorage dependence for core play.
- **Architecture**: `engine/` is pure logic (no DOM), importable in Node for tests; `ui/`
  renders state and dispatches actions; `data/` holds all tunable numbers. Nothing numeric is
  hard-coded in the engine — every coefficient lives in `data/params.json` with a one-line
  rationale comment in `docs/model-notes.md`.
- **Determinism**: all randomness through one seeded RNG; the seed is in the URL.
- **Tests**: engine unit tests in `test/` runnable with `node --test`. Balance changes must
  keep the invariant tests green (M5 dominated in every scenario; unfunded coalitions decay;
  C6 breach is never a winning line; defecting after conversion always yields better junior-partner
  terms than defecting before it).
- **Voice for game copy**: calm urgency, concrete, no doom performance — the register of the
  paper and of BRAND.md §2. Cite real instruments (REDATA, TFFF, PL 2780) in flavour text where
  true, and keep invented events clearly fictional.
- **Data provenance**: `data/countries.json` carries a `_meta` block — keep it updated when
  scores change; the matrix reference is in `docs/leverage-matrix-reference.html`.

## Author

Ettore Arpini. Byline never "de Lacerda". British spellings in prose (organise, programme),
US spellings acceptable in code identifiers.
