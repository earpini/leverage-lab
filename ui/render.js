// Rendering: state → DOM. No game logic here. Reads the engine's snapshot and
// legal actions; dispatches player intents back through the handlers it is given.

import { snapshot, legalActions, computeTerms, offersOpen, yearOf } from '../engine/game.js';
import { memberContribution } from '../engine/criteria.js';
import { playerConvertAxes } from '../engine/state.js';
import {
  INSTRUMENTS, CRITERIA, DIALS, POLE_NAMES, OFFER_COPY, ENDINGS,
  AXIS_NAMES, countryGloss, leanGloss, riskLabel, COACH_TIPS, INTRO,
  COUNTRY_HOOKS, playerNote, PICKER, OUTCOME_TILES, outcomeWord, FRONTIER_LABEL, REGIME_NAMES, GRIP, LATECOMER,
  instrumentCopy, M6_TIERS
} from './copy.js';
import { isOutside } from '../engine/game.js';

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function render(root, g, handlers, ui = {}) {
  const snap = snapshot(g);
  const acts = Object.fromEntries(legalActions(g).map((a) => [a.type, a]));
  root.innerHTML = `
    ${hero(g, snap, ui)}
    <div class="container">
      ${coachTip(g, ui)}
      <div class="board">
        <section>
          <p class="zone-label">What's happening</p>
          ${thisYearPanel(g)}${storyPanel(g)}
        </section>
        <section>
          <p class="zone-label">Where you stand</p>
          ${playerPanel(g, snap)}${alliesPanel(g)}${standingPanel(g, snap)}
        </section>
        <section class="control-zone">
          <p class="zone-label">What you can do</p>
          ${joinPanel(g, acts)}${movesPanel(g, acts)}${invitePanel(g, acts)}
        </section>
      </div>
    </div>
    ${ui.summary && !g.ended ? summarySheet(g, ui.summary) : ''}
    ${offerSheet(g)}
    ${debriefSheet(g, snap)}
    ${ui.showPicker && !ui.showIntro ? pickerSheet(g, ui) : ''}
    ${ui.showIntro ? introSheet(ui) : ''}
  `;
  wire(root, handlers);
}

/* ---------- hero: the goal, always visible ---------- */

function hero(g, snap, ui) {
  const total = g.params.game.turns;
  const startYear = g.params.game.startYear;
  const ratio = Math.min(1, snap.pooled / snap.threshold);
  const years = Array.from({ length: total }, (_, i) => {
    const cls = i + 1 === g.turn ? 'now' : i + 1 < g.turn ? 'past' : '';
    return `<span class="year-chip ${cls}">${startYear + i}</span>`;
  }).join('');
  const pips = Array.from({ length: g.params.game.apPerTurn }, (_, i) =>
    `<span class="ap-dot${i < g.ap ? '' : ' spent'}"></span>`).join('');
  return `
    <div class="hero">
      <div class="container">
        <div class="hero-top">
          <div class="years">${years}</div>
          <div class="hero-meta">
            <span>Moves left this year ${pips}</span>
            <button class="btn-ghost" data-help>${esc(INTRO.reopen)}</button>
          </div>
        </div>
        <div class="hero-grid">
          <div>
            <p class="hero-kicker">Your goal — push the gold bar past the line</p>
            <div class="nums">
              <span class="pooled">${snap.pooled}</span>
              <span class="of">your alliance's bargaining power · <strong>${snap.threshold} needed</strong> for a seat at the table</span>
            </div>
            <div class="bar"><i style="width:${ratio * 100}%"></i></div>
            <p class="hero-note">${ratio >= 1
              ? 'You are past the line. Now hold it until 2033: keep your allies in and public trust up.'
              : 'Below the line, the superpowers can ignore your alliance. Grow the bar: set conditions at home, add allies, share technology.'}</p>
            ${gripBar(g, snap)}
          </div>
          ${powersPanel(g, snap)}
        </div>
        <div class="outcomes">
          ${OUTCOME_TILES.map((t) => {
            const v = snap[t.key];
            return `
            <div class="outcome" title="${esc(t.hint)}">
              <span class="o-label">${esc(t.label)}</span>
              <span class="o-val">${v}</span>
              <div class="o-meter"><i style="width:${v}%"></i></div>
              <span class="o-word">${esc(outcomeWord(v))}</span>
            </div>`;
          }).join('')}
          <div class="outcome frontier" title="The point of all of this: does your country get to use the most advanced AI, on liveable terms?">
            <span class="o-label">${esc(FRONTIER_LABEL)}</span>
            <span class="o-frontier">${esc(snap.frontier.label)}</span>
          </div>
        </div>
      </div>
    </div>`;
}

