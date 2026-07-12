// Rendering: state → DOM. No game logic here; reads the engine's snapshot and
// legal actions, dispatches player intents back through the callbacks it is given.

import { snapshot, legalActions, computeTerms, offersOpen, yearOf } from '../engine/game.js';
import { memberContribution } from '../engine/criteria.js';
import { INSTRUMENTS, CRITERIA, DIALS, POLE_NAMES, OFFER_COPY, ENDING_KICKERS, PLAYER_NOTE } from './copy.js';

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function render(root, g, handlers) {
  const snap = snapshot(g);
  const acts = Object.fromEntries(legalActions(g).map((a) => [a.type, a]));
  root.innerHTML = `
    ${turnline(g, snap)}
    <div class="board">
      <section>${worldPanel(g)}${logPanel(g)}</section>
      <section>${playerPanel(g, snap)}${coalitionPanel(g)}${recruitPanel(g, acts)}</section>
      <section>${dashboard(g, snap)}${actionsPanel(g, acts)}</section>
    </div>
    ${offerSheet(g)}
    ${debriefSheet(g, snap)}
  `;
  wire(root, g, handlers);
}

function turnline(g, snap) {
  const total = g.params.game.turns;
  const dots = Array.from({ length: g.params.game.apPerTurn }, (_, i) =>
    `<span class="ap-dot${i < g.ap ? '' : ' spent'}"></span>`).join('');
  return `
    <div class="turnline container">
      <span class="turn">Turn ${g.turn} of ${total} — ${yearOf(g)}</span>
      <span class="ap">Action points ${dots}</span>
      <span class="ap">${esc(g.scenario.name)} · seed ${esc(g.seed)}</span>
    </div>`;
}

function worldPanel(g) {
  const event = g.data.events.events.find((e) => e.id === g.currentEvent);
  return `
    <div class="panel">
      <h2>The world</h2>
      ${DIALS.map((d) => `
        <div class="dial">
          <span class="name"><span>${esc(d.label)}</span><span>${Math.round(g.dials[d.key] * 100)}</span></span>
          <div class="meter${d.warm ? ' warm' : ''}"><i style="width:${g.dials[d.key] * 100}%"></i></div>
        </div>`).join('')}
      ${event ? `
        <div class="event-card" style="margin-top: var(--ea-space-5)">
          <p class="kicker">This year's event</p>
          <h3>${esc(event.name)}</h3>
          <p>${esc(event.copy)}</p>
        </div>` : ''}
    </div>`;
}

function logPanel(g) {
  const recent = g.log.slice(-14).reverse();
  return `
    <div class="panel">
      <h2>The record</h2>
      <ul class="log">
        ${recent.map((l) => `<li><span class="phase">T${l.turn} ${esc(l.phase)}</span>${esc(l.text)}</li>`).join('')}
      </ul>
    </div>`;
}

function playerPanel(g, snap) {
  const player = g.data.byCode[g.player.code];
  const axes = g.params.conversion.axes;
  return `
    <div class="panel">
      <h2>Your hand — ${esc(player.name)}</h2>
      <p class="country keyline">${esc(PLAYER_NOTE)}</p>
      ${axes.map((a) => {
        const pct = Math.round(g.player.converted[a] * 100);
        return `
        <div class="conv">
          <span>${esc(a)} (${player.axes[a]})</span>
          <div class="meter warm"><i style="width:${pct}%"></i></div>
          <span class="pct">${pct}%</span>
        </div>`;
      }).join('')}
      <p class="country keyline">Converted ${snap.convertedPts} of ${snap.convertiblePts} axis points. Unconverted assets are somebody else's opportunity.</p>
    </div>`;
}

function coalitionPanel(g) {
  const members = g.coalition.map((m) => {
    const c = g.data.byCode[m.code];
    const risk = Math.round(Math.min(95, Math.max(5, m.defRisk)));
    const contrib = Math.round(memberContribution(g, m) * 10) / 10;
    return `
      <div class="country">
        <div class="head"><strong>${esc(c.name)}</strong><span class="tag">tier ${esc(c.tier)} · +${contrib} pts</span></div>
        <p class="keyline">${esc(c.key)}</p>
        <div class="risk"><span>defection risk</span><div class="meter"><i style="width:${risk}%"></i></div><span>${risk}</span></div>
      </div>`;
  }).join('');
  const lost = g.lostMembers.map((l) => esc(l.name)).join(', ');
  return `
    <div class="panel">
      <h2>The coalition (${g.coalition.length})</h2>
      ${members || '<p class="country keyline">No members yet. Leverage that stays national stays small.</p>'}
      ${lost ? `<p class="country keyline">Lost to the poles: ${lost}.</p>` : ''}
    </div>`;
}

function recruitPanel(g, acts) {
  if (g.ended) return '';
  const candidates = (acts.m2?.candidates ?? []).slice().sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name));
  return `
    <div class="panel">
      <h2>Recruit (M2)</h2>
      <div class="recruits">
        ${candidates.map((c) => {
          const country = g.data.byCode[c.code];
          const affordable = c.cost <= g.ap;
          return `
          <div class="recruit-row">
            <span><strong>${esc(c.name)}</strong> <span class="meta">tier ${esc(c.tier)} · ${esc(country.democracy.toLowerCase())} · us ${country.affinity.us} / cn ${country.affinity.cn}</span></span>
            <button class="btn-quiet" data-recruit="${esc(c.code)}" ${affordable ? '' : 'disabled'}>${c.cost} ap</button>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

