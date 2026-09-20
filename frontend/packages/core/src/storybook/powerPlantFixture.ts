import type { Activity } from '../types/Activity';
import type { Category } from '../types/Category';
import type { EntityId } from '../types/ids';
import type { Thread } from '../types/Thread';
import type { EventPhase, TraceEvent } from '../types/TraceEvent';
import type { AppChartFixture } from './fixtureTrace';

const DAY = 24 * 60 * 60 * 1000;

const categories: Category[] = [
  { id: 1, name: 'milestone', color_background: '#efc360', color_text: '#000000' },
  { id: 2, name: 'study', color_background: '#60a5fa', color_text: '#000000' },
  { id: 3, name: 'permit', color_background: '#a78bfa', color_text: '#000000' },
  { id: 4, name: 'contract', color_background: '#34d399', color_text: '#000000' },
  { id: 5, name: 'build', color_background: '#f59e0b', color_text: '#000000' },
  { id: 6, name: 'risk', color_background: '#fb7185', color_text: '#000000' },
  { id: 7, name: 'decision', color_background: '#22d3ee', color_text: '#000000' },
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
    categories: [options.category ?? 5],
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

/** Calendar date the fixture's `now` is pinned to. Every other date shifts with it. */
const NOW_ON_CALENDAR = '2026-06-03';

/**
 * Sable Creek Energy Center: a 710 MW 2x1 combined-cycle gas plant in
 * Columbiana County, Ohio — from the 2016 need signal through IRPs and
 * economic planning studies, then development, to commercial operation in
 * PJM on June 1, 2026.
 *
 * Read it as a Gantt chart. Each thread is a workstream that runs in parallel:
 * planning (upstream of the named project), development, permitting, the PJM
 * queue, the transmission owner's network upgrades, the gas lateral, the EPC
 * build, and market entry. The only agent bands are PJM's studies — the one
 * place the developer truly hands the pen to someone else and waits.
 *
 * Dates in the events are real calendar dates. The fixture shifts them so
 * that `NOW_ON_CALENDAR` lands on `now`, so the chart reads "two days after
 * COD" no matter when it is rendered. Long gaps on a bar are real: a queue
 * study that sits for a year is the point. Parents suspend across real idle
 * waits (ROW done → outage season, design done → civil, ISA done → validation)
 * so the chart does not leave empty holes under an open bar.
 *
 * Parents and children stay on the same thread.
 */
export function createPowerPlantFixture(now = Date.now()): AppChartFixture {
  const shift = now - Date.parse(`${NOW_ON_CALENDAR}T12:00:00Z`);
  const on = (isoDate: string, dayOffset = 0) =>
    Date.parse(`${isoDate}T12:00:00Z`) + shift + dayOffset * DAY;

  const planning = thread(1, 'planning 📊', 0);
  const dev = thread(2, 'development 🏗️', 1);
  const permits = thread(3, 'siting & permits 📜', 2);
  const queue = thread(4, 'interconnection ⚡', 3);
  const tx = thread(5, 'transmission 🗼', 4);
  const fuel = thread(6, 'fuel 🔥', 5);
  const build = thread(7, 'construction 🚧', 6);
  const market = thread(8, 'market 📈', 7);

  // --- planning (upstream of the named project) -----------------------------
  const need = activity(planning, 50, 'Need new dispatchable capacity?', {
    category: 7,
  });
  const retirements = activity(planning, 51, 'Coal retirements', {
    category: 2,
    parentId: need.id,
  });
  const loadForecast = activity(planning, 52, 'PJM load forecast', {
    category: 2,
    parentId: need.id,
  });
  const reserveMargin = activity(planning, 53, 'Reserve margin holding?', {
    category: 7,
    parentId: need.id,
  });
  const capacitySignal = activity(planning, 54, 'RPM — ATSI and AEP', {
    category: 2,
    parentId: need.id,
  });
  const irpScan = activity(planning, 60, 'Read the IRPs', { category: 2 });
  const aepIrp = activity(planning, 61, 'AEP Ohio IRP', {
    category: 2,
    parentId: irpScan.id,
  });
  const feIrp = activity(planning, 62, 'FirstEnergy ESP', {
    category: 2,
    parentId: irpScan.id,
  });
  const ampIrp = activity(planning, 63, 'AMP IRPs', {
    category: 2,
    parentId: irpScan.id,
  });
  const rfpWatch = activity(planning, 64, 'Utility capacity RFPs?', {
    category: 7,
    parentId: irpScan.id,
  });
  const econStudy = activity(planning, 70, 'Economic planning study', { category: 2 });
  const screeningCurve = activity(planning, 71, 'Screening curves — CC vs CT vs storage', {
    category: 2,
    parentId: econStudy.id,
  });
  const sparkSpread = activity(planning, 72, 'Forward spark spreads', {
    category: 2,
    parentId: econStudy.id,
  });
  const capacityRev = activity(planning, 73, 'Capacity revenue under CP', {
    category: 2,
    parentId: econStudy.id,
  });
  const carbonRisk = activity(planning, 74, 'Carbon price mid-life?', {
    category: 6,
    parentId: econStudy.id,
  });
  const techChoice = activity(planning, 75, '2x1 H-class combined cycle?', {
    category: 7,
    parentId: econStudy.id,
  });
  const whereZone = activity(planning, 80, 'Which zone?', { category: 7 });
  const atsiVsAep = activity(planning, 81, 'ATSI, AEP, or Dominion?', {
    category: 7,
    parentId: whereZone.id,
  });
  const gasBasis = activity(planning, 82, 'Gas basis — REX vs TETCO', {
    category: 2,
    parentId: whereZone.id,
  });
  const congestion = activity(planning, 83, 'Congestion on Sammis–Wylie Ridge', {
    category: 2,
    parentId: whereZone.id,
  });
  const siteScreen = activity(planning, 90, 'Regional site screening', { category: 2 });
  const fatalPortfolio = activity(planning, 91, 'Fatal-flaw twelve parcels', {
    category: 2,
    parentId: siteScreen.id,
  });
  const shortlist = activity(planning, 92, 'Shortlist three eastern Ohio sites', {
    category: 1,
    parentId: siteScreen.id,
  });
  const boardGo = activity(planning, 93, 'Authorize development of one CC', {
    category: 1,
    parentId: siteScreen.id,
  });

  // --- development ----------------------------------------------------------
  const project = activity(dev, 100, 'Sable Creek Energy Center — 710 MW 2x1 combined cycle', {
    category: 1,
  });
  const siteControl = activity(dev, 101, 'Site control', { category: 4, parentId: project.id });
  const kessler = activity(dev, 102, 'Option the Kessler parcel', {
    category: 4,
    parentId: siteControl.id,
  });
  const hoffman = activity(dev, 103, 'Option the two Hoffman parcels', {
    category: 4,
    parentId: siteControl.id,
  });
  const fatalFlaw = activity(dev, 104, 'Fatal-flaw screen', { category: 2, parentId: project.id });
  const devBudget = activity(dev, 105, 'Spend $6M of development capital before we know the upgrade cost?', {
    category: 7,
    parentId: project.id,
  });
  const revenue = activity(dev, 110, 'How does this plant get paid?', {
    category: 7,
    parentId: project.id,
  });
  const ppa = activity(dev, 111, 'Ohio utility PPA?', {
    category: 7,
    parentId: revenue.id,
  });
  const hrco = activity(dev, 112, 'Heat-rate call option?', {
    category: 7,
    parentId: revenue.id,
  });
  const epcProc = activity(dev, 120, 'EPC procurement', { category: 4, parentId: project.id });
  const epcRfp = activity(dev, 121, 'Issue EPC RFP', { category: 4, parentId: epcProc.id });
  const turbineSlot = activity(dev, 122, 'Reserve two H-class turbine slots', {
    category: 4,
    parentId: epcProc.id,
  });
  const lstk = activity(dev, 123, 'Lump-sum turnkey EPC', {
    category: 4,
    parentId: epcProc.id,
  });
  const finClose = activity(dev, 130, 'Financial close', { category: 1, parentId: project.id });
  const ieReport = activity(dev, 131, 'Independent engineer report', {
    category: 2,
    parentId: finClose.id,
  });
  const constructionLoan = activity(dev, 132, 'Syndicate the construction loan', {
    category: 4,
    parentId: finClose.id,
  });
  const equity = activity(dev, 133, 'Equity commitment', { category: 4, parentId: finClose.id });
  const ratesRisk = activity(dev, 140, 'Does the project still pencil at 8%?', {
    category: 6,
    parentId: project.id,
  });
  const cod = activity(dev, 150, 'Commercial operation', { category: 1, parentId: project.id });

  // --- siting & permits -----------------------------------------------------
  const permitPlant = activity(permits, 200, 'Permit the plant', { category: 3 });
  const opsb = activity(permits, 201, 'OPSB certificate of environmental compatibility', {
    category: 3,
    parentId: permitPlant.id,
  });
  const preApp = activity(permits, 202, 'Pre-application public informational meeting', {
    category: 3,
    parentId: opsb.id,
  });
  const fileOpsb = activity(permits, 203, 'File the OPSB application', {
    category: 3,
    parentId: opsb.id,
  });
  const staffReport = activity(permits, 204, 'Staff investigation and report', {
    category: 3,
    parentId: opsb.id,
  });
  const localHearing = activity(permits, 205, 'Local public hearing', {
    category: 3,
    parentId: opsb.id,
  });
  const adjudicatory = activity(permits, 206, 'Adjudicatory hearing', {
    category: 3,
    parentId: opsb.id,
  });
  const intervene = activity(permits, 207, 'Will the township intervene?', {
    category: 6,
    parentId: opsb.id,
  });
  const rehearing = activity(permits, 208, 'Application for rehearing', {
    category: 6,
    parentId: opsb.id,
  });
  const certificate = activity(permits, 209, 'Certificate issued', {
    category: 1,
    parentId: opsb.id,
  });
  const airPermit = activity(permits, 210, 'Ohio EPA air Permit-to-Install (PSD)', {
    category: 3,
    parentId: permitPlant.id,
  });
  const modeling = activity(permits, 211, 'Dispersion modeling protocol', {
    category: 2,
    parentId: airPermit.id,
  });
  const ptiApp = activity(permits, 212, 'Submit the PTI application', {
    category: 3,
    parentId: airPermit.id,
  });
  const draftPti = activity(permits, 213, 'Draft permit and BACT review', {
    category: 3,
    parentId: airPermit.id,
  });
  const ptiComment = activity(permits, 214, 'Public comment period', {
    category: 3,
    parentId: airPermit.id,
  });
  const ptiExpiry = activity(permits, 215, 'PTI construction-commence clock runs out Nov 2022 — extend?', {
    category: 6,
    parentId: permitPlant.id,
  });
  const wetlands = activity(permits, 220, 'USACE Section 404 / Ohio 401', {
    category: 3,
    parentId: permitPlant.id,
  });
  const npdes = activity(permits, 221, 'NPDES construction stormwater', {
    category: 3,
    parentId: permitPlant.id,
  });
  const faa = activity(permits, 222, 'FAA Form 7460 — stack height', {
    category: 3,
    parentId: permitPlant.id,
  });
  const water = activity(permits, 223, 'River or municipal effluent?', {
    category: 7,
    parentId: permitPlant.id,
  });
  const pilot = activity(permits, 224, 'Township PILOT agreement', {
    category: 4,
    parentId: permitPlant.id,
  });
  const cultural = activity(permits, 225, 'Cultural survey', {
    category: 2,
    parentId: permitPlant.id,
  });
  const delineation = activity(permits, 226, 'Wetland delineation', {
    category: 2,
    parentId: permitPlant.id,
  });

  // --- interconnection (PJM queue) ------------------------------------------
  const interconnect = activity(queue, 300, 'Interconnect 710 MW at 345 kV', { category: 1 });
  const queueEntry = activity(queue, 301, 'Enter the PJM queue — AE1', {
    category: 1,
    parentId: interconnect.id,
  });
  const feasibility = activity(queue, 302, 'Feasibility Study', {
    agentName: 'PJM',
    agentProvider: 'pjm',
    category: 2,
    parentId: interconnect.id,
  });
  const sis = activity(queue, 303, 'System Impact Study', {
    agentName: 'PJM',
    agentProvider: 'pjm',
    category: 2,
    parentId: interconnect.id,
  });
  const contestCost = activity(queue, 304, 'Contest the $148M upgrade allocation?', {
    category: 6,
    parentId: interconnect.id,
  });
  const facilities = activity(queue, 305, 'Facilities Study', {
    agentName: 'PJM',
    agentProvider: 'pjm',
    category: 2,
    parentId: interconnect.id,
  });
  const isa = activity(queue, 306, 'Interconnection Service Agreement', {
    category: 4,
    parentId: interconnect.id,
  });
  const csa = activity(queue, 307, 'Construction Service Agreement', {
    category: 4,
    parentId: interconnect.id,
  });
  const queueReform = activity(queue, 308, 'PJM is moving to clusters — are we grandfathered?', {
    category: 6,
    parentId: interconnect.id,
  });
  const modelValidation = activity(queue, 310, 'Generator model validation (PSS/E, PSCAD)', {
    agentName: 'PJM',
    agentProvider: 'pjm',
    category: 2,
    parentId: interconnect.id,
  });

  // --- transmission (network upgrades, built by the TO) --------------------
  const upgrades = activity(tx, 400, 'Network upgrades', {
    category: 5,
  });
  const station = activity(tx, 401, 'Sable Creek 345 kV switching station', {
    category: 5,
    parentId: upgrades.id,
  });
  const stationDesign = activity(tx, 402, 'Design — breaker-and-a-half, six positions', {
    category: 2,
    parentId: station.id,
  });
  const longLead = activity(tx, 403, 'Long-lead procurement — 345 kV breakers', {
    category: 6,
    parentId: upgrades.id,
  });
  const stationCivil = activity(tx, 404, 'Site civil and foundations', {
    category: 5,
    parentId: station.id,
  });
  const stationSteel = activity(tx, 405, 'Steel, bus, and equipment', {
    category: 5,
    parentId: station.id,
  });
  const pAndC = activity(tx, 406, 'Protection, control, and SCADA', {
    category: 5,
    parentId: station.id,
  });
  const stationEnergize = activity(tx, 407, 'Commission and energize the station', {
    category: 1,
    parentId: station.id,
  });
  const rebuild = activity(tx, 410, 'Rebuild Sammis–Wylie Ridge 345 kV, 14 miles', {
    category: 5,
    parentId: upgrades.id,
  });
  const row = activity(tx, 411, 'Route, right-of-way, and easements', {
    category: 4,
    parentId: rebuild.id,
  });
  const outageWindow = activity(tx, 412, 'When can it come out?', {
    category: 7,
    parentId: rebuild.id,
  });
  const outage1 = activity(tx, 413, 'Structures and conductor — outage 1, miles 0–7', {
    category: 5,
    parentId: rebuild.id,
  });
  const outage2 = activity(tx, 414, 'Structures and conductor — outage 2, miles 7–14', {
    category: 5,
    parentId: rebuild.id,
  });
  const lon = activity(tx, 420, 'OPSB notification', {
    category: 3,
    parentId: upgrades.id,
  });
  const genTie = activity(tx, 421, 'Gen-tie — 2.1 miles of 345 kV from the plant', { category: 5 });
  const backfeed = activity(tx, 422, 'Backfeed the plant', {
    category: 1,
    parentId: upgrades.id,
  });

  // --- fuel -----------------------------------------------------------------
  const gas = activity(fuel, 500, 'Firm gas to the fence', { category: 4 });
  const whichPipe = activity(fuel, 501, 'REX four miles south, or TETCO eleven miles east?', {
    category: 7,
    parentId: gas.id,
  });
  const precedent = activity(fuel, 502, 'Precedent agreement with REX', {
    category: 4,
    parentId: gas.id,
  });
  const whoBuilds = activity(fuel, 503, 'Who owns it?', {
    category: 7,
    parentId: gas.id,
  });
  const fercPath = activity(fuel, 504, 'Full 7(c) certificate, or prior notice under the blanket?', {
    category: 7,
    parentId: gas.id,
  });
  const priorNotice = activity(fuel, 505, 'FERC prior-notice filing', {
    category: 3,
    parentId: gas.id,
  });
  const lateralSurvey = activity(fuel, 506, 'Lateral survey and easements', {
    category: 4,
    parentId: gas.id,
  });
  const lateralBuild = activity(fuel, 507, 'Build the lateral', {
    category: 5,
    parentId: gas.id,
  });
  const meterStation = activity(fuel, 508, 'Meter station', {
    category: 5,
    parentId: gas.id,
  });
  const firmService = activity(fuel, 509, 'Firm transportation service begins', {
    category: 1,
    parentId: gas.id,
  });
  const dualFuel = activity(fuel, 511, 'Dual fuel?', {
    category: 6,
    parentId: gas.id,
  });

  // --- construction (EPC) ---------------------------------------------------
  const buildPlant = activity(build, 600, 'Build the plant', {
    category: 5,
  });
  const sitePrep = activity(build, 601, 'Site prep and grading', {
    parentId: buildPlant.id,
  });
  const foundations = activity(build, 602, 'Foundations — turbine pedestals', {
    parentId: buildPlant.id,
  });
  const underground = activity(build, 603, 'Underground utilities and piping', {
    parentId: buildPlant.id,
  });
  const turbineDelivery = activity(build, 604, 'Turbine delivery — barge to Wellsville, SPMT nine miles', {
    category: 1,
    parentId: buildPlant.id,
  });
  const gtSet = activity(build, 605, 'Set the gas turbines', {
    parentId: buildPlant.id,
  });
  const hrsg = activity(build, 606, 'HRSG erection', {
    parentId: buildPlant.id,
  });
  const steamTurbine = activity(build, 607, 'Steam turbine and generator', {
    parentId: buildPlant.id,
  });
  const coolingTower = activity(build, 608, 'Hybrid cooling tower', {
    parentId: buildPlant.id,
  });
  const gsu = activity(build, 609, 'Generator step-up transformers', {
    parentId: buildPlant.id,
  });
  const pipefitters = activity(build, 610, 'Short 80 pipefitters', {
    category: 6,
    parentId: buildPlant.id,
  });
  const firstFire1 = activity(build, 611, 'First fire — GT1', {
    category: 1,
    parentId: buildPlant.id,
  });
  const firstFire2 = activity(build, 612, 'First fire — GT2', {
    category: 1,
    parentId: buildPlant.id,
  });
  const steamBlows = activity(build, 613, 'Steam blows', {
    parentId: buildPlant.id,
  });
  const firstSync = activity(build, 614, 'First synchronization to the 345 kV', {
    category: 1,
    parentId: buildPlant.id,
  });
  const ccTuning = activity(build, 615, 'Combined-cycle operation and tuning', {
    parentId: buildPlant.id,
  });
  const perfTest = activity(build, 616, 'Performance test', {
    category: 2,
    parentId: buildPlant.id,
  });
  const substantial = activity(build, 617, 'Substantial completion', {
    category: 1,
    parentId: buildPlant.id,
  });
  const stackTest = activity(build, 618, 'Stack and compliance testing', {
    category: 3,
    parentId: buildPlant.id,
  });

  // --- market ---------------------------------------------------------------
  const becomeGenerator = activity(market, 700, 'Become a PJM generator', { category: 4 });
  const membership = activity(market, 701, 'PJM membership application', {
    category: 4,
    parentId: becomeGenerator.id,
  });
  const credit = activity(market, 702, 'Credit application', {
    category: 4,
    parentId: becomeGenerator.id,
  });
  const whichBra = activity(market, 703, 'Which delivery year?', {
    category: 7,
    parentId: becomeGenerator.id,
  });
  const bra = activity(market, 704, 'Offer into the 2026/27 Base Residual Auction', {
    category: 1,
    parentId: becomeGenerator.id,
  });
  const nerc = activity(market, 705, 'NERC registration — GO and GOP', {
    category: 3,
    parentId: becomeGenerator.id,
  });
  const gopChoice = activity(market, 706, 'Own desk, or contract GOP?', {
    category: 7,
    parentId: becomeGenerator.id,
  });
  const telemetry = activity(market, 707, 'Markets Gateway, eDART, ICCP telemetry', {
    category: 5,
    parentId: becomeGenerator.id,
  });
  const metering = activity(market, 708, 'Revenue metering and InSchedule', {
    category: 4,
    parentId: becomeGenerator.id,
  });
  const testEnergy = activity(market, 709, 'Schedule test energy', {
    category: 4,
    parentId: becomeGenerator.id,
  });
  const ancillary = activity(market, 710, 'Regulation and synchronized reserve qualification', {
    category: 2,
    parentId: becomeGenerator.id,
  });
  const cpRisk = activity(market, 711, 'Insure CP risk?', {
    category: 6,
    parentId: becomeGenerator.id,
  });
  const eia = activity(market, 712, 'EIA-860 and EIA-923 reporting', {
    category: 3,
    parentId: becomeGenerator.id,
  });
  const operate = activity(market, 713, 'Operate in the PJM markets', { category: 1 });

  let eventId = 60000;
  const ev = (
    isoDate: string,
    phase: EventPhase,
    item: Activity,
    message?: string,
    dayOffset = 0,
  ): TraceEvent => {
    eventId += 1;
    return {
      id: eventId,
      timestamp: on(isoDate, dayOffset),
      phase,
      activity: item,
      message,
    };
  };

  const events: TraceEvent[] = [
    // --- 2016–17: the need, before there is a project ---------------------
    ev('2016-03-14', 'Q', need, 'Coal is leaving. Data centers are not here yet. Is the gap real?'),
    ev('2016-03-14', 'B', retirements, undefined, 1),
    ev('2016-04-04', 'B', loadForecast),
    ev('2016-05-16', 'B', capacitySignal, 'BRA results for ATSI and AEP.'),
    ev('2016-06-20', 'E', retirements, 'Sammis units staged. W.H. Sammis and others on the watch list. Gigawatts, not megawatts.'),
    ev('2016-07-11', 'E', loadForecast, 'Flat energy. Peak still grows on extreme weather. The shape is the story.'),
    ev('2016-08-01', 'Q', reserveMargin),
    ev('2016-08-22', 'V', reserveMargin, 'Holding — until the next wave of retirements clears. Do not wait for a shortage to show up in the auction.'),
    ev('2016-09-12', 'E', capacitySignal, 'Clearing prices say new entry can get paid in ATSI. Not a gold rush. Enough.'),
    ev('2016-09-19', 'V', need, 'Yes. Dispatchable capacity in the western PJM footprint, on a gas pipeline, near retiring coal.'),

    ev('2016-10-03', 'B', irpScan, 'What are the utilities telling their commissions?'),
    ev('2016-10-17', 'B', aepIrp),
    ev('2016-11-14', 'B', feIrp),
    ev('2016-12-05', 'B', ampIrp),
    ev('2017-01-16', 'E', aepIrp, 'Capacity need mid-2020s. Prefers PPAs and market purchases over owning a new CC.'),
    ev('2017-02-06', 'E', feIrp, 'ESP path. No self-build CC. Open to bilateral capacity.'),
    ev('2017-02-27', 'E', ampIrp, 'Munis want slices — 20 to 50 MW — not a 700 MW offtake.'),
    ev('2017-03-13', 'Q', rfpWatch),
    ev('2017-04-10', 'J', rfpWatch, 'No live RFP that fits a 2x1. Merchant first. Hunt offtake later.'),
    ev('2017-04-17', 'E', irpScan, 'IRPs confirm the gap. Nobody is volunteering to own the plant.'),

    // --- 2017: economic planning study ------------------------------------
    ev('2017-05-01', 'B', econStudy, 'Pencil a merchant CC before we touch a parcel.'),
    ev('2017-05-01', 'B', screeningCurve, undefined, 1),
    ev('2017-05-22', 'B', sparkSpread),
    ev('2017-06-12', 'B', capacityRev),
    ev('2017-07-03', 'E', screeningCurve, 'Simple CT loses on heat rate. Solar + storage does not cover the winter peak we are selling into. CC wins the mid-merit band.'),
    ev('2017-07-24', 'E', sparkSpread, 'REX Zone 3 basis is friendly. On-peak spark supports a 6,400 heat-rate machine in ATSI.'),
    ev('2017-08-14', 'E', capacityRev, 'CP risk is real. Model a UCAP haircut and a non-performance year. Still clears the hurdle with a hedge.'),
    ev('2017-08-21', 'Q', carbonRisk),
    ev('2017-09-11', 'V', carbonRisk, 'Sensitivity, not a veto. Underwrite with a carbon adder in year ten. Board can live with it.'),
    ev('2017-09-18', 'Q', techChoice, 'F-class is cheaper. H-class is the heat rate.'),
    ev('2017-10-09', 'V', techChoice, '2x1 H-class. ~710 MW net. The heat rate is the product.'),
    ev('2017-10-16', 'E', econStudy, 'Merchant CC pencils in ATSI/AEP with capacity + spark + a hedge. Go find land.'),

    // --- 2017–18: where, then which dirt ----------------------------------
    ev('2017-11-06', 'Q', whereZone),
    ev('2017-11-06', 'Q', atsiVsAep, undefined, 1),
    ev('2017-11-27', 'B', gasBasis),
    ev('2017-12-18', 'B', congestion),
    ev('2018-01-22', 'E', gasBasis, 'REX Zone 3 beats TETCO M3 on a delivered basis for a plant sitting on the lateral.'),
    ev('2018-02-12', 'E', congestion, 'Sammis–Wylie Ridge already binds. Expect that to show up in the SIS as upgrades we pay for.'),
    ev('2018-02-26', 'V', atsiVsAep, 'ATSI. Retiring coal, REX nearby, capacity prices that clear new entry.'),
    ev('2018-03-05', 'V', whereZone, 'Eastern Ohio, ATSI, on REX. Accept the likely transmission bill.'),

    ev('2018-04-02', 'B', siteScreen),
    ev('2018-04-02', 'B', fatalPortfolio, undefined, 1),
    ev('2018-06-04', 'E', fatalPortfolio, 'Twelve parcels. Four die on wetlands. Two on airport approach. One on a floodway. Five survive.'),
    ev('2018-07-16', 'B', shortlist),
    ev('2018-09-10', 'E', shortlist, 'Three left: Columbiana on REX, a Jefferson County site on TETCO, a Belmont site with a harder gen-tie.'),
    ev('2018-10-15', 'B', boardGo, 'Pick Columbiana. Authorize $6M of development capital to option land and enter the queue.'),
    ev('2018-11-05', 'E', boardGo, 'Approved. Name it when the options are signed.'),
    ev('2018-11-12', 'E', siteScreen, 'Columbiana County. Kessler and Hoffman parcels. Call it Sable Creek when we file.'),

    // --- 2019: a site, a screen, a queue position -------------------------
    ev('2019-01-15', 'B', project, 'Greenfield. 340 acres. 345 kV two miles east, REX four miles south.'),
    ev('2019-01-15', 'B', siteControl, undefined, 1),
    ev('2019-01-20', 'B', fatalFlaw),
    ev('2019-02-04', 'B', kessler),
    ev('2019-03-01', 'B', hoffman),
    ev('2019-03-15', 'E', fatalFlaw, 'No karst. Wetlands are ditches. One eagle nest at 1.1 miles — outside the buffer.'),
    ev('2019-03-18', 'Q', devBudget, 'Queue deposit, OPSB application, air modeling. All before the upgrade number.'),
    ev('2019-04-01', 'V', devBudget, 'Board already authorized $6M in November. Spend it. The upgrade number is the thing we are buying.'),
    ev('2019-04-02', 'B', interconnect),
    ev('2019-04-02', 'B', queueEntry, undefined, 1),
    ev('2019-04-08', 'E', kessler, '180 acres. Five-year option.'),
    ev('2019-04-15', 'B', permitPlant),
    ev('2019-04-30', 'E', queueEntry, 'AE1-147. 710 MW CC, 345 kV. Deposit posted.'),
    ev('2019-05-06', 'B', delineation),
    ev('2019-06-03', 'B', gas),
    ev('2019-06-03', 'Q', whichPipe, undefined, 1),
    ev('2019-06-10', 'B', feasibility),
    ev('2019-06-14', 'Q', water, 'Ohio River withdrawal means a 316(b) fight. The WWTP is three miles away.'),
    ev('2019-06-28', 'E', hoffman, 'Second Hoffman parcel held out. Paid up.'),
    ev('2019-06-30', 'E', siteControl, 'Options on all 340 acres across three parcels.'),
    ev('2019-07-08', 'B', cultural),
    ev('2019-09-09', 'B', preApp),
    ev('2019-09-09', 'B', opsb, undefined, -1),
    ev('2019-09-20', 'E', delineation, '2.3 acres of low-quality wetland along the drainage. Avoidable except 0.4.'),
    ev('2019-09-24', 'E', preApp, 'Sixty residents. Questions about noise, water, and traffic. Nobody asked about the gas.'),
    ev('2019-11-15', 'E', cultural, 'Two prehistoric lithic scatters. Neither eligible for the Register.'),
    ev('2019-12-06', 'V', whichPipe, 'REX. Zone 3. Shorter lateral, and the flow is west to east.'),
    ev('2019-12-16', 'B', fileOpsb),

    // --- 2020: studies and permits, in parallel, slowly -------------------
    ev('2020-01-13', 'E', feasibility, 'Feasible at 345 kV. Overloads on Sammis–Wylie Ridge. Costs deferred to the SIS.'),
    ev('2020-01-14', 'B', airPermit),
    ev('2020-01-14', 'B', modeling, undefined, 1),
    ev('2020-01-20', 'Q', revenue, 'Deregulated state. Nobody is obligated to buy from us.'),
    ev('2020-02-03', 'Q', ppa),
    ev('2020-02-10', 'B', precedent),
    ev('2020-02-14', 'E', fileOpsb, 'Application complete. Docket opened.'),
    ev('2020-03-02', 'B', sis),
    ev('2020-03-09', 'B', wetlands),
    ev('2020-04-06', 'B', pilot),
    ev('2020-04-10', 'E', modeling, 'AERMOD. Protocol accepted with a request for a Class I visibility screen.'),
    ev('2020-05-04', 'B', ptiApp),
    ev('2020-05-15', 'V', water, 'Reclaimed effluent from the East Liverpool WWTP. Hybrid cooling. No river permit.'),
    ev('2020-06-01', 'Q', whoBuilds, 'A four-mile interstate lateral. Ours, or theirs?'),
    ev('2020-06-15', 'B', faa),
    ev('2020-06-22', 'B', staffReport),
    ev('2020-07-01', 'E', ptiApp, 'Submitted. PSD for NOx, CO, PM2.5, GHG. SCR and oxidation catalyst as BACT.'),
    ev('2020-08-03', 'Q', intervene, 'Two trustees came to the pre-app meeting angry.'),
    ev('2020-08-10', 'Q', dualFuel, 'Backup ULSD for the winter?'),
    ev('2020-08-24', 'B', localHearing),
    ev('2020-08-24', 'E', localHearing, 'Forty speakers. Twenty-eight for. The PILOT did that.', 1),
    ev('2020-09-04', 'E', staffReport, 'Staff recommends approval with 34 conditions.'),
    ev('2020-09-09', 'E', faa, 'Determination of no hazard. 190-foot stacks, lit.'),
    ev('2020-09-14', 'S', sis, 'PJM: study cycle re-sequenced. Withdrawals ahead of us. Restudy.'),
    ev('2020-09-25', 'J', ppa, 'No Ohio utility is buying. The munis want 20 MW slices, not 700.'),
    ev('2020-10-05', 'B', adjudicatory),
    ev('2020-10-12', 'Q', hrco),
    ev('2020-10-19', 'E', adjudicatory, 'Three days. Township withdrew after the road-use agreement was added as a condition.'),
    ev('2020-10-20', 'V', intervene, 'They filed, then settled. Road-use and noise conditions.'),
    ev('2020-11-02', 'B', draftPti),

    // --- 2021: the permits land; the SIS finally comes back -----------------
    ev('2021-01-11', 'V', whoBuilds, 'REX builds and owns the lateral and the meter station. We pay a negotiated lateral rate.'),
    ev('2021-01-15', 'E', draftPti, 'Draft permit. BACT as proposed. NOx 2.0 ppm.'),
    ev('2021-01-19', 'B', ptiComment),
    ev('2021-02-01', 'Q', fercPath),
    ev('2021-02-11', 'B', certificate),
    ev('2021-02-11', 'E', certificate, 'Certificate issued. 34 conditions. Five-year construction commencement window.', 0.5),
    ev('2021-02-15', 'R', sis, 'Restudy underway.'),
    ev('2021-03-08', 'B', rehearing, 'Citizens group filed for rehearing.'),
    ev('2021-03-12', 'J', dualFuel, 'No. A tank farm is $40M and a second air permit fight. Take the CP risk on firm gas.'),
    ev('2021-03-22', 'E', ptiComment, 'Eleven comments. One substantive, on startup emissions. Addressed.'),
    ev('2021-04-05', 'E', precedent, 'Firm transport, 15 years, 120,000 Dth/d. Conditioned on FID by end of 2023.'),
    ev('2021-05-10', 'E', rehearing, 'Denied. No appeal to the Supreme Court filed.'),
    ev('2021-05-12', 'E', opsb, 'Final and unappealable.'),
    ev('2021-05-14', 'E', airPermit, 'Final PTI. Construction must commence within 18 months.'),
    ev('2021-06-07', 'E', pilot, '$4.2M a year for 20 years. Trustees 3–0.'),
    ev('2021-06-14', 'B', epcProc),
    ev('2021-06-14', 'B', epcRfp, undefined, 1),
    ev('2021-06-21', 'V', fercPath, 'Prior notice under the blanket certificate. 4.1 miles fits the cost limit. No full 7(c).'),
    ev('2021-08-02', 'B', turbineSlot),
    ev('2021-08-09', 'B', priorNotice),
    ev('2021-08-13', 'E', wetlands, 'Nationwide Permit 39. 0.4 acre of fill. Mitigation bank credits.'),
    ev('2021-09-10', 'E', epcRfp, 'Three bidders. One dropped after the site walk.'),
    ev('2021-09-27', 'E', sis, '$148M of network upgrades: rebuild 14 miles of Sammis–Wylie Ridge, new 345 kV switching station.'),
    ev('2021-10-04', 'Q', contestCost, 'Half of that is inherited from a project that withdrew ahead of us.'),
    ev('2021-10-18', 'B', lstk),
    ev('2021-11-08', 'B', facilities),
    ev('2021-12-17', 'E', turbineSlot, 'Two H-class slots. $30M deposit. Delivery Q3 2024.'),

    // --- 2022: the deal takes shape --------------------------------------
    ev('2022-01-14', 'E', priorNotice, 'No protests. Authorization sixty days after the notice.'),
    ev('2022-01-24', 'J', contestCost, 'Filed a comment. PJM re-tolled. $131M. Take it.'),
    ev('2022-03-07', 'B', lateralSurvey),
    ev('2022-03-11', 'V', hrco, 'Seven-year heat-rate call option with a bank on 500 MW. Rest is merchant plus capacity.'),
    ev('2022-03-14', 'V', revenue, 'HRCO for the lenders, RPM capacity for the equity, merchant energy for the upside.'),
    ev('2022-06-06', 'B', finClose),
    ev('2022-06-06', 'B', ieReport, undefined, 1),
    ev('2022-06-13', 'Q', queueReform, 'PJM is moving to clusters. If we fall into the transition cycle we lose two years.'),
    ev('2022-08-01', 'Q', ptiExpiry, 'The PTI clock runs out in November and we have not closed.'),
    ev('2022-08-19', 'E', facilities, 'Scoped and costed by ATSI. $131M network, $22M direct connection.'),
    ev('2022-09-06', 'B', isa),
    ev('2022-09-06', 'B', csa, undefined, 1),
    ev('2022-09-12', 'B', constructionLoan),
    ev('2022-10-14', 'E', ieReport, 'Technology proven. Schedule aggressive. Heat rate guarantee achievable.'),
    ev('2022-10-21', 'V', ptiExpiry, 'Extension granted to November 2023. Foundations must be in before then.'),
    ev('2022-11-18', 'E', lstk, 'Fixed price, $1.1B. Liquidated damages on schedule and on heat rate.'),
    ev('2022-11-18', 'E', epcProc, undefined, 1),
    ev('2022-11-21', 'V', queueReform, 'Yes. ISA executed before the cutoff. Legacy process.'),
    ev('2022-12-16', 'E', isa, 'ISA executed. $131M letter of credit posted as security.'),
    ev('2022-12-16', 'E', csa, undefined, 1),
    ev('2022-12-16', 'S', interconnect, 'ISA done. Waiting on ATSI construction and model validation.', 2),

    // --- 2023: rates, close, NTP ---------------------------------------------
    ev('2023-01-09', 'S', constructionLoan, 'Rates moved 300 bps in six months. Lenders repricing.'),
    ev('2023-01-16', 'Q', ratesRisk, 'Underwritten at 5%. Term sheets say 8%.'),
    ev('2023-01-23', 'B', upgrades),
    ev('2023-02-06', 'B', equity),
    ev('2023-02-13', 'E', lateralSurvey, 'Nine easements. One condemnation avoided by moving the HDD entry.'),
    ev('2023-02-13', 'S', gas, 'Easements done. Lateral waits on financial close and NTP.', 1),
    ev('2023-03-06', 'B', station),
    ev('2023-03-06', 'B', stationDesign, undefined, 1),
    ev('2023-03-13', 'B', npdes),
    ev('2023-04-03', 'B', lon, 'Letter of notification for the Sammis–Wylie rebuild.'),
    ev('2023-04-10', 'R', constructionLoan, 'Repriced. Sizing cut from $1.0B to $900M.'),
    ev('2023-04-14', 'V', ratesRisk, 'Barely. Trimmed contingency, pushed COD three months, more equity.'),
    ev('2023-05-19', 'E', npdes, 'Coverage under the general permit. SWPPP in place.'),
    ev('2023-05-26', 'E', equity, '$350M committed. Up from $250M.'),
    ev('2023-06-05', 'B', rebuild),
    ev('2023-06-05', 'B', row, undefined, 1),
    ev('2023-06-12', 'B', longLead, 'Breaker lead time is 92 weeks. Ordering before design is done.'),
    ev('2023-06-30', 'E', constructionLoan, '$900M construction loan, seven-year mini-perm.'),
    ev('2023-06-30', 'E', finClose, 'Closed. Notice to proceed issued the same afternoon.'),
    ev('2023-06-30', 'E', permitPlant, 'Every permit needed for NTP is in hand.'),
    ev('2023-06-30', 'B', buildPlant, 'NTP.', 0.2),
    ev('2023-07-10', 'B', sitePrep),
    ev('2023-08-11', 'E', lon, 'Accepted. Rebuild on existing right-of-way.'),
    ev('2023-10-02', 'B', foundations),
    ev('2023-10-20', 'E', stationDesign),
    ev('2023-10-20', 'S', station, 'Design issued. Waiting on civil mobilization and breakers.', 1),
    ev('2023-11-10', 'E', sitePrep, '340 acres graded. Laydown yard ready for the HRSG modules.'),

    // --- 2024: steel in the air, turbines on the river ---------------------
    ev('2024-01-08', 'B', underground),
    ev('2024-01-15', 'Q', outageWindow, 'A 345 kV line in an import-constrained zone.'),
    ev('2024-01-22', 'B', becomeGenerator),
    ev('2024-01-22', 'B', membership, undefined, 1),
    ev('2024-02-16', 'E', row, 'Existing ROW. Eleven new easements for the wider structures.'),
    ev('2024-03-15', 'E', foundations, 'Pedestals poured with the PTI clock at eight months left.'),
    ev('2024-04-01', 'R', station, 'Civil crews mobilize.'),
    ev('2024-04-01', 'B', stationCivil, undefined, 1),
    ev('2024-04-08', 'R', gas, 'NTP is behind us. Build the lateral.'),
    ev('2024-04-08', 'B', lateralBuild, undefined, 1),
    ev('2024-05-10', 'V', outageWindow, 'Two shoulder-season outages: October 2024 and April 2025. PJM approved.'),
    ev('2024-05-10', 'S', rebuild, 'ROW locked. Waiting on the October outage.', 1),
    ev('2024-05-24', 'E', membership, 'Member. Generation Owner sector.'),
    ev('2024-06-03', 'B', hrsg),
    ev('2024-06-10', 'B', credit),
    ev('2024-06-17', 'Q', whichBra, 'The original plan was DY 2025/26. COD is June 2026 now.'),
    ev('2024-08-05', 'B', coolingTower),
    ev('2024-08-12', 'B', genTie),
    ev('2024-08-19', 'B', meterStation),
    ev('2024-08-23', 'E', underground),
    ev('2024-08-30', 'E', credit, 'Collateral posted. Unsecured allowance approved.'),
    ev('2024-09-09', 'B', turbineDelivery),
    ev('2024-09-13', 'V', whichBra, 'Offer into the 2026/27 BRA, July 2025. Nothing for 2025/26.'),
    ev('2024-10-04', 'E', turbineDelivery, 'Two units by barge to Wellsville, then SPMT nine miles overnight. Route closed twice.'),
    ev('2024-10-07', 'R', rebuild, 'Outage 1 window opens.'),
    ev('2024-10-07', 'B', gtSet, undefined, 1),
    ev('2024-10-07', 'B', outage1, undefined, 2),
    ev('2024-10-14', 'E', stationCivil),
    ev('2024-10-15', 'B', stationSteel),
    ev('2024-10-21', 'Q', gopChoice, 'Run a 24/7 desk, or contract a Generator Operator?'),
    ev('2024-11-08', 'E', outage1, 'Miles 0–7. 1590 ACSS. Back in service a day early.'),
    ev('2024-11-08', 'S', rebuild, 'Waiting on the spring outage.', 1),
    ev('2024-11-18', 'Q', pipefitters, 'Two other plants in the valley are hiring the same hall.'),
    ev('2024-11-22', 'E', lateralBuild, '4.1 miles, 16-inch. HDD under Little Beaver Creek. Hydrotested.'),

    // --- 2025: energize the station, clear the auction ---------------------
    ev('2025-01-06', 'B', steamTurbine),
    ev('2025-01-13', 'B', nerc),
    ev('2025-01-17', 'E', gtSet),
    ev('2025-01-24', 'E', longLead, 'Breakers on site. 88 weeks.'),
    ev('2025-02-14', 'V', gopChoice, 'Contract GOP for the first two years. Our people are the plant, not the desk.'),
    ev('2025-03-03', 'B', pAndC),
    ev('2025-03-10', 'B', gsu, 'GSUs were ordered at NTP. Thirty months.'),
    ev('2025-03-14', 'V', pipefitters, 'Per-diem bump and a second shift. Recovered four of six weeks.'),
    ev('2025-03-28', 'E', meterStation),
    ev('2025-03-28', 'S', gas, 'Pipe in the ground. Firm service waits on COD.', 1),
    ev('2025-04-07', 'R', rebuild, 'Outage 2 window opens.'),
    ev('2025-04-07', 'B', outage2, undefined, 1),
    ev('2025-05-09', 'E', outage2, 'Miles 7–14. Line back in service. Rating up 40%.'),
    ev('2025-05-16', 'E', coolingTower),
    ev('2025-06-02', 'B', bra),
    ev('2025-06-06', 'E', rebuild),
    ev('2025-06-09', 'B', telemetry),
    ev('2025-06-20', 'E', hrsg),
    ev('2025-06-27', 'E', nerc, 'Registered GO and GOP with ReliabilityFirst. Compliance program stood up.'),
    ev('2025-06-30', 'E', stationSteel),
    ev('2025-07-11', 'E', steamTurbine),
    ev('2025-07-18', 'E', genTie, 'Strung and tested. Waiting on the station.'),
    ev('2025-07-25', 'E', bra, 'Cleared 650 MW UCAP at the RTO clearing price. DY 2026/27.'),
    ev('2025-08-01', 'B', metering),
    ev('2025-08-15', 'E', pAndC),
    ev('2025-08-18', 'B', stationEnergize),
    ev('2025-08-29', 'E', gsu),
    ev('2025-09-08', 'R', interconnect, 'Back for model validation.'),
    ev('2025-09-08', 'B', modelValidation, undefined, 1),
    ev('2025-10-10', 'E', stationEnergize, 'Station energized. Loop-in complete. Six positions, three used.'),
    ev('2025-10-10', 'E', station, undefined, 1),
    ev('2025-10-13', 'B', backfeed),
    ev('2025-11-07', 'E', backfeed, 'Backfeed energized. Station service from the grid. Diesels off.'),
    ev('2025-11-07', 'E', upgrades, '$131M. Eleven weeks late against the CSA. No LDs owed — outages were PJM\'s.', 1),
    ev('2025-11-14', 'E', telemetry, 'ICCP link up. eDART tickets flowing.'),
    ev('2025-12-01', 'B', firstFire1),
    ev('2025-12-03', 'E', firstFire1, 'First fire, GT1. 18:40.'),
    ev('2025-12-08', 'Q', cpRisk, 'One winter storm could be a $40M non-performance charge.'),
    ev('2025-12-12', 'E', metering, 'Metering agreement with ATSI. Meters tested. InSchedule set up.'),
    ev('2025-12-19', 'E', modelValidation, 'PSS/E and PSCAD models accepted. Dynamic study clean.'),
    ev('2025-12-19', 'E', interconnect, 'Interconnected. Six years and eight months from the queue deposit.', 1),

    // --- 2026: commissioning, COD ----------------------------------------
    ev('2026-01-05', 'R', gas, 'COD approaching. Start firm service.'),
    ev('2026-01-05', 'B', firmService, undefined, 1),
    ev('2026-01-12', 'B', firstFire2),
    ev('2026-01-14', 'E', firstFire2, 'GT2 lit.'),
    ev('2026-01-19', 'B', steamBlows),
    ev('2026-02-02', 'B', testEnergy),
    ev('2026-02-13', 'E', steamBlows, 'Targets clean after 31 blows.'),
    ev('2026-02-16', 'B', firstSync),
    ev('2026-02-18', 'E', firstSync, 'GT1 on the 345 kV at 03:12. 40 MW. Then 180.'),
    ev('2026-02-20', 'J', cpRisk, 'No product priced for it. Firm gas, and a dual-fuel study for year two.'),
    ev('2026-03-02', 'B', ccTuning),
    ev('2026-03-06', 'E', firmService, 'Firm service commenced. 120,000 Dth/d at the fence.'),
    ev('2026-03-06', 'E', gas, undefined, 1),
    ev('2026-04-06', 'B', stackTest),
    ev('2026-04-13', 'B', ancillary),
    ev('2026-04-24', 'E', ccTuning, 'Both trains in combined cycle. Emissions tuned across the load range.'),
    ev('2026-05-04', 'B', perfTest),
    ev('2026-05-04', 'B', cod, undefined, 1),
    ev('2026-05-08', 'E', stackTest, 'All pollutants under permit limits. Startup NOx tight but passing.'),
    ev('2026-05-15', 'E', ancillary, 'Regulation and synchronized reserve tests passed.'),
    ev('2026-05-18', 'B', eia),
    ev('2026-05-20', 'E', perfTest, 'Net 712 MW. Heat rate 6,390 Btu/kWh HHV, forty under the guarantee.'),
    ev('2026-05-22', 'E', eia),
    ev('2026-05-26', 'E', testEnergy, 'Test energy done. 41 GWh delivered during commissioning.'),
    ev('2026-05-28', 'B', substantial),
    ev('2026-05-28', 'E', substantial, 'Substantial completion certificate signed. LDs: none.', 0.5),
    ev('2026-05-28', 'E', buildPlant, 'Thirty-five months from NTP.', 0.6),
    ev('2026-06-01', 'E', cod, 'COD declared 00:00 ET. Capacity obligation begins the same hour.'),
    ev('2026-06-01', 'E', becomeGenerator, 'Capacity Performance resource. DY 2026/27.', 0.1),
    ev('2026-06-01', 'B', operate, 'First day-ahead offer submitted. 710 MW.', 0.2),
    ev('2026-06-01', 'E', project, 'From the first IRP read to COD: nine years and eight months. 710 MW.', 0.3),
  ];

  return {
    attentionShifts: [
      { thread_id: planning.id, timestamp: on('2016-03-14') },
      { thread_id: planning.id, timestamp: on('2017-05-01') },
      { thread_id: planning.id, timestamp: on('2017-11-06') },
      { thread_id: planning.id, timestamp: on('2018-04-02') },
      { thread_id: dev.id, timestamp: on('2019-01-15') },
      { thread_id: queue.id, timestamp: on('2019-04-02') },
      { thread_id: permits.id, timestamp: on('2019-04-15') },
      { thread_id: fuel.id, timestamp: on('2019-06-03') },
      { thread_id: permits.id, timestamp: on('2019-09-09') },
      { thread_id: dev.id, timestamp: on('2020-01-20') },
      { thread_id: permits.id, timestamp: on('2020-05-04') },
      { thread_id: queue.id, timestamp: on('2021-09-27') },
      { thread_id: dev.id, timestamp: on('2021-10-18') },
      { thread_id: queue.id, timestamp: on('2022-09-06') },
      { thread_id: dev.id, timestamp: on('2023-01-09') },
      { thread_id: tx.id, timestamp: on('2023-06-12') },
      { thread_id: build.id, timestamp: on('2023-06-30', 0.2) },
      { thread_id: market.id, timestamp: on('2024-01-22') },
      { thread_id: build.id, timestamp: on('2024-09-09') },
      { thread_id: tx.id, timestamp: on('2025-08-18') },
      { thread_id: build.id, timestamp: on('2025-12-01') },
      { thread_id: fuel.id, timestamp: on('2026-03-06') },
      { thread_id: build.id, timestamp: on('2026-05-04') },
      { thread_id: market.id, timestamp: on('2026-06-01', 0.2) },
    ],
    categories,
    events,
    threads: [planning, dev, permits, queue, tx, fuel, build, market],
    traceId: 6001,
    traceName: 'Sable Creek Energy Center · 2016–2026',
  };
}
