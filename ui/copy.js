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

/** M6 deepens each time you use it. */
export const M6_TIERS = [
  { name: 'Pool computing power', blurb: 'Start where it hurts least: shared capacity, shared data. Everyone levels up a little.' },
  { name: 'Open a joint lab', blurb: 'Shared training runs, shared people. The alliance starts building what none of its members could alone.' },
  { name: 'Share frontier models', blurb: 'The deepest tier: the alliance runs its own models. Staying stops being loyalty and becomes self-interest.' }
];

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
  seat: { kicker: 'The best ending', sub: 'The superpowers now have to negotiate with your alliance — frontier AI on your terms, an economy that rides the wave instead of watching it.' },
  broker: { kicker: 'A good ending', sub: 'No seat, but real cards in hand. You end 2033 as a player, not a prize.' },
  'junior-partner': { kicker: 'You took the deal', sub: 'The score is the terms — and the terms are whatever you built before signing.' },
  menu: { kicker: 'The ending the game is named after', sub: '“If you’re not at the table, you’re on the menu.” The superpowers set your terms.' },
  'integrity-spiral': { kicker: 'Game over — trust collapsed', sub: 'You lost the public, and with them, everything.' },
  'retaliation-spiral': { kicker: 'Game over — crushed', sub: 'The superpowers turned the full pressure on, and Brazil stood alone.' }
};

/** One-line hooks: why you'd play each country. Plain, concrete, twelve words max. */
export const COUNTRY_HOOKS = {
  BR: 'Clean energy, minerals, a huge market — all still unclaimed.',
  IN: 'A billion-person market and the world’s deepest AI talent pool.',
  ID: 'The nickel the hardware needs, and 285 million people.',
  ZA: 'The platinum in tomorrow’s chips, and Africa’s AI voice.',
  TW: 'You make the chips everyone needs. Everyone knows it.',
  NL: 'One company, one machine, and the whole industry waits on you.',
  KR: 'The memory chips AI runs on are yours.',
  JP: 'Tools, materials, diplomacy — quiet power in every corner.',
  DE: 'The lasers and lenses inside every chip machine.',
  FR: 'Europe’s AI lab, running on nuclear power.',
  GB: 'The chip designs in every phone, and world-class AI talent.',
  CA: 'Elite AI research right next door to Washington.',
  AU: 'The rare minerals China doesn’t control.',
  NO: 'A two-trillion-dollar fund and cheap hydropower.',
  SG: 'The trusted middleman, with a trillion-dollar wallet.',
  IL: 'Chip design and AI talent, packed dense.',
  AE: 'Money, energy, and both superpowers on speed dial.',
  SA: 'Oil money buying a place in the AI age.'
};

/** Per-country hook for "Set conditions": the real lever, in one line. */
export const M1_HOOKS = {
  BR: 'Brazil wrote REDATA for exactly this: terms attached to every megawatt.',
  NL: 'Every ASML export licence is a term sheet waiting to be written.',
  TW: 'Fab allocation is policy. You decide whose chips get made first.',
  KR: 'HBM supply contracts are leverage — price them like it.',
  JP: 'Wafers, photoresist and tools leave Japan on your paperwork.',
  DE: 'No Zeiss optics, no chip machines. Put terms on the crown jewels.',
  FR: 'Nuclear-powered computing is scarce. Auction it with strings.',
  GB: 'Arm licences and elite labs — charge admission in commitments.',
  CA: 'Hydro-powered computing and world-class talent: access is conditional.',
  AU: 'Heavy rare earths leave the ground on your terms, or not at all.',
  NO: 'Your fund owns a slice of every AI giant. Vote the shares.',
  SG: 'Sovereign money and the region’s data-centre hub: terms attached.',
  IL: 'The chip-design centres stay because you let them. Price it.',
  IN: 'A billion-person market and its payment rails: entry has conditions.',
  ID: 'Nickel export permits are a policy instrument. Use them.',
  ZA: 'Platinum exports and a continent’s AI voice: set the terms.',
  AE: 'They want your energy and your capital. Both come with strings now.',
  SA: 'PIF money talks. Make it negotiate too.'
};

/** Per-country legal lever for "Take them to court". */
export const M4_INSTRUMENTS = {
  BR: 'PL 2780 gives your courts the docket.',
  NL: 'The EU AI Act and DMA give your regulators teeth.',
  DE: 'The EU AI Act and DMA give your regulators teeth.',
  FR: 'The EU AI Act and DMA give your regulators teeth.',
  GB: 'The CMA and your courts have jurisdiction the giants respect.',
  KR: 'The AI Basic Act is in force — use it.',
  JP: 'Your regulators move quietly and land hard.',
  IN: 'Your courts and competition authority have humbled Big Tech before.',
  AU: 'You made Big Tech pay for news once. Bigger stakes this time.',
  CA: 'Privacy and competition law, wielded together.'
};
const M4_DEFAULT = 'Your courts and regulators go after a tech giant.';

/** What "going it alone" concretely means, given who keeps calling. */
function soloLine(affinity) {
  if (affinity.us > affinity.cn) return 'Washington’s offer is always on the table.';
  if (affinity.cn > affinity.us) return 'Beijing’s financing is always on offer.';
  return 'Both superpowers keep bidding for you.';
}