function dashboard(g, snap) {
  const ratio = Math.min(1, snap.pooled / snap.threshold);
  return `
    <div class="panel">
      <h2>The dashboard</h2>
      ${CRITERIA.map((c) => `
        <div class="crit${c.bad ? ' bad' : ''}">
          <span>${esc(c.label)}${c.bad ? ' ↓' : ''}</span>
          <div class="meter"><i style="width:${snap[c.key]}%"></i></div>
          <span class="val">${snap[c.key]}</span>
        </div>`).join('')}
      <div class="gauge">
        <p class="kicker">Pooled leverage vs the chokepoint</p>
        <div class="nums"><span class="pooled">${snap.pooled}</span><span class="of">of ${snap.threshold} points — where bypassing you costs more than negotiating with you</span></div>
        <div class="bar"><i style="width:${ratio * 100}%"></i></div>
        <p class="note">${ratio >= 1 ? 'Past the threshold. Hold it: coalition, cohesion, integrity.' : 'Below the threshold, the poles can route around you.'}</p>
      </div>
    </div>`;
}

function actionsPanel(g, acts) {
  if (g.ended) return '';
  const order = ['m1', 'm3', 'm4', 'm5', 'm6'];
  return `
    <div class="panel">
      <h2>Instruments</h2>
      <div class="actions">
        ${order.map((id) => {
          const a = acts[id];
          if (!a) return '';
          const meta = INSTRUMENTS[id];
          const title = a.reason ? ` title="${esc(a.reason)}"` : '';
          return `
          <button class="btn" data-action="${id}" ${a.enabled ? '' : 'disabled'}${title}>
            ${esc(meta.name)} <span class="tag">${meta.tag}</span><span class="cost">${a.ap} ap</span>
            <span class="blurb">${esc(meta.blurb)}</span>
          </button>`;
        }).join('')}
      </div>
      <button class="btn-primary" data-end-turn>End turn ${g.ap > 0 ? `— ${g.ap} ap unspent` : ''}</button>
    </div>`;
}

function offerSheet(g) {
  if (!offersOpen(g)) return '';
  const offer = g.offers.player;
  const terms = computeTerms(g);
  const cap = g.params.endings.junior.termsCap;
  return `
    <div class="overlay">
      <div class="sheet">
        <p class="kicker">${esc(POLE_NAMES[offer.pole])} addresses you directly</p>
        <h3>An offer you must answer</h3>
        <p class="read">${esc(OFFER_COPY[offer.pole])}</p>
        <div class="terms">Sign now and the run ends as junior partner on terms <strong>${terms}/${cap}</strong>. Terms scale with what you converted before signing — not with how warmly you said yes.</div>
        <div class="row">
          <button class="btn-quiet" data-action="decline">Decline — exposure ticks up</button>
          <button class="btn-primary" data-action="accept">Accept the terms</button>
        </div>
      </div>
    </div>`;
}

function debriefSheet(g, snap) {
  if (!g.ended) return '';
  const e = g.ended;
  const url = shareUrl(g);
  return `
    <div class="overlay">
      <div class="sheet">
        <p class="kicker">${esc(ENDING_KICKERS[e.id] ?? 'Ending')}</p>
        <h3>${esc(e.title)}</h3>
        <p class="score">${e.score}/100</p>
        <ul class="debrief-lines">
          ${e.lines.map((l) => `<li>${esc(l)}</li>`).join('')}
          <li>Final position: pooled ${snap.pooled} of ${snap.threshold} points, ${snap.members} member${snap.members === 1 ? '' : 's'}, C6 at ${snap.c6}.</li>
        </ul>
        <p class="seedlink">Beat this 2033: <a href="${esc(url)}">${esc(url)}</a></p>
        <div class="row" style="margin-top: var(--ea-space-4)">
          <button class="btn-quiet" data-new-seed>New seed</button>
          <button class="btn-primary" data-replay>Replay this seed</button>
        </div>
      </div>
    </div>`;
}

function shareUrl(g) {
  const base = location.origin === 'null' || location.protocol === 'file:'
    ? location.pathname.split('/').pop()
    : location.pathname;
  return `${base}?seed=${encodeURIComponent(g.seed)}&scenario=${encodeURIComponent(g.scenarioId)}`;
}

function wire(root, g, handlers) {
  for (const btn of root.querySelectorAll('[data-action]')) {
    btn.addEventListener('click', () => handlers.onAction({ type: btn.dataset.action }));
  }
  for (const btn of root.querySelectorAll('[data-recruit]')) {
    btn.addEventListener('click', () => handlers.onAction({ type: 'm2', code: btn.dataset.recruit }));
  }
  root.querySelector('[data-end-turn]')?.addEventListener('click', handlers.onEndTurn);
  root.querySelector('[data-replay]')?.addEventListener('click', handlers.onReplay);
  root.querySelector('[data-new-seed]')?.addEventListener('click', handlers.onNewSeed);
}