function powersPanel(g, snap) {
  const player = g.data.byCode[g.player.code];
  const rows = [
    { label: 'United States', value: snap.powers.us, cls: 'pole' },
    { label: 'China', value: snap.powers.cn, cls: 'pole' },
    { label: `Your alliance (${snap.members + 1} countr${snap.members === 0 ? 'y' : 'ies'})`, value: snap.powers.alliance, cls: 'alliance' },
    { label: `${player.name} alone`, value: snap.powers.me, cls: 'me' }
  ];
  const max = Math.max(...rows.map((r) => r.value), 1);
  return `
    <div class="powers" title="Same units as the goal bar. Every ally you add moves your alliance's bar up — alone, nobody gets close.">
      <p class="hero-kicker">The balance of power</p>
      ${rows.map((r) => `
        <div class="power-row">
          <span class="p-label">${esc(r.label)}</span>
          <div class="p-bar"><i class="${r.cls}" style="width:${(r.value / max) * 100}%"></i></div>
          <span class="p-val">${r.value}</span>
        </div>`).join('')}
      <p class="hero-note" style="margin-top: var(--ea-space-2)">${snap.members > 0
        ? 'Every ally adds to your side of the scale.'
        : 'Alone, nobody gets close. Allies are the only way up.'}</p>
    </div>`;
}

function gripBar(g, snap) {
  const k = g.params.concentration;
  const pct = snap.concentration;
  const linePct = k.cutoffLine;
  const near = !snap.cutoff && pct >= linePct - 10;
  const note = snap.cutoff
    ? GRIP.cutoffNote(snap.cutoff.year)
    : near ? GRIP.nearNote : null;
  return `
    <div class="grip" title="${esc(GRIP.hint)}">
      <div class="grip-head">
        <span class="hero-kicker" style="margin:0">${esc(GRIP.label)}</span>
        <span class="grip-val${snap.cutoff || near ? ' hot' : ''}">${snap.cutoff ? 'the cutoff has happened' : pct}</span>
      </div>
      <div class="grip-bar">
        <i style="width:${pct}%"></i>
        <span class="grip-line" style="left:${linePct}%"></span>
      </div>
      ${note ? `<p class="hero-note">${esc(note)}</p>` : ''}
    </div>`;
}

function coachTip(g, ui) {
  if (g.ended || ui.tipsDismissed) return '';
  const tip = isOutside(g) && g.turn <= 2 ? LATECOMER.coachTip : COACH_TIPS[g.turn];
  if (!tip) return '';
  return `
    <div class="tip">
      <span>${esc(tip)}</span>
      <button class="btn-ghost dark" data-dismiss-tips>Hide tips</button>
    </div>`;
}

/* ---------- column 1: what happened ---------- */

