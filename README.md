# leverage-lab

A browser war-game about middle-power leverage in the AI order — companion to the working paper
[*Leverage outside the chain*](https://earpini.github.io/brazil-ai-analysis/).

You play a middle power converting what it holds — energy, minerals, markets, courts, diplomacy —
into a seat at the table, while the two AI poles try to buy your coalition partners out from
under you. The core antagonist is the paper's **accommodation trap**.

## Play

Static site, no build step. From GitHub Pages, just open `index.html`'s URL. Locally:

```
python3 -m http.server 8080   # then open http://localhost:8080
```

Safari also opens `index.html` straight from `file://`; Chrome blocks ES modules on `file://`,
hence the one-line server. Seeds travel in the URL (`?seed=…&scenario=…`) — share a run,
replay a run, critique a run.

## Test

```
npm test   # node --test — engine unit tests + the four balance invariants
```

The invariants (see `CLAUDE.md`): M5 (go it alone) is dominated in every scenario; unfunded
coalitions decay; a C6 breach is never a winning line; defecting after conversion always yields
better junior-partner terms than defecting before it.

## Layout

`engine/` pure game logic (no DOM, Node-importable) · `ui/` rendering · `data/` every tunable
number, with rationales in `docs/model-notes.md` · `test/` invariants and unit tests.

Design: `CONCEPT.md` · Conventions: `CLAUDE.md` · Brand: `BRAND.md` · Data: `data/countries.json`

Status: v1 playable — Brazil, 8 turns, 3 scenarios, scripted poles, 12 events, endings 1–5.
