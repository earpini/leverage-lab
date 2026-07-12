// Every player-facing string in the UI. Plain language, zero assumed context.
// One rule: if a ten-year-old couldn't follow it, rewrite it.

export const INSTRUMENTS = {
  m1: {
    name: 'Set conditions',
    verb: 'Set conditions on Big Tech',
    blurb: 'Tech giants want Brazil’s clean energy, minerals and market. Say yes — with strings attached.',
    effect: 'More bargaining power and independence. A little more heat.'
  },
  m2: {
    name: 'Invite an ally',
    verb: 'Invite a country',
    blurb: 'Grow the alliance. Faraway or authoritarian countries cost 2 moves.',
    effect: 'Their strengths add to your side of the scale.'
  },
  m3: {
    name: 'Fund the alliance',
    verb: 'Fund the alliance',
    blurb: 'Put real money into the shared fund. Allies stay when staying pays. Costs double the first year, compounds every year after.',
    effect: 'Every ally’s risk of leaving goes down.'
  },
  m4: {
    name: 'Take them to court',
    verb: 'Take a tech giant to court',
    blurb: 'Your courts and regulators go after a tech giant. A big, loud win that fades fast.',
    effect: 'A spike of bargaining power now. A lot more heat.'
  },
  m5: {
    name: 'Cut a solo deal',
    verb: 'Cut a solo deal',
    blurb: 'Grab a quick win for Brazil alone. Always available. Feels great this year.',
    effect: 'A little power now. Your allies trust you less.'
  },
  m6: {
    name: 'Share technology',
    verb: 'Share technology',
    blurb: 'Pool computing power, data and AI know-how with your allies so everyone levels up.',
    effect: 'Allies gain capability, and leaving gets less tempting.'
  }
};

export const CRITERIA = [
  { key: 'c1', label: 'Bargaining power', bad: false, hint: 'What Brazil’s assets are worth in a negotiation. Grow it by setting conditions on Big Tech.' },
  { key: 'c2', label: 'Alliance strength', bad: false, hint: 'Trust plus members. Falls when allies leave or you cut solo deals.' },
  { key: 'c3', label: 'Heat', bad: true, hint: 'How angry the superpowers are at you. At 90+ they crush you and the game ends. Cools a little each year.' },
  { key: 'c4', label: 'Independence', bad: false, hint: 'How freely you can say no. Fades every year unless you keep setting terms.' },
  { key: 'c5', label: 'Consistency', bad: false, hint: 'Whether your policy holds a steady line. Zig-zagging makes allies doubt your word.' },
  { key: 'c6', label: 'Public trust', bad: false, hint: 'Communities, courts, promises kept. If it falls below 30, you lose — no exceptions.' },
  { key: 'c7', label: 'Allies’ capability', bad: false, hint: 'How much your allies gain by staying. Raise it by sharing technology.' }
];

export const DIALS = [
  { key: 'rivalry', label: 'US–China tension', warm: true, hint: 'Higher tension means sweeter superpower offers to your allies.' },
  { key: 'pace', label: 'AI speed', warm: false, hint: 'The faster AI advances, the less the superpowers need everyone else — the bar for a seat rises.' },
  { key: 'demand', label: 'Minerals & energy demand', warm: false, hint: 'When the world is hungry for what Brazil has, the bar for a seat drops.' }
];

export const POLE_NAMES = { us: 'Washington', cn: 'Beijing' };

export const OFFER_COPY = {
  us: 'The United States puts a deal on the table: access to top-end computing power, tariff relief, real investment. Take it and the game ends — Brazil becomes a junior partner of the US.',
  cn: 'China puts a deal on the table: cheap computing power, generous financing, market access. Take it and the game ends — Brazil becomes a junior partner of China.'
};

export const ENDINGS = {
  seat: { kicker: 'The best ending', sub: 'The superpowers now have to negotiate with your alliance. You got the seat.' },
  broker: { kicker: 'A good ending', sub: 'No seat, but real cards in hand. Brazil ends 2033 as a player, not a prize.' },
  'junior-partner': { kicker: 'You took the deal', sub: 'The score is the terms — and the terms are whatever you built before signing.' },
  menu: { kicker: 'The ending the game is named after', sub: '“If you’re not at the table, you’re on the menu.” The superpowers set your terms.' },
  'integrity-spiral': { kicker: 'Game over — trust collapsed', sub: 'You lost the public, and with them, everything.' },
  'retaliation-spiral': { kicker: 'Game over — crushed', sub: 'The superpowers turned the full pressure on, and Brazil stood alone.' }
};

export const PLAYER_NOTE =
  'What Brazil holds: clean energy that data centres crave, critical minerals, and 215 million people online. None of it counts until you set terms on it.';

/** Plain names for the eight value-chain axes. */
export const AXIS_NAMES = {
  minerals: 'critical minerals',
  equip: 'chip-making tools',
  fab: 'chip factories',
  compute: 'data centres & energy',
  capital: 'investment money',
  models: 'AI labs & talent',
  market: 'a big market',
  gov_conv: 'diplomatic weight'
};

export const CONVERT_AXIS_LABELS = {
  minerals: 'Minerals',
  compute: 'Energy & data centres',
  market: 'Market'
};

/** What a country brings, from its two strongest axes. */
export function countryGloss(country) {
  const entries = Object.entries(country.axes).sort((a, b) => b[1] - a[1]).slice(0, 2).filter(([, v]) => v >= 2);
  if (entries.length === 0) return 'a bit of everything';
  return entries.map(([k]) => AXIS_NAMES[k]).join(', ');
}

export function leanGloss(affinity) {
  if (affinity.us > affinity.cn) return 'leans US';
  if (affinity.cn > affinity.us) return 'leans China';
  if (affinity.us > 0) return 'plays both sides';
  return 'non-aligned';
}

export function riskLabel(defRisk) {
  if (defRisk < 35) return 'settled';
  if (defRisk < 55) return 'restless';
  if (defRisk < 75) return 'tempted';
  return 'one foot out the door';
}

export const COACH_TIPS = {
  1: 'First year: the alliance fund costs both moves to start, and it is what stops allies being bought off later. Or start converting — Set conditions pays most early. Your call.',
  2: 'Watch each ally’s “risk of leaving”. Superpower offers push it up every year; the alliance fund pushes it down.',
  3: 'Your goal bar only moves when you set conditions at home, add allies, or share technology. Solo deals never move it.'
};

export const INTRO = {
  title: 'On the menu',
  kicker: 'How to play — 1 minute',
  sections: [
    {
      h: 'The setup',
      p: 'It is 2026. Two superpowers — the US and China — control advanced AI. Every other country faces a choice: take whatever deal it is offered, or team up with others and bargain. A diplomat once put it bluntly: “If you’re not at the table, you’re on the menu.”'
    },
    {
      h: 'Your job',
      p: 'You run Brazil’s AI strategy for 8 years. Each year you get 2 moves: set conditions on Big Tech, invite allies, fund the alliance, go to court, cut solo deals, or share technology.'
    },
    {
      h: 'How you win',
      p: 'Push the gold bar past the line: make your alliance so valuable the superpowers must negotiate with it. Meanwhile they will try to buy your allies out, one by one — and sometimes they will offer YOU a deal. You can take it and end the game. The terms depend entirely on what you built first.'
    },
    {
      h: 'Two ways to lose instantly',
      p: 'Let public trust collapse (broken promises to your own people), or draw so much superpower heat they crush you.'
    }
  ],
  start: 'Start playing',
  reopen: 'How to play'
};