function thisYearPanel(g) {
  const event = g.data.events.events.find((e) => e.id === g.currentEvent);
  const dispatches = g.log.filter((l) => l.turn === g.turn && l.phase === 'poles');
  return `
    <div class="panel">
      <h2>This year — ${yearOf(g)}</h2>
      ${DIALS.map((d) => `
        <div class="dial" title="${esc(d.hint)}">
          <span class="name"><span>${esc(d.label)}</span><span>${Math.round(g.dials[d.key] * 100)}</span></span>
          <div class="meter${d.warm ? ' warm' : ''}"><i style="width:${g.dials[d.key] * 100}%"></i></div>
        </div>`).join('')}
      ${event ? `
        <div class="event-card">
          <p class="kicker">In the news</p>
          <h3>${esc(event.name)}</h3>
          <p>${esc(event.copy)}</p>
          ${g.pendingEvent ? `
            <p class="event-question">${esc(event.question ?? 'Your call.')}</p>
            <div class="event-choices">
              <button class="btn-quiet" data-choice="a">${esc(event.choices.a.label)}</button>
              <button class="btn-quiet" data-choice="b">${esc(event.choices.b.label)}</button>
            </div>
            <p class="keyline muted">Deciding costs no moves — but not deciding is a decision: the year ends on the second option.</p>`
          : g.lastChoice && g.lastChoice.eventId === event.id
            ? `<p class="event-question">You chose: ${esc(g.lastChoice.label.toLowerCase())}.</p>`
            : ''}
        </div>` : ''}
      ${dispatches.map((l) => {
        const who = l.text.startsWith('Washington') ? 'Washington' : l.text.startsWith('Beijing') ? 'Beijing' : 'The superpowers';
        return `
        <div class="dispatch">
          <p class="kicker">${who} moves</p>
          <p>${esc(l.text)}</p>
        </div>`;
      }).join('')}
    </div>`;
}

function standingPanel(g, snap) {
  return `
    <div class="panel">
      <h2>How you're doing</h2>
      <p class="hintline">Hover any bar for what it means.</p>
      ${CRITERIA.map((c) => `
        <div class="crit${c.bad ? ' bad' : ''}" title="${esc(c.hint)}">
          <span>${esc(c.label)}${c.bad ? ' <small>(keep low)</small>' : ''}</span>
          <div class="meter"><i style="width:${snap[c.key]}%"></i></div>
          <span class="val">${snap[c.key]}</span>
        </div>`).join('')}
    </div>`;
}

/* ---------- column 2: your alliance ---------- */

function playerPanel(g, snap) {
  const player = g.data.byCode[g.player.code];
  return `
    <div class="panel">
      <h2>${esc(player.name)} — what you hold</h2>
      <p class="keyline">${esc(playerNote(player, g.player.positional))}</p>
      ${g.player.convertAxes.map((a) => {
        const pct = Math.round(g.player.converted[a] * 100);
        const label = AXIS_NAMES[a] ?? a;
        return `
        <div class="conv" title="Set conditions (your move #1) to raise this. Assets only count once terms are set on them.">
          <span>${esc(label[0].toUpperCase() + label.slice(1))} (${player.axes[a]})</span>
          <div class="meter warm"><i style="width:${pct}%"></i></div>
          <span class="pct">${pct}%</span>
        </div>`;
      }).join('')}
      <p class="keyline muted">Terms set on ${snap.convertedPts} of ${snap.convertiblePts} possible points so far.</p>
    </div>`;
}

function alliesPanel(g) {
  const members = g.coalition.map((m) => {
    const c = g.data.byCode[m.code];
    const risk = Math.round(Math.min(95, Math.max(5, m.defRisk)));
    const contrib = Math.round(memberContribution(g, m) * 10) / 10;
    const tierD = c.tier === 'D' ? '<p class="keyline warn">Authoritarian ally: adds power fast, costs public trust every year.</p>' : '';
    return `
      <div class="country">
        <div class="head"><strong>${esc(c.name)}</strong><span class="tag">${esc(leanGloss(c.affinity))} · adds ${contrib} to your bar</span></div>
        <p class="keyline">Brings ${esc(countryGloss(c))}.</p>
        ${tierD}
        <div class="risk" title="Superpower offers push this up every year. The alliance fund and shared technology pull it down.">
          <span>risk of leaving</span><div class="meter"><i style="width:${risk}%"></i></div><span class="risk-word">${esc(riskLabel(m.defRisk))}</span>
        </div>
      </div>`;
  }).join('');
  const lost = g.lostMembers.map((l) => `${esc(l.name)} (to ${l.pole === 'us' ? 'the US' : 'China'})`).join(', ');
  const outside = isOutside(g);
  return `
    <div class="panel">
      <h2>${outside ? esc(LATECOMER.alliesTitle(g.coalition.length)) : `Your allies (${g.coalition.length})`}</h2>
      ${outside ? `<p class="keyline warn">${esc(LATECOMER.alliesNote)}</p>` : ''}
      ${members || '<p class="keyline">Nobody yet. No country crosses the line alone — invite allies below.</p>'}
      ${lost ? `<p class="keyline muted">Left the alliance: ${lost}.</p>` : ''}
    </div>`;
}

