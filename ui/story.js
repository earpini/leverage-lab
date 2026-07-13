// The epilogue: what happens to your country in the decade after the game ends.
// Built from the actual final state — ending, outcomes, alliance, environment —
// so the same ending reads differently depending on how you got there.
// The threads are the PESTLE areas; the register is a story, not a report.

import { snapshot } from '../engine/game.js';

const POLE = { us: 'Washington', cn: 'Beijing' };

/** 3–4 short paragraphs: the country's 2034–2040, in plain words. */
export function epilogue(g) {
  const snap = snapshot(g);
  const name = g.data.byCode[g.player.code].name;
  const paras = [];

  paras.push(opening(g, snap, name));
  paras.push(economyThread(g, snap, name));
  paras.push(peopleThread(g, snap, name));
  const env = natureThread(g, snap, name);
  if (env) paras.push(env);

  return paras;
}

function opening(g, snap, name) {
  const e = g.ended;
  switch (e.id) {
    case 'seat': {
      return `2034. When the superpowers convene the talks that will set the rules for advanced AI, ${name} is in the room — not as a guest, but as the convener of the bloc they could not route around. The alliance's pooled computing and shared models mean its members negotiate access; they no longer apply for it.`;
    }
    case 'broker': {
      return `2034. ${name} ends the decade as the country both superpowers call first — and neither fully trusts. The alliance you built is real enough to matter and loose enough to wobble; every summit begins with someone asking whether it will still exist next year. It is not a seat at the table. It is a chair pulled up close, and it has to be re-earned every season.`;
    }
    case 'junior-partner': {
      const pole = POLE[e.pole];
      const good = e.terms >= 24;
      return good
        ? `2034. The agreement with ${pole} holds, and it holds because you signed it standing up. The terms you converted before signing — the conditions on data centres, the local-benefit clauses, the technology access written into annexes — turn a dependency into a partnership with teeth. ${name}'s diplomats spend the decade enforcing fine print, and mostly winning.`
        : `2034. The agreement with ${pole} is signed with fanfare and read, later, with regret. ${name} got access — real access — but on terms set almost entirely by the other side, because there was little on your side of the ledger when the pens came out. Within three years the annexes are being renegotiated, and it is not ${name} asking for the meetings.`;
    }
    case 'menu': {
      return `2034. Nobody cut ${name} off. Nothing so dramatic. The superpowers simply set the prices, the standards, and the queue — and ${name} waits in it. The assets are all still there: the energy, the minerals, the market. They just belong, functionally, to whoever writes the terms. The diplomats' phrase for the decade is "constructive engagement". The domestic phrase is shorter.`;
    }
    case 'integrity-spiral': {
      return `2033 does not end quietly for ${name}. The halted projects, the drained reservoirs, the audits with no good answers — they add up to a government that lost its own people before it lost any negotiation. Whatever leverage existed on paper, no minister can spend it: every deal now dies at home first. The next administration campaigns on one word — trust — and inherits a decade of rebuilding it.`;
    }
    case 'retaliation-spiral': {
      return `2033 ends with ${name} in the superpowers' crosshairs and nobody at its side. The courtroom victories were real; each one was also a reason for the next round of tariffs, licence denials and quiet blacklists. Alone, there was no pool to absorb the pressure. The strategy the next government adopts is the one word yours refused: patience.`;
    }
    default:
      return `2034. The decade turns, and ${name} adjusts.`;
  }
}

function economyThread(g, snap, name) {
  const cutoffBit = g.cutoff
    ? (snap.frontier.level === 'secured'
      ? ' When the cutoff came, the alliance\'s own computing and models kept the lights on — the year everyone else scrambled is remembered, inside the bloc, with something like pride.'
      : ' The cutoff is the scar across every chart: the year frontier models stopped at the superpowers\' borders, and everything from drug discovery to logistics at home ran on last year\'s intelligence, at last year\'s prices, indefinitely.')
    : '';
  if (snap.economy >= 70) {
    return `The economy rides the wave instead of watching it (economy ${snap.economy}, frontier access: ${snap.frontier.label}). AI shows up in ${name}'s hospitals, farms and factories on terms that keep part of the value at home; the data centres pay for grids and jobs, not just land.${cutoffBit}`;
  }
  if (snap.economy >= 45) {
    return `The economy neither booms nor breaks (economy ${snap.economy}, frontier access: ${snap.frontier.label}). AI arrives — it arrives everywhere — but the margins accrue elsewhere, and every productivity gain comes with a licence fee attached. Growth is real; so is the feeling of renting the future rather than owning any of it.${cutoffBit}`;
  }
  return `The economic decade is unforgiving (economy ${snap.economy}, frontier access: ${snap.frontier.label}). As advanced AI reshapes every industry, ${name} competes with tools a generation behind, priced by others. The talented leave first; the capital follows them.${cutoffBit}`;
}

function peopleThread(g, snap, name) {
  const social = snap.people >= 70
    ? `Daily life holds together (people ${snap.people}). Public services absorb the technology without losing the public: consultation happened, benefits landed where they were promised, and when people are angry at the government it is about ordinary things, which is its own kind of victory.`
    : snap.people >= 45
      ? `For most people the decade is ambivalent (people ${snap.people}). The technology helps and unsettles in roughly equal measure; the promises were half kept. Politics stays noisy — the word "sovereignty" appears in every manifesto, meaning something different in each.`
      : `At street level the decade feels like something done to people, not with them (people ${snap.people}). Broken consultations and captured benefits hollow out consent; every new data centre is a protest, every algorithm in a public service a scandal. Governments change; the grievance stays.`;
  const legal = g.govLevel >= 3
    ? ` The one durable asset: institutions. The regulators, courts and civil-society field built in the late 2020s keep functioning regardless of who governs — terms get enforced, cases get heard.`
    : g.govLevel <= 1
      ? ` The institutional gap costs quietly and constantly: rules exist on paper, but the people to enforce them were never trained in enough numbers, so enforcement is an event rather than a habit.`
      : '';
  return social + legal;
}

function natureThread(g, snap, name) {
  if (snap.nature >= 60) {
    return `And the land holds (nature ${snap.nature}). The build-out paid its way — water accounted for, grids expanded before the load arrived, mining bound to restoration clauses. It is the least-noticed achievement of the era, which is what environmental success looks like.`;
  }
  if (snap.nature >= 35) {
    return `The environmental ledger is strained (nature ${snap.nature}): reservoirs run lower, grids run hotter, and the mining regions carry more of the era's weight than they were promised. Manageable — but each year the word "manageable" is doing more work.`;
  }
  return `The environment carries the era's real bill (nature ${snap.nature}). Water conflicts move from news item to fact of life; the grid is a permanent emergency; the extraction regions are sacrifice zones in all but name. Whatever the geopolitics achieved, the climate maths of the AI decade was never made to add up — and it lands on the people least consulted about any of it.`;
}
