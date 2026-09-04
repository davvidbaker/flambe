import type { Activity } from '../types/Activity';
import type { Category } from '../types/Category';
import type { EntityId } from '../types/ids';
import type { Thread } from '../types/Thread';
import type { EventPhase, TraceEvent } from '../types/TraceEvent';
import type { AppChartFixture } from './fixtureTrace';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

const categories: Category[] = [
  { id: 1, name: 'dispatch', color_background: '#efc360', color_text: '#000000' },
  { id: 2, name: 'forecast', color_background: '#60a5fa', color_text: '#000000' },
  { id: 3, name: 'comms', color_background: '#a78bfa', color_text: '#ffffff' },
  { id: 4, name: 'restore', color_background: '#34d399', color_text: '#000000' },
  { id: 5, name: 'outage', color_background: '#fb7185', color_text: '#000000' },
  { id: 6, name: 'fuel', color_background: '#f59e0b', color_text: '#000000' },
  { id: 7, name: 'weather', color_background: '#22d3ee', color_text: '#000000' },
];

function thread(id: EntityId, name: string, rank = 0): Thread {
  return { id, name, rank, collapsed: false };
}

function activity(
  owner: Thread,
  id: EntityId,
  name: string,
  options: {
    agentName?: string;
    agentProvider?: string;
    category?: EntityId;
    parentId?: EntityId;
  } = {},
): Activity {
  const slug = options.agentName?.toLowerCase().replace(/\s+/g, '-');
  return {
    id,
    name,
    thread: owner,
    thread_id: owner.id,
    parent_id: options.parentId,
    categories: [options.category ?? 1],
    ...(options.agentName && slug
      ? {
          agent_id: options.agentProvider
            ? `${options.agentProvider}:${slug}`
            : slug,
          agent_name: options.agentName,
        }
      : {}),
  };
}

/**
 * ERCOT during Winter Storm Uri (Feb 10–18, 2021).
 *
 * Fixture "now" is Thursday evening Feb 18, after most load is back.
 * `ago(h, m)` is hours (and optional minutes) before that instant.
 *
 * Clock times in comments are CST. The night of Feb 15 is the one to read:
 * frequency fell to 59.3 Hz and the grid was four minutes from a statewide
 * blackout. Everything else on the chart is why that happened at once —
 * frozen gas, iced wind, a nuclear unit trip, and utilities that could not
 * actually rotate the outages.
 */