function joinPanel(g, acts) {
  if (g.ended || !acts.join) return '';
  const a = acts.join;
  const pct = Math.min(100, (a.progress.converted / a.progress.bar) * 100);
  return `
    <div class="panel">
      <h2>${esc(LATECOMER.joinTitle)}</h2>
      <p class="hintline">${esc(LATECOMER.joinBlurb)}</p>
      <div class="conv" title="Set conditions to raise this.">
        <span>${esc(LATECOMER.joinProgress(a.progress.converted, a.progress.bar))}</span>
        <div class="meter warm"><i style="width:${pct}%"></i></div>
        <span class="pct">${Math.round(pct)}%</span>
      </div>
      <button class="btn-primary" data-action="join" ${a.enabled ? '' : 'disabled'} ${a.reason ? `title="${esc(a.reason)}"` : ''}>${esc(LATECOMER.joinButton)} (${a.ap} move)</button>
    </div>`;
}

function invitePanel(g, acts) {
  if (g.ended || isOutside(g)) return '';
  const candidates = (acts.m2?.candidates ?? []).slice().sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name));
  const discount = g.turnMods.recruitDiscount > 0 ? '<p class="keyline">The summit made this cheaper this year.</p>' : '';
  return `
    <div class="panel">
      <h2>Invite an ally</h2>
      <p class="hintline">${esc(INSTRUMENTS.m2.blurb)}</p>
      ${discount}
      <div class="recruits">
        ${candidates.map((c) => {
          const country = g.data.byCode[c.code];
          const affordable = c.cost <= g.ap;
          const dWarn = country.tier === 'D' ? ' · costs public trust yearly' : '';
          return `
          <div class="recruit-row">
            <span><strong>${esc(c.name)}</strong><span class="meta"> — ${esc(countryGloss(country))} · ${esc(leanGloss(country.affinity))}${dWarn}</span></span>
            <button class="btn-quiet" data-recruit="${esc(c.code)}" ${affordable ? '' : 'disabled'}>invite · ${c.cost} move${c.cost > 1 ? 's' : ''}</button>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

/* ---------- column 3: your moves ---------- */

function movesPanel(g, acts) {
  if (g.ended) return '';
  const order = ['m1', 'm3', 'm6', 'm4', 'm5'];
  const boosted = g.turnMods.m1Boost > 0;
  const copy = instrumentCopy(g.data.byCode[g.player.code], g.player.convertAxes, g.player.positional);
  return `
    <div class="panel">
      <h2>Your moves — ${g.ap} left</h2>
      <div class="actions">
        ${order.map((id) => {
          const a = acts[id];
          if (!a) return '';
          let meta = copy[id];
          if (id === 'm6') {
            const tier = M6_TIERS[Math.min(g.m6Uses, M6_TIERS.length - 1)];
            meta = { ...meta, name: tier.name, blurb: tier.blurb };
          }
          let badge = id === 'm1' && boosted ? '<span class="badge">extra strong this year</span>' : '';
          if (id === 'm4' && a.enabled && g.legalOpening > 0) badge = `<span class="badge">live case: ${g.legalOpening} year${g.legalOpening > 1 ? 's' : ''}</span>`;
          if (id === 'm6' && g.m6Uses > 0) badge = `<span class="badge cool">tier ${Math.min(g.m6Uses + 1, M6_TIERS.length)}</span>`;
          return `
          <button class="btn action-card" data-action="${id}" ${a.enabled ? '' : 'disabled'} ${a.reason ? `title="${esc(a.reason)}"` : ''}>
            <span class="action-head">${esc(meta.name)} ${badge}<span class="cost">${a.ap} move${a.ap > 1 ? 's' : ''}</span></span>
            <span class="blurb">${esc(meta.blurb)}</span>
            <span class="effect">${esc(meta.effect)}</span>
          </button>`;
        }).join('')}
      </div>
      <button class="btn-primary" data-end-turn>End the year${g.ap > 0 ? ` (${g.ap} move${g.ap > 1 ? 's' : ''} unused)` : ''}</button>
    </div>`;
}

