# Model notes

Every coefficient in `data/params.json`, `data/scenarios.json` and `data/events.json`, with a
one-line rationale. The game is an argument; this file is where the argument shows its work.
Vocabulary follows the working paper *Leverage outside the chain*: positional vs. convertible
leverage, instruments M1–M6, criteria C1–C7, the accommodation trap.

## Units and scales

- **Criteria C1–C7** run 0–100. C1 (leverage) and C2 (coalition) are derived each render;
  C3–C7 are stocks that actions and events move.
- **Axis points** are the currency of the pool: a country's eight value-chain axes (0–3 each)
  sum to its raw points. Brazil's convertible axes (minerals 2, compute 2, market 3) give the
  player at most 7 points of own conversion.
- **Dials** X1 rivalry, X2 frontier pace, X3 minerals/energy demand run 0–1.

## game

| param | value | rationale |
|---|---|---|
| `turns` | 8 | 2026–2033, one year per turn, per CONCEPT.md. |
| `apPerTurn` | 2 | Two moves a year forces the M1-vs-M3-vs-M2 triage the paper says real ministries face. |
| `playerCode` | BR | v1 is Brazil-only. |

## criteriaStart / criteria

| param | value | rationale |
|---|---|---|
| `criteriaStart.c3` | 10 | Brazil starts mostly under the radar; the 2025 tariff shock is priced into affinity, not exposure. |
| `criteriaStart.c4` | 25 | Baseline dependency on pole compute/capital is high; 25 = low autonomy. |
| `criteriaStart.c5` | 60 | Policy coherence is a strength on paper (PBIA, PL 2780) but not unassailable. |
| `criteriaStart.c6` | 70 | Integrity starts healthy; the game erodes it, never gifts it. |
| `criteriaStart.c7` | 10 | Peer capacity gains barely exist before M6 is played. |
| `c1Base` | 8 | Unconverted assets still buy a little attention — but only a little (the paper's core claim). |
| `c1PerConvertedPoint` | 4.5 | Full own-conversion (7 pts) yields ~32 C1: meaningful, never sufficient alone — pooling is required. |
| `c1SpikeFactor` | 4.5 | Temporary spikes (M4, courts) read on the same scale as converted stock. |
| `c2TrustWeight` / `c2PerMember` / `c2DefRiskWeight` | 0.55 / 7 / 0.15 | Cohesion is mostly trust, then breadth; visible defection risk discounts it. |
| `c3DecayPerTurn` | 2 | Retaliation attention fades if you stop provoking — slowly. |
| `c4DecayPerTurn` | 1 | Dependency creeps back when conditioning stops; autonomy is maintenance, not a purchase. |
| `c7DecayPerTurn` | 0.5 | Peer capability rots slower than attention but still rots (frontier moves). |
| `c5IncoherenceThreshold` / `c5IncoherenceTrustCost` | 40 / 2 | An incoherent principal bleeds coalition trust — partners can't price your promises. |
| `c6BreachLine` | 30 | Below this, integrity failure is structural, not reputational: crisis ending. |
| `c3SpiralLine` | 90 | Sustained maximal provocation triggers the retaliation spiral ending. |
| `tierDC6CostPerTurn` | 1.5 | Each Tier-D member corrodes integrity every turn — the values trade-off stays on screen. |
| `tierDC5CostPerTurn` | 1 | Mixed-regime coalitions are also harder to keep coherent. |

## trust

| param | value | rationale |
|---|---|---|
| `start` | 40 | Goodwill without track record. |
| `fundedGain` | 3 | A funded facility is credible commitment — trust compounds with the streak. |
| `unfundedDecay` | 4 | **The accommodation trap's fuel**: unfunded coalitions decay by construction (invariant test 2). |
| `defectionCost` | 8 | Each defection makes the next one easier. |
| `recruitGain` | 2 | Momentum from a new signature. |

## conversion (any-country play)

| param | value | rationale |
|---|---|---|
| `topAxes` | 3 | A country converts its signature strengths — its three strongest axes. For Brazil this reproduces the original minerals/compute/market set exactly, so balance is unchanged. |
| `positionalPreconverted` | 1 | Positional countries (TW/NL/KR) sit on a bottleneck already: their top axis counts from day one — that is what positional means. |
| `positionalStartHeat` | 8 | Sitting on a chokepoint means the poles already watch you: positional players start with extra heat. |

## outcomes (people, economy, nature — the point of the whole exercise)

Each country starts from a real-world baseline (`baseline` in `countries.json`: quality of
life, prosperity, environmental health — author judgment informed by HDI, GDP per capita and
EPI). The game moves outcomes from there, anchored so turn 1 ≈ today: people = baseline +
0.45·ΔC6 + 0.20·ΔC5 + 0.20·ΔC4; economy = baseline + 0.30·ΔC1 + 20·(pool/threshold) + 0.25·ΔC7
— all minus grip and cutoff penalties. Nature is a stock initialised from the baseline: it
drifts down by 0.5 + 1.5·demand (+ grip pressure) each year, recovers +2 per M1 (conditions
include environmental and local-benefit terms), and moves with events. Below 25 it costs 2 C6
a year — degraded nature erodes public trust.
The hero's balance-of-power bars use pole power = axes-sum × (0.8 + 0.6·concentration/100):
the poles' raw strengths, amplified as their grip tightens, in the same units as the pool.
Frontier access is a label, not a number: secured (pool ≥ threshold), partial (≥ 0.6), precarious,
or "on their terms" after signing with a pole. PESTLE areas map onto the inputs (political C5,
economic C1/C4, social C6, technological C7, legal M4, environmental nature); the three tiles are
what those areas add up to for the people who live there.

## concentration (the grip and the cutoff)

| param | value | rationale |
|---|---|---|
| `start` | 50 | The poles already hold half the board in 2026. |
| `growthBase` + `pace·4` | 3.5 | Concentration is the default trajectory: doing nothing loses ground, faster when the frontier races. |
| `ratioRelief` / `c7Relief` | 8 / 0.06 | The only counterweights are a real pool and real peer capability — the alliance is the brake, and it must visibly out-brake the drift or building one wouldn't pay. |
| `defectionBoost` / `soloBoost` | 4 / 1.5 | Every ally bought and every solo deal routes more of the world through a pole's stack. |
| `cutoffLine` | 82 | Past this, exclusion is cheaper than engagement: the cutoff fires (once, deterministically). |
| protection = 0.6·ratio + 0.4·(C7/100) | — | Pooled leverage and pooled capability are what soften the shock; severity = (conc/100)·(1−protection). |
| `cutoffC7Loss` / `cutoffC6Loss` | 8 / 4 | The flow of models and compute stops; the public asks how you let it happen. |
| `cutoffEconomyHit` / `cutoffPeopleHit` | 30 / 15 | ×severity, permanent: getting cut off unprepared is the worst economic event in the game. |
| `gripEconomyPenalty` / `gripPeoplePenalty` / band 40 | 20 / 10 | Even before the cutoff, concentrated power quietly taxes everyone outside it (pricing, standards, dependence) — a tax, not a guillotine; the guillotine is the cutoff. |
| `gripNaturePressure` | 1.2 | An unchecked race burns land, water and grids faster — nobody makes it pay its way. |
| `juniorTermsPenalty` | 0.3 | The more dominant the poles, the less they need you: terms shrink up to 30% as concentration maxes. |

Because concentration rises over time for the unprepared, a late cutoff is automatically a
harder cutoff — the "later and weaker means worse" rule holds by construction, and invariant
test 5 (`test/invariants.test.js`) checks it.

## pool / chokepoint

| param | value | rationale |
|---|---|---|
| `memberFactor` | 0.45 | Anchor members' axes count under half until pooling deepens — convertible leverage must be converted. |
| `positionalFactor` | 1.0 | Taiwan/Netherlands/Korea count at full value immediately — that is what positional means. |
| `m6FactorBonus` / cap | 0.04 / 0.20 | Each pooling round deepens integration; cap keeps anchors below positional value. |
| `chokepointBase` (per scenario) | 24 / 28 / 20 | Bypass cost the coalition must beat; acceleration raises it (frontier outruns you), spring lowers it. |
| `paceWeight` / `demandWeight` | 8 / −4 | Faster frontier → easier to bypass you; hot minerals demand → harder to bypass you. |
| `floor` | 12 | The poles never negotiate for free. |

## instruments

| param | value | rationale |
|---|---|---|
| `m1.convertShare` | 0.25 | Conditioning converts a quarter of the remaining unconverted stock — early moves pay most; the window closes. |
| `m1.c4` / `m1.c3` | 6 / 3 | Terms attached to capital buy autonomy and draw modest retaliation. |
| `m2.apSurcharge` rules | +1 for tier C/D, regime distance ≥ 2, or positional | Distance is expensive: values friction and pole alignment both raise the price of a signature. |
| `m2.defRisk*` | 22 + 7·affinity − 4·anchor + 6·positional | Arrivals are loyal in proportion to how little the poles pull on them. |
| `m3.apFirst` / `ap` | 2 / 1 | Brazil-style seeding is expensive up front, cheaper to sustain — and it compounds. |
| `m3.reliefBase` / `reliefPerStreak` | 6 / 1.2 | The anti-defection instrument: relief grows with the funding streak (credibility compounds). |
| `m3.unfundedDefRiskDrift` | 3 | Skip a year and every member drifts toward the exits. |
| `m4.spikePoints` / `spikeDecay` / `c3` | 2.5 / 0.5 / 12 | A regulatory strike is real one-turn leverage with a long retaliation tail — usable, dominated as a posture. |
| `m5.c1Flat` / `diminish` | 3 / 0.8 | Going alone feels good now, converts nothing, and pays less each time (invariant test 1: dominated). |
| `m5.trustCost` / `c5Cost` | 3 / 2 | Solo deals tell your partners what your signature is worth. |
| `m6.c7Gain` / `diminish` | 7 / 0.85 | Pooled compute/data/models raise peer capacity with diminishing returns. |
| `m6.structuralRelief` | 3 | C7 lowers defection risk structurally — staying pays, permanently. |

## poles / defection

| param | value | rationale |
|---|---|---|
| `pressureBase` + `rivalry·6` + `pooled·0.18` | — | **The accommodation trap as an opponent**: the more effective the coalition, the harder the poles pull at it. |
| `courtTurns` us [3,6], cn [2,5,7] | — | Scripted priority tables, no ML; China courts Brazil earlier and more often (affinity 2 vs 1). |
| `declineC3Cost` | 2 | Saying no to a pole is never free. |
| `rollLine` / `chancePerPoint` / `chanceCap` | 55 / 2.2 / 85 | Members below 55 risk never roll — well-tended coalitions are safe; neglected ones face compounding odds. |
| `affinityWeight` / `rivalryWeight` | 3 / 8 | Defection checks weight affinity (per CONCEPT.md) and the world's temperature. |
| `c7Relief` / `fundedRelief` | 0.25 / 6 | Both anti-defection channels, structural (M6) and financial (M3), read here. |

## endings

| param | value | rationale |
|---|---|---|
| `seat.base` 75, gates members ≥ 3, C2 ≥ 50, C6 ≥ 45 | — | The paper's recommended path and the hardest: pooled leverage past the chokepoint with integrity intact. |
| `broker.base` 45, ratio ≥ 0.6 | — | Real but fragile gains from partial pooling. |
| `junior.base` 25 + terms ≤ 40 | terms = 0.22·C1 + 0.18·C4 + 0.08·C2 at signing | The sharpest lesson: junior-partner terms scale with what you converted **before** signing (invariant test 4). |
| `menu.base` 10 | — | The poles set your terms. |
| `integritySpiral.score` 8, `retaliationSpiral.score` 9 | — | Both strictly below any menu score (≥ 10): C6 breach is never a winning line (invariant test 3). |

## scenarios

Dial starts and drifts encode the paper's three trajectories: bipolar lock-in (rivalry ratchets
+0.05/turn), frontier acceleration (pace +0.06/turn and the highest chokepoint), multilateral
spring (rivalry eases, trust decays at 0.7×, the cheapest chokepoint). Spring is easier to
organise in; nothing about it converts your assets for you.