/** Move cards in the player country's own language. */
export function instrumentCopy(country, convertAxes, positional) {
  const assets = convertAxes.map((a) => AXIS_BARE[a] ?? a);
  const list = assets.length > 1
    ? assets.slice(0, -1).join(', ') + ' and ' + assets[assets.length - 1]
    : assets[0];
  return {
    ...INSTRUMENTS,
    m1: {
      ...INSTRUMENTS.m1,
      blurb: `Tech giants want your ${list}. Say yes — with strings attached. ${M1_HOOKS[country.code] ?? ''}`.trim()
        + (positional ? ' Your strongest card already counts; conditions deepen the rest.' : '')
    },
    m4: {
      ...INSTRUMENTS.m4,
      blurb: `${M4_INSTRUMENTS[country.code] ?? M4_DEFAULT} A big, loud win that fades fast.`
    },
    m5: {
      ...INSTRUMENTS.m5,
      blurb: `${soloLine(country.affinity)} Take the quick win, alone. Feels great this year.`
    }
  };
}

export function playerNote(country, positional) {
  const holds = countryGloss(country);
  return positional
    ? `What ${country.name} holds: ${holds}. Your strongest card already counts — the game is staying your own while everyone pulls at you.`
    : `What ${country.name} holds: ${holds}. None of it counts until you set terms on it.`;
}

export const PICKER = {
  kicker: 'Pick your country',
  title: 'Who do you want to be?',
  note: 'Every one of these countries holds something the AI world needs. The question the game asks: can they turn it into a say over their own future? New here? Brazil is the classic first game.',
  positionalBadge: 'counts from day one',
  firstGame: 'good first game',
  potential: 'potential'
};

export const OUTCOME_TILES = [
  { key: 'people', label: 'People', hint: 'Quality of life and having a say: public trust, steady policy, independence.' },
  { key: 'economy', label: 'Economy', hint: 'Thriving as AI advances: bargaining power, alliance strength, allies’ capability.' },
  { key: 'nature', label: 'Nature & climate', hint: 'What the AI build-out does to water, land and grids. Conditions on Big Tech protect it; unchecked booms drain it.' }
];

export function outcomeWord(v) {
  if (v >= 70) return 'thriving';
  if (v >= 45) return 'holding';
  if (v >= 30) return 'strained';
  return 'failing';
}

export const FRONTIER_LABEL = 'Frontier AI access';

export const LATECOMER = {
  toggleFounder: 'Found your own alliance',
  toggleFounderSub: 'The classic game: start alone, build the pool.',
  toggleLate: 'Earn your way in',
  toggleLateSub: 'An alliance already exists — without you. Convert your assets to qualify.',
  alliesTitle: (n) => `The alliance (${n}) — you're not in it`,
  alliesNote: 'They pool their assets without you. Yours count for nothing here until you join.',
  joinTitle: 'Join the alliance',
  joinBlurb: 'They want proof you bring something to the pool: converted leverage, not promises. Set conditions at home until you qualify.',
  joinButton: 'Ask to join',
  joinProgress: (have, need) => `Your converted leverage: ${have} of ${need} needed`,
  coachTip: 'You start outside the alliance. Set conditions (your top move) until your converted leverage reaches the entry bar — then join, and their pool becomes yours too.'
};

export const GRIP = {
  label: 'Superpower grip on AI',
  hint: 'How locked-up AI power is. It tightens every year — faster when AI races ahead, when allies defect, and when you cut solo deals. A strong alliance loosens it. At the red line, the cutoff comes: frontier models stop at the superpowers’ borders.',
  cutoffNote: (year) => `The cutoff happened in ${year}. Frontier models now stop at the superpowers’ borders — your economy runs on what your alliance built.`,
  nearNote: 'The grip is close to the red line. When it gets there, the cutoff comes — and only a strong alliance softens it.'
};

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

/** Article-free axis names, for building sentences ("your X, Y and Z"). */
export const AXIS_BARE = {
  minerals: 'critical minerals',
  equip: 'chip-making tools',
  fab: 'chip factories',
  compute: 'data centres & energy',
  capital: 'investment capital',
  models: 'AI labs & talent',
  market: 'market access',
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

export const GOV_NAMES = ['nascent governance', 'developing governance', 'solid governance', 'strong governance'];

export const REGIME_NAMES = {
  Full: 'full democracy',
  Flawed: 'flawed democracy',
  Hybrid: 'hybrid regime',
  Authoritarian: 'authoritarian'
};

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
      p: 'You pick a country and run its AI strategy for 8 years. Each year you get 2 moves: set conditions on Big Tech, invite allies, fund the alliance, go to court, cut solo deals, or share technology.'
    },
    {
      h: 'How you win',
      p: 'Push the gold bar past the line: make your alliance so valuable the superpowers must negotiate with it. That is what buys your people access to frontier AI — and a thriving economy as AI advances. Meanwhile the superpowers will try to buy your allies out, one by one, and sometimes they will offer YOU a deal. You can take it and end the game. The terms depend entirely on what you built first.'
    },
    {
      h: 'The clock you are racing',
      p: 'Every year the superpowers’ grip on AI tightens. If it reaches the red line, the cutoff comes: frontier models stop at their borders, and everyone outside takes the hit — hardest wherever the alliance is weakest. Also, two ways to lose instantly: let public trust collapse, or draw so much superpower heat they crush you.'
    }
  ],
  start: 'Choose your country',
  reopen: 'How to play'
};