function storyPanel(g) {
  const recent = g.log.slice(-30).reverse();
  return `
    <details class="panel story">
      <summary>The story so far</summary>
      <ul class="log">
        ${recent.map((l) => `<li><span class="phase">${g.params.game.startYear + l.turn - 1}</span>${esc(l.text)}</li>`).join('')}
      </ul>
    </details>`;
}

/* ---------- sheets ---------- */

function summarySheet(g, summary) {
  if (summary.length === 0) return '';
  return `
    <div class="overlay">
      <div class="sheet">
        <p class="kicker">While the year turned</p>
        <h3>What just happened</h3>
        <ul class="debrief-lines">
          ${summary.map((l) => `<li>${esc(l.text)}</li>`).join('')}
        </ul>
        <button class="btn-primary" data-continue>On to ${yearOf(g)}</button>
      </div>
    </div>`;
}

function offerSheet(g) {
  if (!offersOpen(g)) return '';
  const offer = g.offers.player;
  const terms = computeTerms(g);
  const cap = g.params.endings.junior.termsCap;
  const score = g.params.endings.junior.base + terms;
  return `
    <div class="overlay">
      <div class="sheet">
        <p class="kicker">A message from ${esc(POLE_NAMES[offer.pole])}</p>
        <h3>They want a deal — with you</h3>
        <p class="read">${esc(OFFER_COPY[offer.pole])}</p>
        <div class="terms">Sign now and your final score is <strong>${score}/100</strong> (terms ${terms}/${cap}). The terms grow with what you build <em>before</em> signing — nothing you promise after counts.</div>
        <div class="row">
          <button class="btn-quiet" data-action="decline">Say no (a little more heat)</button>
          <button class="btn-primary" data-action="accept">Sign the deal</button>
        </div>
      </div>
    </div>`;
}

function debriefSheet(g, snap) {
  if (!g.ended) return '';
  const e = g.ended;
  const meta = ENDINGS[e.id] ?? { kicker: 'The end', sub: '' };
  const url = shareUrl(g);
  return `
    <div class="overlay">
      <div class="sheet">
        <p class="kicker">${esc(meta.kicker)}</p>
        <h3>${esc(e.title)}</h3>
        <p class="score">${e.score}/100</p>
        <p class="read">${esc(meta.sub)}</p>
        <ul class="debrief-lines">
          ${e.lines.map((l) => `<li>${esc(l)}</li>`).join('')}
          <li>Where you ended: bar at ${snap.pooled} of ${snap.threshold} needed · ${snap.members} all${snap.members === 1 ? 'y' : 'ies'} · public trust ${snap.c6}.</li>
        </ul>
        <p class="seedlink">Challenge a friend — same game, same events: <a href="${esc(url)}">${esc(url)}</a></p>
        <p class="seedlink">Something felt wrong, unclear, or great? <a href="https://www.admonymous.co/arpini" target="_blank" rel="noopener">Tell me anonymously</a>.</p>
        <div class="row" style="margin-top: var(--ea-space-4)">
          <button class="btn-quiet" data-new-seed>New game</button>
          <button class="btn-primary" data-replay>Replay this one</button>
        </div>
      </div>
    </div>`;
}