export function createWinterStormUriFixture(now = Date.now()): AppChartFixture {
  const ago = (hours: number, minutes = 0) => now - hours * HOUR - minutes * MINUTE;

  const ercot = thread(1, 'ERCOT ⚡', 0);
  const generation = thread(2, 'generation 🏭', 1);
  const gas = thread(3, 'natural gas 🔥', 2);
  const utilities = thread(4, 'utilities 🏠', 3);
  const weather = thread(5, 'weather ❄️', 4);
  const capitol = thread(6, 'Austin 🏛️', 5);

  // --- ERCOT control room -------------------------------------------------
  const keepLightsOn = activity(ercot, 100, 'Keep the interconnection up', { category: 1 });
  const staffTaylor = activity(ercot, 101, 'Staff the Taylor control room', {
    category: 1,
    parentId: keepLightsOn.id,
  });
  const declareEmergency = activity(ercot, 102, 'Declare an energy emergency?', { category: 3 });
  const eeaLadder = activity(ercot, 110, 'Climb the EEA ladder', {
    category: 1,
    parentId: keepLightsOn.id,
  });
  const eea1 = activity(ercot, 111, 'EEA 1 — conservation appeal', {
    category: 1,
    parentId: eeaLadder.id,
  });
  const eea2 = activity(ercot, 112, 'EEA 2 — deploy all reserves', {
    category: 1,
    parentId: eeaLadder.id,
  });
  const eea3 = activity(ercot, 113, 'EEA 3 — firm load shed', {
    category: 5,
    parentId: eeaLadder.id,
  });
  const holdHz = activity(ercot, 120, 'Hold frequency above 59.4 Hz', {
    category: 5,
    parentId: keepLightsOn.id,
  });
  const shed10 = activity(ercot, 121, 'Order 10.5 GW of firm load shed', {
    category: 5,
    parentId: holdHz.id,
  });
  const shedMore = activity(ercot, 122, 'Order another 6 GW', {
    category: 5,
    parentId: holdHz.id,
  });
  const easternTie = activity(ercot, 103, 'Pull help from the Eastern Interconnect?', { category: 3 });
  const restoreLoad = activity(ercot, 130, 'Start restoring load', {
    category: 4,
    parentId: keepLightsOn.id,
  });

  // --- generation ---------------------------------------------------------
  const keepGen = activity(generation, 200, 'Keep generation online', { category: 1 });
  const vistra = activity(generation, 210, 'Ride through on the thermal fleet', {
    agentName: 'Vistra',
    agentProvider: 'vistra',
    category: 1,
    parentId: keepGen.id,
  });
  const midlothian = activity(generation, 211, 'Midlothian combined cycle', {
    agentName: 'Vistra',
    agentProvider: 'vistra',
    category: 5,
    parentId: vistra.id,
  });
  const wind = activity(generation, 220, 'Keep wind off the ice', {
    agentName: 'Pattern',
    agentProvider: 'pattern',
    category: 7,
    parentId: keepGen.id,
  });
  const stp = activity(generation, 230, 'South Texas Project Unit 1', {
    agentName: 'STPNOC',
    agentProvider: 'stp',
    category: 5,
    parentId: keepGen.id,
  });
  const coal = activity(generation, 240, 'Hold the coal units', {
    category: 5,
    parentId: keepGen.id,
  });
  const waitOnGas = activity(generation, 250, 'Wait on pipeline pressure', {
    agentName: 'Vistra',
    agentProvider: 'vistra',
    category: 6,
    parentId: vistra.id,
  });

  // --- natural gas --------------------------------------------------------
  const molecules = activity(gas, 300, 'Keep gas moving to the plants', { category: 6 });
  const wellheads = activity(gas, 301, 'Wellhead freeze-offs in the Permian', {
    category: 5,
    parentId: molecules.id,
  });
  const processing = activity(gas, 302, 'Processing plants lose power', {
    category: 5,
    parentId: molecules.id,
  });
  const atmos = activity(gas, 310, 'Hold line pack on the distribution system', {
    agentName: 'Atmos',
    agentProvider: 'atmos',
    category: 6,
    parentId: molecules.id,
  });
  const kinder = activity(gas, 311, 'Interstate pipeline pressure', {
    agentName: 'Kinder Morgan',
    agentProvider: 'kinder',
    category: 6,
    parentId: molecules.id,
  });
  const deathSpiral = activity(gas, 320, 'Plants need gas, wells need power — which first?', {
    category: 3,
  });

  // --- utilities (TDUs executing the shed) --------------------------------
  const executeShed = activity(utilities, 400, 'Execute ERCOT load-shed instruction', { category: 5 });
  const oncor = activity(utilities, 410, 'Shed DFW load', {
    agentName: 'Oncor',
    agentProvider: 'oncor',
    category: 5,
    parentId: executeShed.id,
  });
  const oncorHospitals = activity(utilities, 411, 'Hold hospital and water-plant feeders', {
    agentName: 'Oncor',
    agentProvider: 'oncor',
    category: 4,
    parentId: oncor.id,
  });
  const centerpoint = activity(utilities, 420, 'Shed Houston load', {
    agentName: 'CenterPoint',
    agentProvider: 'centerpoint',
    category: 5,
    parentId: executeShed.id,
  });
  const austin = activity(utilities, 430, 'Shed Austin load', {
    agentName: 'Austin Energy',
    agentProvider: 'austin',
    category: 5,
    parentId: executeShed.id,
  });
  const rotate = activity(utilities, 440, 'Rotate the outages so nobody sits dark', {
    category: 4,
    parentId: executeShed.id,
  });

  // --- weather ------------------------------------------------------------
  const outbreak = activity(weather, 500, 'Arctic outbreak over Texas', { category: 7 });
  const nws = activity(weather, 501, 'Winter storm warning', {
    agentName: 'NWS',
    agentProvider: 'nws',
    category: 2,
    parentId: outbreak.id,
  });
  const recordCold = activity(weather, 502, 'Record lows — Dallas −2°F', {
    category: 7,
    parentId: outbreak.id,
  });
  const turbineIce = activity(weather, 503, 'Ice on the wind turbines', {
    category: 7,
    parentId: outbreak.id,
  });
  const thaw = activity(weather, 504, 'Thaw Thursday', {
    category: 7,
    parentId: outbreak.id,
  });

  // --- Austin / public ----------------------------------------------------
  const briefState = activity(capitol, 600, 'Brief the state', { category: 3 });
  const puc = activity(capitol, 601, 'PUC emergency session', {
    category: 3,
    parentId: briefState.id,
  });
  const press = activity(capitol, 602, 'Tell people this is rolling', {
    category: 3,
    parentId: briefState.id,
  });
  const weatherize = activity(capitol, 610, 'Who weatherizes the gas wells?', { category: 3 });
  const board = activity(capitol, 611, 'ERCOT board after-action', { category: 3 });

  let eventId = 30000;
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

  // Hours before Thu Feb 18 ~18:00 CST.
  // Feb 15 01:00 ≈ 89h, Feb 14 18:00 ≈ 96h, Feb 11 08:00 ≈ 178h.
  const events: TraceEvent[] = [
    // --- Tue–Sat Feb 9–13: the forecast is on the desk --------------------
    ev(178, 'B', outbreak, 'NWS: historic cold, not a normal norther'),
    ev(176, 'B', nws, 'Winter storm watch for the whole ERCOT footprint'),
    ev(170, 'B', keepLightsOn, 'Seasonal assessment already said winterization was thin'),
    ev(168, 'B', staffTaylor),
    ev(166, 'B', keepGen),
    ev(164, 'B', vistra, 'Pre-stage crews at Midlothian and Odessa'),
    ev(160, 'B', molecules, 'Permian wells are producing, line pack looks normal'),
    ev(158, 'E', nws, 'Upgraded to warning. Tuesday night into Wednesday.'),
    ev(150, 'B', wind, 'Icing procedures posted to the QSEs'),
    ev(148, 'Q', declareEmergency, 'Do we go into EEA on the forecast, or wait for trips?'),

    // --- Sun Feb 14: first trips, demand climbing -------------------------
    ev(110, 'B', wellheads, 'Wellhead freeze-offs starting in the Permian'),
    ev(108, 'B', turbineIce, 'Turbine blades icing in West Texas'),
    ev(106, 'B', midlothian, 'Midlothian 2 trips on a frozen sensing line'),
    ev(104, 'E', midlothian, 'Thought we had it'),
    ev(103, 'X', midlothian, 'Trips again. Same sensing line.'),
    ev(100, 'B', coal, 'Martin Lake derate — frozen coal piles'),
    ev(98, 'V', declareEmergency, 'Wait. Conserving now. EEA if trips keep coming.'),
    ev(96, 'B', recordCold, 'Single digits in DFW before midnight'),
    ev(94, 'E', midlothian, 'Offline for the night. 1.6 GW gone.'),
    ev(92, 'B', processing, 'A processing plant west of Midland just went dark'),
    ev(91, 'B', kinder, 'Line pack falling on the interstate'),

    // --- Mon Feb 15 00:00–02:00: the four minutes -------------------------
    ev(90, 'B', eeaLadder),
    ev(89, 'B', eea1, 'EEA 1. Ask the public to conserve.'),
    ev(88, 'B', eea2, 'EEA 2. All reserves in.', 50),
    ev(88, 'B', eea3, 'EEA 3. Firm load. This is not a drill.', 40),
    ev(88, 'B', holdHz, '59.4 and falling', 35),
    ev(88, 'B', executeShed, 'Instruction to TDUs: shed now, ask later', 30),
    ev(88, 'B', shed10, '10,500 MW. Every TDU, proportional.', 28),
    ev(88, 'B', oncor, undefined, 26),
    ev(88, 'B', centerpoint, undefined, 26),
    ev(88, 'B', austin, undefined, 25),
    ev(88, 'B', oncorHospitals, 'Hospitals and the Dallas water plants stay up', 24),
    ev(88, 'B', atmos, 'Residential heat is still pulling gas we need for plants', 20),
    ev(88, 'E', shed10, '10.5 GW is off. Frequency is still 59.3.', 15),
    ev(88, 'B', shedMore, 'Another 6 GW. We have four minutes if this does not hold.', 12),
    ev(88, 'E', shedMore, '59.4. Barely.', 8),
    ev(88, 'E', holdHz, 'Frequency held. Do not restore a single MW yet.', 5),
    ev(87, 'Q', easternTie, 'Can SPP or the East send us anything?'),
    ev(86, 'J', easternTie, 'No. ERCOT is an island. That was the deal.'),
    ev(85, 'B', rotate, 'Try to rotate so the same streets are not dark until Wednesday'),
    ev(84, 'S', rotate, 'Cannot rotate. Frequency is too tight to pick anyone back up.'),
    ev(82, 'B', stp, 'STP Unit 1 — feedwater sensor freeze'),
    ev(81, 'E', stp, '1.3 GW nuclear, gone. The other unit holds.'),
    ev(80, 'E', eea1),
    ev(80, 'E', eea2),
    ev(72, 'B', press, 'Tell Houston this is rolling'),
    ev(70, 'E', press, 'It is not rolling. Some circuits will sit until the freeze breaks.'),
    ev(68, 'B', puc),
    ev(66, 'B', deathSpiral, 'Wells need power. Plants need gas. We are shedding the wells.'),
    ev(65, 'B', waitOnGas),
    ev(64, 'S', waitOnGas, 'Midlothian will not restart until Atmos has pressure'),
    ev(62, 'E', processing, 'Three Permian plants offline. Inlet froze.'),
    ev(60, 'E', coal, 'Martin Lake is at 40%. The pile is a brick.'),

    // --- Tue Feb 16: the long dark ----------------------------------------
    ev(56, 'B', briefState),
    ev(54, 'E', puc, 'Emergency order: do what ERCOT says.'),
    ev(52, 'E', wellheads, 'Production is roughly half of Friday.'),
    ev(50, 'E', turbineIce, 'Most of the wind fleet is a sculpture garden'),
    ev(48, 'E', wind, 'What is still spinning is a rounding error'),
    ev(46, 'E', deathSpiral, 'No good answer. Keep the hospitals. Hope the wells thaw.'),
    ev(44, 'E', kinder, 'Pressure is off the floor. Not enough for a restart.'),
    ev(42, 'R', waitOnGas, 'A little line pack back. Try Midlothian again.'),
    ev(40, 'X', midlothian, 'Restart attempt'),
    ev(38, 'E', midlothian, 'Holds at 400 MW. Not 1.6 GW, but it is something.'),
    ev(36, 'E', recordCold, 'Dallas −2°F. That was the bottom.'),

    // --- Wed Feb 17: thaw, restore ----------------------------------------
    ev(32, 'B', thaw, 'Above freezing in Austin by afternoon'),
    ev(30, 'R', rotate, 'Frequency has room. Start rotating.'),
    ev(28, 'B', restoreLoad, 'Give the TDUs megawatts back, slowly'),
    ev(26, 'E', eea3, 'Still in EEA 3, but we are climbing out'),
    ev(24, 'E', austin, 'Austin is mostly back. The water plant never dropped.'),
    ev(22, 'E', centerpoint, 'Houston still has pockets. Ice on the distribution.'),
    ev(20, 'E', oncorHospitals, 'Parkland and the water plants never went dark'),
    ev(18, 'E', oncor, 'DFW coming back feeder by feeder'),
    ev(16, 'E', rotate),
    ev(14, 'E', executeShed, 'Load-shed instruction lifted'),
    ev(12, 'E', restoreLoad, 'Load is back inside the forecast'),
    ev(10, 'E', eeaLadder, 'Off EEA. Do not get used to it.'),
    ev(8, 'E', thaw),
    ev(8, 'E', atmos, 'Residential heat is no longer eating the plants'),
    ev(6, 'E', vistra, 'Fleet is ugly but spinning'),
    ev(6, 'E', waitOnGas),
    ev(5, 'E', molecules),
    ev(4, 'E', keepGen, 'Online capacity is finally above demand'),
    ev(3, 'E', outbreak),
    ev(3, 'E', staffTaylor, 'The night shift that held 59.4 goes home'),
    ev(2, 'E', keepLightsOn, 'The island did not go dark. A lot of houses did.'),
    ev(2, 'E', briefState),
    ev(1.5, 'Q', weatherize, 'Who weatherizes the wells — RRC, PUC, or nobody?'),
    ev(1, 'B', board, 'The board is going to hear about the four minutes'),
  ];

  return {
    attentionShifts: [
      { thread_id: weather.id, timestamp: ago(178) },
      { thread_id: ercot.id, timestamp: ago(170) },
      { thread_id: generation.id, timestamp: ago(166) },
      { thread_id: gas.id, timestamp: ago(110) },
      { thread_id: ercot.id, timestamp: ago(90) },
      { thread_id: utilities.id, timestamp: ago(88, 30) },
      { thread_id: generation.id, timestamp: ago(82) },
      { thread_id: capitol.id, timestamp: ago(72) },
      { thread_id: gas.id, timestamp: ago(66) },
      { thread_id: utilities.id, timestamp: ago(30) },
      { thread_id: ercot.id, timestamp: ago(28) },
      { thread_id: capitol.id, timestamp: ago(1.5) },
    ],
    categories,
    events,
    threads: [ercot, generation, gas, utilities, weather, capitol],
    traceId: 9402,
    traceName: 'ERCOT · February 2021',
  };
}
