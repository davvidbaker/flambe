import type { Activity } from '../types/Activity';
import type { Category } from '../types/Category';
import type { EntityId } from '../types/ids';
import type { Thread } from '../types/Thread';
import type { EventPhase, TraceEvent } from '../types/TraceEvent';
import type { AppChartFixture } from './fixtureTrace';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

const categories: Category[] = [
  { id: 1, name: 'question', color_background: '#efc360', color_text: '#000000' },
  { id: 2, name: 'clue', color_background: '#60a5fa', color_text: '#000000' },
  { id: 3, name: 'cipher', color_background: '#a78bfa', color_text: '#000000' },
  { id: 4, name: 'place', color_background: '#34d399', color_text: '#000000' },
];

function thread(id: EntityId, name: string, rank = 0): Thread {
  return { id, name, rank, collapsed: false };
}

function activity(
  owner: Thread,
  id: EntityId,
  name: string,
  options: { category?: EntityId; parentId?: EntityId } = {},
): Activity {
  return {
    id,
    name,
    thread: owner,
    thread_id: owner.id,
    parent_id: options.parentId,
    categories: [options.category ?? 1],
  };
}

/**
 * National Treasure, asked as one investigation.
 *
 * The gold bar on the hunt is the question that stays open. Everything else is
 * a chapter: finish the rabbit hole, then shift. Dead ends reject (J). The
 * path that survives resolves (V). Fixture "now" is evening, after the hunt
 * question closes. Morning is ~22 hours back.
 *
 * Parents and children stay on the same thread. A new kind of clue is a new
 * thread, not a cross-thread nest.
 *
 * Tone: adventure puzzle, not cabal panic. The symbols are real. The map might
 * be. Steal the Declaration only if you have to.
 */
