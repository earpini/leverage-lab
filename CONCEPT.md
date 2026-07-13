# On the Menu — a middle-power AI war-game

*Working title, from Carney's Davos line the paper quotes: "if we're not at the table, we're on the menu."
Alternatives: "Leverage" · "Outside the Frontier" · "The Accommodation Trap".*

## What this is

A single-page, browser-based strategy game about AI geopolitics, built on two pieces of prior work:

1. **The working paper** — *Leverage outside the chain* (earpini.github.io/brazil-ai-analysis):
   the positional/convertible leverage distinction, the instruments M1–M6, the criteria C1–C7,
   the scenarios (bipolar lock-in, frontier acceleration, multilateral spring), and the
   **accommodation trap** — the balancing loop where a more effective coalition attracts more
   great-power coercion, which peels members off bilaterally.
2. **The country dataset** — `data/countries.json`: 18 middle powers + 2 poles scored 0–3 on
   eight value-chain axes (minerals, equipment, fabrication, compute, capital, models, market,
   governance), with governance maturity, regime type, focus tier and per-country headline
   leverage and caveats.

The game's thesis is the paper's thesis: countries outside the frontier only get a seat at the
table by **converting** what they hold — and pooling it — before the window closes. Playing it
should teach the accommodation trap viscerally: solo deals feel good every turn and lose the game.

## Player fantasy

You are the foreign-policy strategist of one middle power (default: Brazil; any non-pole country
is playable). Over 8 turns (2026–2033) you convert your country's assets into leverage, recruit a
coalition, and try to institutionalise it before the two poles buy your partners out from under you.

## Core loop (one turn)

1. **World phase** — the external dials (X1 rivalry, X2 frontier pace, X3 minerals/energy demand)
   drift on a scenario trajectory; an event fires (tariff threat, export-control wave, datacentre
   offer, licensing conflict, summit).
2. **Pole phase** — the US and China AIs each make one move. Their doctrine is bilateral capture:
   target the coalition member with the highest `defection risk × affinity` and offer it a deal
   it must respond to — and sometimes address the offer to the player directly. This is the
   accommodation trap as an opponent, not a diagram.
3. **Player phase** — spend limited action points on generalised instruments:
   - **Condition** (M1): attach terms to inbound capital → converts `compute/minerals/market`
     axes into leverage, raises C1/C4, small retaliation cost.
   - **Recruit** (M2): bring a country into the coalition; cost scales with tier and regime
     distance; adds its axes to the pool.
   - **Fund the facility** (M3): the anti-defection instrument. Reduces every member's defection
     risk each turn it is funded; expensive up front (Brazil-style seeding), compounds.
   - **Wield rules** (M4): regulatory/judicial strike against a hyperscaler → big one-turn
     leverage, big retaliation draw. Usable, dominated as a posture.
   - **Go it alone** (M5): always available, visibly seductive, mathematically dominated —
     the tutorial should let the player discover this.
   - **Pool the commons** (M6): members contribute compute/data/models capacity → raises C7
     (peer capacity gains), which lowers defection risk structurally (staying pays).
4. **Resolution** — criteria update (C1 leverage, C2 coalition, C3 retaliation exposure,
   C4 dependency, C5 coherence, C6 integrity & public benefit, C7 peer gains); defection checks
   roll against facility funding + C7 + pole pressure.

## Alignment and temptation

Accommodation must be genuinely attractive or the trap teaches nothing. Every country carries a
draft **pole affinity** score (`affinity: {us, cn}` in `data/countries.json`): Brazil and South
Africa pull toward Beijing through BRICS, Australia and Canada toward Washington through the
alliance system, the Gulf states play both. Affinity works three ways:

- **Poles exploit it.** Offers to high-affinity members are cheaper for the pole and harder to
  refuse — the US peels Canada with a continental compute pact; China peels Brazil with a BRICS
  technology bank. Defection checks weight affinity.
- **The player feels it.** Pole offers arrive addressed to *you* too, and they are good: real
  compute access, tariff relief, investment. Taking one is always a legal move.
- **It is pull, not preference.** India shows the difference: institutional pull toward China
  (BRICS/SCO) alongside active rivalry (border, Quad) — see `affinity_note` fields. The engine
  should let pull and trust diverge.