## events DSL

Effect keys: `c3 c4 c5 c6 c7` (criteria stock deltas), `c1Flat` (permanent flat C1),
`trust`, `rivalry pace demand` (dial deltas), `defRiskAll` (all members),
`memberPressure {pole, amount}` (members with affinity ≥ 1 for that pole), `tempSpike`
(axis-points, decays like M4), `m1Boost` (adds to convertShare this turn), `recruitDiscount`
(AP off recruiting this turn, min 1), `offerPlayer` ("us"/"cn" — a pole addresses you directly).
Conditional blocks: `ifFacilityFunded`, `ifTierD`, `ifConvertedMinerals` (≥ 50% of the minerals
axis converted) — each replaces or adds to the base effects as noted in `events.json`.

## Known simplifications (v1)

Poles are priority tables, not learners. Events apply effects without player choices inside the
card. Only the top defection channels are modelled (no exchange-rate or election shocks). The
niobium overweight in Brazil's `key` line is corrected in game copy, per `countries.json` `_meta`.

## latecomer variant

An alliance of three (India, Indonesia, South Africa — substitutes fill in if you play one of
them) exists at game start, and you are not in it. Outside, you can only convert at home, go to
court, or cut solo deals; their pool counts against the poles' concentration but gives you no
access (economy ratio = 0) and almost no cutoff protection (×0.2). The club funds its own
facility every other year — solvent, not solid. The door opens at `entryBar` = 4 converted
points (about three focused years for Brazil; joining costs 1 move). Once inside, your
conversion pools, all instruments unlock, and the funding burden becomes shared — i.e. yours.
If every founder defects before you join, the club dissolves and you are a founder again.
The lesson runs the other way here: leverage is the ticket in, not the prize.
