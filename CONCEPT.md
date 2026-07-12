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
   target the coalition member with the highest `defection risk` and offer it a deal it must
   respond to. This is the accommodation trap as an opponent, not a diagram.
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

## Win / lose

- **Win ("a seat at the table")**: by 2033, pooled coalition leverage crosses the chokepoint
  threshold — the point where the poles' cost of bypassing the coalition exceeds the cost of
  negotiating with it — with C6 unbroken and ≥ N of your recruits still in.
- **Lose**: coalition collapse (accommodation trap), retaliation crisis (C3 maxed), or a C6
  breach spiral (licence crises: ILO-169 halt, water conflict, benefit-audit scandal). C6 is a
  hard bound, exactly as in the paper — leverage bought by breaking it is a loss, not a win.

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