export function createNationalTreasureFixture(now = Date.now()): AppChartFixture {
  const ago = (hours: number, minutes = 0) => now - hours * HOUR - minutes * MINUTE;

  const hunt = thread(1, 'the hunt 🗺️', 0);
  const seal = thread(2, 'the seal 💵', 1);
  const craft = thread(3, 'the craft 📐', 2);
  const parchment = thread(4, 'the parchment 📜', 3);
  const ground = thread(5, 'the ground 🔔', 4);

  // --- the hunt -------------------------------------------------------------
  const treasure = activity(hunt, 100, 'Where did the Knights Templar hide their treasure?');
  const justGold = activity(hunt, 110, 'Is it gold, or is it something they thought was worth more?', {
    parentId: treasure.id,
  });
  const america = activity(hunt, 120, 'Why would any of it end up in America?', {
    parentId: treasure.id,
  });
  const stealIt = activity(hunt, 130, 'Do we actually have to steal the Declaration of Independence?', {
    category: 4,
    parentId: treasure.id,
  });
  const trust = activity(hunt, 140, 'If the map is real, who was it meant for?', {
    parentId: treasure.id,
  });

  // --- the seal -------------------------------------------------------------
  const dollar = activity(seal, 200, 'What is on the back of a dollar bill?');
  const pyramid = activity(seal, 210, 'Why is the pyramid unfinished?', {
    parentId: dollar.id,
  });
  const thirteen = activity(seal, 211, 'Is every thirteen an accident?', {
    category: 3,
    parentId: pyramid.id,
  });
  const eye = activity(seal, 220, 'Whose eye is that?', { parentId: dollar.id });
  const providence = activity(seal, 221, 'Is it the eye of Providence, or a warning?', {
    parentId: eye.id,
  });
  const annuit = activity(seal, 230, 'What does Annuit Coeptis actually say?', {
    category: 3,
    parentId: dollar.id,
  });
  const novus = activity(seal, 231, 'Novus Ordo Seclorum — a new order of the ages?', {
    category: 3,
    parentId: dollar.id,
  });
  const greatSeal = activity(seal, 240, 'Read the Great Seal, not the bill', {
    category: 2,
    parentId: dollar.id,
  });
  const illuminati = activity(seal, 250, 'Is this just the Illuminati logo?', {
    parentId: dollar.id,
  });

  // --- the craft ------------------------------------------------------------
  const masons = activity(craft, 300, 'Were the Founders Freemasons?');
  const washington = activity(craft, 310, 'Was Washington one?', { parentId: masons.id });
  const franklin = activity(craft, 311, 'Was Franklin one?', { parentId: masons.id });
  const howMany = activity(craft, 312, 'How many of the signers?', {
    category: 2,
    parentId: masons.id,
  });
  const whatPassed = activity(craft, 320, 'What does a lodge actually pass down?', {
    parentId: masons.id,
  });
  const passwords = activity(craft, 321, 'Is it passwords and handshakes, or a charge?', {
    parentId: whatPassed.id,
  });
  const templars = activity(craft, 330, 'Did the Templars become the Masons?', {
    parentId: masons.id,
  });
  const friday1307 = activity(craft, 331, 'What happened in 1307 that would force a treasure into hiding?', {
    category: 2,
    parentId: templars.id,
  });
  const rosslyn = activity(craft, 332, 'Is Rosslyn Chapel a receipt?', {
    category: 4,
    parentId: templars.id,
  });
  const toAmerica = activity(craft, 340, 'Could a brotherhood carry a secret across an ocean?', {
    parentId: masons.id,
  });

  // --- the parchment --------------------------------------------------------
  const declaration = activity(parchment, 400, 'Is there something on the back of the Declaration?');
  const invisible = activity(parchment, 410, 'Invisible ink — did they have it?', {
    category: 2,
    parentId: declaration.id,
  });
  const dogood = activity(parchment, 420, 'Silence Dogood: is the cipher in the letters?', {
    category: 3,
    parentId: declaration.id,
  });
  const ottendorf = activity(parchment, 421, 'An Ottendorf cipher needs a key. Which book?', {
    category: 3,
    parentId: dogood.id,
  });
  const whyHide = activity(parchment, 430, 'Why hide a map on the founding document?', {
    parentId: declaration.id,
  });
  const inPlainSight = activity(parchment, 431, 'Because nobody would dare steal it?', {
    category: 4,
    parentId: whyHide.id,
  });
  const timeLock = activity(parchment, 432, 'Or because it had to wait for someone who could read it?', {
    parentId: whyHide.id,
  });
  const steal = activity(parchment, 440, 'Can you get the Declaration out of its case?', {
    category: 4,
    parentId: declaration.id,
  });

  // --- the ground -----------------------------------------------------------
  const where = activity(ground, 500, 'Where does the map point?');
  const independence = activity(ground, 510, 'Independence Hall — the brick?', {
    category: 4,
    parentId: where.id,
  });
  const libertyBell = activity(ground, 511, 'Under the Liberty Bell?', {
    category: 4,
    parentId: independence.id,
  });
  const trinity = activity(ground, 520, 'Trinity Church, Wall Street?', {
    category: 4,
    parentId: where.id,
  });
  const graves = activity(ground, 521, 'The graves — Parkington Lane?', {
    category: 4,
    parentId: trinity.id,
  });
  const steeple = activity(ground, 522, 'The steeple is a landmark, not a vault', {
    category: 4,
    parentId: trinity.id,
  });
  const charlotte = activity(ground, 530, 'Why does every trail end at "Charlotte"?', {
    category: 3,
    parentId: where.id,
  });
  const silentCity = activity(ground, 531, 'Is Charlotte the Silent City below Trinity?', {
    category: 4,
    parentId: charlotte.id,
  });
  const chamber = activity(ground, 540, 'What is in the chamber?', { parentId: where.id });
  const scrolls = activity(ground, 541, 'Scrolls and relics — or just the idea of them?', {
    parentId: chamber.id,
  });

  let eventId = 9000;
  const ev = (
    hours: number,
    phase: EventPhase,
    item: Activity,
    message?: string,
    minutes = 0,
  ): TraceEvent => {
    eventId += 1;
    return {
      id: eventId,
      timestamp: ago(hours, minutes),
      phase,
      activity: item,
      message,
    };
  };

  const events: TraceEvent[] = [
    // 1. The hunt opens. Treasure first; America second.
    ev(22, 'Q', treasure, 'A medieval order falls. A fortune vanishes. Two centuries later, a country is born.'),
    ev(21.8, 'Q', justGold, 'Gold is heavy. Secrets travel light.'),
    ev(21.5, 'V', justGold, 'Both. Bullion if you need to fund a war. Knowledge if you need to outlast one.'),
    ev(21.3, 'Q', america, 'Templars die in France. Freemasons raise a cornerstones in Virginia. Same tools on the apron.'),

    // 2. The seal — read the bill like a map legend.
    ev(21, 'Q', dollar, 'If they left a legend, they left it where every American would hold it.'),
    ev(20.8, 'Q', pyramid, 'Thirteen courses. Capstone floating. Unfinished on purpose.'),
    ev(20.6, 'Q', thirteen, 'Thirteen stars. Thirteen stripes. Thirteen arrows. Thirteen letters in Annuit Coeptis.'),
    ev(20.3, 'V', thirteen, 'Not an accident. A signature. The number is the colonies, and the colonies are the key.'),
    ev(20.1, 'V', pyramid, 'The work is not done. The country is the unfinished stone.'),
    ev(19.9, 'Q', eye),
    ev(19.7, 'Q', providence, 'Congress said Providence. The engraver put an eye in a triangle.'),
    ev(19.4, 'V', providence, 'Providence watching the work. Or a brotherhood reminding you who laid the courses.'),
    ev(19.2, 'V', eye, 'Either reading works. The useful one is: someone is supposed to finish this.'),
    ev(19, 'Q', annuit),
    ev(18.7, 'V', annuit, 'He favors our undertakings. Not a threat. A wager that the undertaking continues.'),
    ev(18.5, 'Q', novus),
    ev(18.2, 'V', novus, 'Virgil. A great order of the ages is born. The Founders quoted a poet about a new saeculum — not a shadow government.'),
    ev(18, 'B', greatSeal),
    ev(17.6, 'E', greatSeal, 'Thomson and Barton designed it. 1782. The bill just borrowed both sides.'),
    ev(17.4, 'Q', illuminati, 'Bavaria, 1776. A short-lived order. A long afterlife in footnotes.'),
    ev(17.1, 'J', illuminati, 'Wrong century for the seal, wrong country for the Founders. A dead end with good marketing.'),
    ev(16.9, 'V', dollar, 'The seal is a legend. Pyramid unfinished. Eye watching. Thirteen everywhere. It points at a brotherhood and a task — not at a logo.'),

    // 3. The craft — who could carry a secret.
    ev(16.7, 'Q', masons, 'Aprons at the cornerstone. Squares on the graves. The question is not costume. It is custody.'),
    ev(16.5, 'Q', washington),
    ev(16.3, 'V', washington, 'Yes. Master of Alexandria Lodge. In Masonic regalia at the Capitol cornerstone.'),
    ev(16.1, 'Q', franklin),
    ev(15.9, 'V', franklin, 'Yes. Grand Master in Pennsylvania. The kind of man you trust with a letter that must not burn.'),
    ev(15.7, 'B', howMany),
    ev(15.3, 'E', howMany, 'Not all. Enough. Washington, Franklin, Hancock among them. The craft was in the room.'),
    ev(15.1, 'Q', whatPassed),
    ev(14.9, 'Q', passwords, 'Tokens get you in the door. A charge is what you carry out.'),
    ev(14.6, 'V', passwords, 'The passwords are theater. The charge is the point: keep something until the country can bear it.'),
    ev(14.4, 'V', whatPassed, 'A chain of custody. Each master to the next. Across oceans if it has to.'),
    ev(14.2, 'Q', templars, 'The movie says the Templars became the Masons. History coughs. The legend does not.'),
    ev(14, 'Q', friday1307, 'Friday the 13th. Philip the Fair. Arrests at dawn.'),
    ev(13.7, 'V', friday1307, 'The order falls in France. The fleet at La Rochelle is already gone. Something left by sea.'),
    ev(13.5, 'Q', rosslyn),
    ev(13.2, 'V', rosslyn, 'Scotland. Carvings that look like maize a century early. A chapel that acts like a vault advertisement.'),
    ev(13, 'V', templars, 'Direct descent is unprovable. A treasure needing a new keeper is enough. The craft is a keeper-shaped hole.'),
    ev(12.8, 'Q', toAmerica),
    ev(12.5, 'V', toAmerica, 'Yes. Lodges on ships. Lodges in Philadelphia. A republic that needs funding and a myth.'),
    ev(12.3, 'V', masons, 'Enough Founders were brothers. Enough of the craft is about keeping. That is the bridge.'),
    ev(12.1, 'V', america, 'The treasure crosses with men who already know how to hide a charge in plain sight.'),

    // 4. The parchment — the map has to live somewhere sacred.
    ev(11.9, 'Q', declaration, 'The one document nobody is allowed to touch. Perfect.'),
    ev(11.7, 'Q', invisible),
    ev(11.4, 'V', invisible, 'Franklin wrote about it. Ferrous sulfate. Heat and lemon. They had the chemistry.'),
    ev(11.2, 'Q', dogood, 'Mrs. Silence Dogood. Franklin\'s letters. A book of them on the shelf.'),
    ev(11, 'Q', ottendorf, 'Page. Line. Word. You need the right edition or you get poetry instead of a street.'),
    ev(10.7, 'V', ottendorf, 'The letters are the key text. The numbers are on the Declaration. Together they walk.'),
    ev(10.5, 'V', dogood, 'A cipher that looks like a joke by a widow. Franklin would.'),
    ev(10.3, 'Q', whyHide),
    ev(10.1, 'Q', inPlainSight, 'Steal the Declaration. That is the security model.'),
    ev(9.8, 'V', inPlainSight, 'Yes. The best safe is the one under glass at the National Archives.'),
    ev(9.6, 'Q', timeLock, 'Or the map waits for a generation that can finish the pyramid.'),
    ev(9.3, 'V', timeLock, 'Also yes. Custody across time. The document outlives the men.'),
    ev(9.1, 'V', whyHide, 'Because it is the one page that must survive the British, the fire, and the museum.'),
    ev(8.9, 'Q', steal, 'Laser. Glass. Guards. A smuggled duplicate for the party.'),
    ev(8.6, 'V', steal, 'You can. You should not have to — unless someone else is already moving.'),
    ev(8.4, 'V', declaration, 'Invisible map on the back. Cipher in the letters. The founding document is the legend\'s second half.'),
    ev(8.2, 'Q', stealIt, 'The Archives will not lend it out for a treasure hunt.'),
    ev(7.9, 'V', stealIt, 'Then you steal it. Gently. And you bring it back.'),

    // 5. The ground — walk the map.
    ev(7.7, 'Q', where, 'A map that does not end on paper is not finished.'),
    ev(7.5, 'Q', independence),
    ev(7.3, 'Q', libertyBell, 'A crack is not a door.'),
    ev(7, 'J', libertyBell, 'Tourists and a line. The clue was the brick, not the bell.'),
    ev(6.8, 'V', independence, 'A hollow brick. A pair of glasses. Franklin\'s. The map needs to be read.'),
    ev(6.6, 'Q', trinity, 'Wall Street. A church older than the country\'s banks.'),
    ev(6.4, 'Q', graves),
    ev(6.1, 'V', graves, 'Names that are almost right. Lanterns. A reference to a man who never existed — which means the name is the instruction.'),
    ev(5.9, 'Q', steeple),
    ev(5.6, 'V', steeple, 'Sightline. You use the spire to aim. You do not dig under the pews like a pirate.'),
    ev(5.4, 'V', trinity, 'The church is a landmark and a door. The treasure is under the landmark.'),
    ev(5.2, 'Q', charlotte, 'Every cipher spits out the same word. A city. A queen. A ship.'),
    ev(5, 'Q', silentCity, 'Beneath Trinity: a forgotten chamber the movie calls the Silent City.'),
    ev(4.7, 'V', silentCity, 'Tunnels. Timber. A room that should not exist under Manhattan.'),
    ev(4.5, 'V', charlotte, 'Not North Carolina. The chamber. The last word was a place with no street sign.'),
    ev(4.3, 'Q', chamber),
    ev(4.1, 'Q', scrolls, 'Gold crosses. Scrolls. Resolutions the Founders never published.'),
    ev(3.8, 'V', scrolls, 'Relics if you need proof. Documents if you need a country. The point was never the melt value.'),
    ev(3.6, 'V', chamber, 'A vault under the church. Templar charge. Masonic custody. American keeping.'),
    ev(3.4, 'V', where, 'Independence Hall to read. Trinity to dig. Charlotte was the room.'),
    ev(3.2, 'Q', trust, 'Gates. Madison. A family that was supposed to be ready.'),
    ev(2.9, 'V', trust, 'Not a bloodline chart. A promise: when the country can bear it, open the door.'),
    ev(
      2.6,
      'V',
      treasure,
      'Out of France by sea. Into the craft. Across the ocean. Onto the seal as a legend, onto the Declaration as a map, under Trinity as a room. The unfinished pyramid was the instruction: keep it until the work is done.',
    ),
  ];

  return {
    attentionShifts: [
      { thread_id: hunt.id, timestamp: ago(22) },
      { thread_id: seal.id, timestamp: ago(21) },
      { thread_id: craft.id, timestamp: ago(16.7) },
      { thread_id: hunt.id, timestamp: ago(12.1) },
      { thread_id: parchment.id, timestamp: ago(11.9) },
      { thread_id: hunt.id, timestamp: ago(8.2) },
      { thread_id: ground.id, timestamp: ago(7.7) },
      { thread_id: hunt.id, timestamp: ago(3.2) },
    ],
    categories,
    events,
    threads: [hunt, seal, craft, parchment, ground],
    traceId: 9002,
    traceName: 'Where did the Knights Templar hide their treasure?',
  };
}