## Endings (a spectrum, not win/lose)

1. **A seat at the table** — pooled coalition leverage crosses the chokepoint threshold (the
   poles' cost of bypassing the coalition exceeds the cost of negotiating with it), C6 unbroken,
   coalition intact. The paper's recommended path, and the hardest.
2. **Balancing broker** — partial coalition, hedged between poles; real but fragile gains.
3. **Junior partner** — you took a pole's offer. Not a fail state: the ending is scored by the
   *terms*, and terms scale with leverage converted **before** signing. This is the game's
   sharpest lesson — even a player who intends to align does better by converting first.
   Alignment with unconverted assets is just delivery.
4. **On the menu** — coalition collapsed to the accommodation trap, or you aligned with nothing
   converted; the poles set your terms.
5. **Crisis endings** — retaliation spiral (C3 maxed) or C6 breach spiral (ILO-169 halt, water
   conflict, benefit-audit scandal). C6 stays a hard bound: leverage bought by breaking it never
   scores above ending 4.

## Design principles

- **Positional vs. convertible is the stat system.** Taiwan/Netherlands/Korea hold positional
  leverage (their axes count at full value immediately, but they are hard to recruit and
  pole-aligned). Anchors (Brazil, India, Indonesia, South Africa) hold convertible leverage:
  axes count only once converted by instruments — the game makes you *do* the conversion.
- **Regime friction is real**: recruiting Tier-D counterparts (UAE, Saudi) adds axes fast and
  quietly corrodes C6/coalition trust — the values trade-off stays on screen, not in a footnote.
- **Honest numbers, visible assumptions**: every coefficient lives in `data/params.json` with a
  comment; a "model" panel shows the causal graph from the paper. The game is an argument, and
  arguments show their work.
- **Deterministic seeds**: shareable runs ("beat my 2033"), reproducible for critique.
- **Short**: a full run in 10–15 minutes; depth from replay across countries and scenarios.

## v1 scope (build first)

Single-player, Brazil only, 8 turns, 3 scenario trajectories, both poles scripted (no ML —
priority tables), ~12 event cards, the six instruments, the seven criteria as a live dashboard,
end-of-run debrief that names what happened in the paper's vocabulary ("you fell to the
accommodation trap on turn 5: no facility, high C1, cohesion decayed").
v2: pick any country. v3: hot-seat multiplayer / classroom mode.

## Data & provenance

`data/countries.json` (2024–26 vintage; refresh before publishing; note Brazil's `key` line
overweights niobium relative to the paper's §2 correction — fix in the game copy).
Facts on Brazil's instruments come from the working paper's references (REDATA, PL 2780, TFFF,
PBIA). In-game event copy must carry the same calibrated register as the paper — no doom, no
cheerleading (see BRAND.md voice rules).

## Stack

Static single-page app, no build step: `index.html` + ES modules (`engine/` pure game logic,
`ui/` DOM), `data/*.json`, BRAND.md tokens in `brand.css`. Deploy on GitHub Pages. Game logic
must be importable and unit-testable in Node without a browser.

## v3 (built): the chain, the wants, the table

The learning objective sharpened to four things: why countries collaborate, how that shapes
national strategy, when to spend leverage negotiating frontier access, and why broader (even
unconventional) coalitions win. v3 reorganises the game around them:

- **Wants.** Every middle power carries 1–2 wants derived from its weakest value-chain links
  (Indonesia: technology access + credible funding; the Netherlands: shared compute). A
  coalition that covers a country's wants is cheaper to join and holds it without fear —
  incentives are the diplomacy, defection risk is just their absence.
- **The chain is the board.** Eight links, mine → machines → chips → compute → money → models →
  markets → rules. Members light links they hold at 2+; the player lights only converted
  strengths. A seat requires covering the scenario's chain target (5/6/7) as well as pooled
  weight — acceleration forces recruiting beyond the anchors, which is the breadth lesson.
- **Go to the table.** When the gates are met, claiming the seat is an explicit move — go early
  and bank it, or hold and risk a defection or the cutoff. Timing leverage is playable, not
  narrated.
- **Cuts.** Courts appear only with a live case; fieldbuilding sits behind "show all moves";
  the dials folded away; the rails show only chain + home tiles + grip (left) and poles +
  allies-with-wants (right).