function pickerSheet(g, ui) {
  const variant = ui.variant ?? 'founder';
  const cards = g.data.countries.countries
    .filter((c) => c.tier !== 'X')
    .map((c) => ({
      c,
      potential: playerConvertAxes(g.params, c).reduce((a, k) => a + c.axes[k], 0),
      positional: g.params.pool.positionalCountries.includes(c.code)
    }))
    .sort((a, b) => (a.c.code === 'BR' ? -1 : b.c.code === 'BR' ? 1 : b.potential - a.potential));
  return `
    <div class="overlay">
      <div class="sheet wide">
        <p class="kicker">${esc(PICKER.kicker)}</p>
        <h3>${esc(PICKER.title)}</h3>
        <p class="read small" style="margin-bottom: var(--ea-space-5)">${esc(PICKER.note)}</p>
        <div class="variant-toggle">
          <button class="variant${variant === 'founder' ? ' selected' : ''}" data-variant="founder">
            <strong>${esc(LATECOMER.toggleFounder)}</strong><span>${esc(LATECOMER.toggleFounderSub)}</span>
          </button>
          <button class="variant${variant === 'latecomer' ? ' selected' : ''}" data-variant="latecomer">
            <strong>${esc(LATECOMER.toggleLate)}</strong><span>${esc(LATECOMER.toggleLateSub)}</span>
          </button>
        </div>
        <div class="picker-grid">
          ${cards.map(({ c, potential, positional }) => `
            <button class="pick-card" data-pick="${esc(c.code)}">
              <span class="pick-head">${esc(c.name)}
                ${c.code === 'BR' ? `<span class="badge">${esc(PICKER.firstGame)}</span>` : ''}
                ${positional ? `<span class="badge cool">${esc(PICKER.positionalBadge)}</span>` : ''}
              </span>
              <span class="pick-hook">${esc(COUNTRY_HOOKS[c.code] ?? '')}</span>
              <span class="pick-meta">${esc(REGIME_NAMES[c.democracy] ?? c.democracy)} · ${esc(leanGloss(c.affinity))} · ${esc(PICKER.potential)} ${potential} pts</span>
            </button>`).join('')}
        </div>
      </div>
    </div>`;
}

function introSheet(ui) {
  const label = ui.introMode === 'help' ? 'Back to the game' : INTRO.start;
  return `
    <div class="overlay">
      <div class="sheet">
        <p class="kicker">${esc(INTRO.kicker)}</p>
        <h3>${esc(INTRO.title)}</h3>
        ${INTRO.sections.map((s) => `
          <div class="intro-block">
            <h4>${esc(s.h)}</h4>
            <p class="read small">${esc(s.p)}</p>
          </div>`).join('')}
        <button class="btn-primary" data-start>${esc(label)}</button>
      </div>
    </div>`;
}

function shareUrl(g) {
  const base = location.origin === 'null' || location.protocol === 'file:'
    ? location.pathname.split('/').pop()
    : location.pathname;
  const variant = g.club ? '&start=latecomer' : '';
  return `${base}?seed=${encodeURIComponent(g.seed)}&scenario=${encodeURIComponent(g.scenarioId)}&country=${encodeURIComponent(g.player.code)}${variant}`;
}

/* ---------- wiring ---------- */

function wire(root, handlers) {
  for (const btn of root.querySelectorAll('[data-action]')) {
    btn.addEventListener('click', () => handlers.onAction({ type: btn.dataset.action }));
  }
  for (const btn of root.querySelectorAll('[data-recruit]')) {
    btn.addEventListener('click', () => handlers.onAction({ type: 'm2', code: btn.dataset.recruit }));
  }
  for (const btn of root.querySelectorAll('[data-pick]')) {
    btn.addEventListener('click', () => handlers.onPick(btn.dataset.pick));
  }
  for (const btn of root.querySelectorAll('[data-variant]')) {
    btn.addEventListener('click', () => handlers.onVariant(btn.dataset.variant));
  }
  for (const btn of root.querySelectorAll('[data-choice]')) {
    btn.addEventListener('click', () => handlers.onAction({ type: 'event', choice: btn.dataset.choice }));
  }
  root.querySelector('[data-end-turn]')?.addEventListener('click', handlers.onEndTurn);
  root.querySelector('[data-replay]')?.addEventListener('click', handlers.onReplay);
  root.querySelector('[data-new-seed]')?.addEventListener('click', handlers.onNewSeed);
  root.querySelector('[data-help]')?.addEventListener('click', handlers.onHelp);
  root.querySelector('[data-start]')?.addEventListener('click', handlers.onCloseIntro);
  root.querySelector('[data-continue]')?.addEventListener('click', handlers.onContinue);
  root.querySelector('[data-dismiss-tips]')?.addEventListener('click', handlers.onDismissTips);
}
