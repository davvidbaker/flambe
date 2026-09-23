import { formatTimelineSnapshotJson, type TimelineSnapshot } from '../../core/src/chart';
import type { Activity } from '../../core/src/types/Activity';
import type { Category } from '../../core/src/types/Category';
import type { EntityId } from '../../core/src/types/ids';
import type { Thread } from '../../core/src/types/Thread';
import type { EventPhase, TraceEvent } from '../../core/src/types/TraceEvent';

const DAY = 24 * 60 * 60 * 1000;

const categories: Category[] = [
  { id: 1, name: 'coding', color_background: '#efc360', color_text: '#000000' },
  { id: 2, name: 'investigation', color_background: '#60a5fa', color_text: '#000000' },
  { id: 3, name: 'review', color_background: '#a78bfa', color_text: '#ffffff' },
  { id: 4, name: 'waiting', color_background: '#94a3b8', color_text: '#000000' },
  { id: 5, name: 'house', color_background: '#f59e0b', color_text: '#000000' },
];

function daysAgo(now: number, days: number): number {
  return now - days * DAY;
}

function activity(
  thread: Thread,
  fields: Omit<Activity, 'thread' | 'thread_id'> & { categories: EntityId[] },
): Activity {
  return {
    ...fields,
    thread,
    thread_id: thread.id,
  };
}

export function createExampleSnapshot(now = Date.now()): TimelineSnapshot {
  const flambe: Thread = { id: 1, name: 'flambe🔥', rank: 0 };
  const pudl: Thread = { id: 2, name: 'pudl ⚡', rank: 1 };
  const home: Thread = { id: 3, name: 'home 🔨', rank: 2 };
  const a = (
    id: number,
    name: string,
    thread: Thread,
    categoriesFor: number[],
    extra: Partial<Activity> = {},
  ) => activity(thread, { id, name, categories: categoriesFor, ...extra });

  const publicShares = a(10, 'Ship public timeline shares', flambe, [1]);
  const isJsonEnough = a(11, 'Is a frozen JSON file enough to share?', flambe, [2], {
    parent_id: publicShares.id,
    flavor: 'question',
  });
  const frozenExport = a(12, 'Freeze a viewport as snapshot JSON', flambe, [1], {
    parent_id: publicShares.id,
  });
  const clipWindow = a(13, 'Clip events to the selected window', flambe, [1], {
    parent_id: frozenExport.id,
  });
  const stripSockets = a(14, 'Strip live sockets from the fixture', flambe, [1], {
    parent_id: frozenExport.id,
  });
  const snapshotGuard = a(15, 'Write isTimelineSnapshot', flambe, [1], {
    parent_id: frozenExport.id,
  });
  const vercelViewer = a(16, 'Stand up the Vercel share viewer', flambe, [1], {
    parent_id: publicShares.id,
  });
  const vitePackage = a(17, 'Add the share-viewer Vite app', flambe, [1], {
    parent_id: vercelViewer.id,
  });
  const blobUpload = a(18, 'Upload snapshots from Phoenix to Blob', flambe, [1], {
    parent_id: vercelViewer.id,
    agent_id: 'claude:blob-upload',
    agent_name: 'Claude',
  });
  const favicon = a(19, 'Use a green flame favicon', flambe, [3], {
    parent_id: vercelViewer.id,
  });
  const routerCrash = a(20, 'Fix the /s/:id router crash', flambe, [1], {
    parent_id: vercelViewer.id,
  });
  const playground = a(21, 'JSON playground on the share homepage', flambe, [1], {
    parent_id: publicShares.id,
    agent_id: 'cursor:share-playground',
    agent_name: 'Cursor',
  });
  const cursorOwned = {
    agent_id: 'cursor:share-playground',
    agent_name: 'Cursor',
  } as const;
  const lightTheme = a(22, 'Stop defaulting the share page to dark', flambe, [1], {
    parent_id: playground.id,
    ...cursorOwned,
  });
  const dragDrop = a(23, 'Drop a local snapshot JSON file', flambe, [1], {
    parent_id: playground.id,
    ...cursorOwned,
  });
  const liveEditor = a(24, 'Edit JSON and re-render live', flambe, [1], {
    parent_id: playground.id,
    ...cursorOwned,
  });
  const persistLocal = a(25, 'Persist the editor in localStorage', flambe, [1], {
    parent_id: liveEditor.id,
    ...cursorOwned,
  });
  const loginChrome = a(26, 'Reuse the login border and logo', flambe, [3], {
    parent_id: playground.id,
    ...cursorOwned,
  });
  const monthEpics = a(27, 'Show epics over months in the example', flambe, [2], {
    parent_id: playground.id,
    ...cursorOwned,
  });

  const fercGlue = a(30, 'Glue FERC 1 plants onto EIA-860', pudl, [1]);
  const readFerc = a(31, 'Read the FERC 1 plant table', pudl, [2], { parent_id: fercGlue.id });
  const sketchJoin = a(32, 'Sketch the plant_id_eia join', pudl, [2], { parent_id: fercGlue.id });
  const mysteryOrispl = a(33, 'Map mystery ORISPL codes', pudl, [2], { parent_id: fercGlue.id });
  const oregonSheet = a(34, 'Oregon mills spreadsheet', pudl, [2], { parent_id: mysteryOrispl.id });
  const cogenQuestion = a(35, 'Are these co-gens or paper mills?', pudl, [2], {
    parent_id: mysteryOrispl.id,
    flavor: 'question',
  });
  const handMap = a(36, 'Hand-map 12 leftover plants', pudl, [1], { parent_id: mysteryOrispl.id });
  const diffRespondents = a(37, 'Diff 2024 vs 2025 FERC respondents', pudl, [2], {
    parent_id: fercGlue.id,
  });
  const reviewJoin = a(38, 'Review join coverage', pudl, [3], { parent_id: fercGlue.id });

  const annualRebuild = a(40, '2026 pudl.sqlite rebuild', pudl, [1]);
  const bumpSchema = a(41, 'Bump the parquet schema version', pudl, [1], {
    parent_id: annualRebuild.id,
  });
  const waitShapefile = a(42, 'Wait on the Census shapefile', pudl, [4], {
    parent_id: annualRebuild.id,
  });
  const rebuildTables = a(43, 'Rebuild core output tables', pudl, [1], {
    parent_id: annualRebuild.id,
  });
  const spotCheck = a(44, 'Spot-check EIA-923 generation', pudl, [3], {
    parent_id: annualRebuild.id,
  });

  const form1Harvest = a(50, '2026 FERC Form 1 harvest', pudl, [2]);
  const downloadXbrl = a(51, 'Download the XBRL zip', pudl, [1], { parent_id: form1Harvest.id });
  const parseFilings = a(52, 'Parse the 2026 filings', pudl, [1], { parent_id: form1Harvest.id });
  const flagDupes = a(53, 'Flag duplicate utility_id_ferc1', pudl, [2], {
    parent_id: parseFilings.id,
  });

  const upstairsBath = a(60, 'Finish the upstairs bath', home, [5]);
  const demoTile = a(61, 'Demo the pink tile', home, [5], { parent_id: upstairsBath.id });
  const keepTub = a(62, 'Keep the clawfoot tub?', home, [2], {
    parent_id: upstairsBath.id,
    flavor: 'question',
  });
  const orderVanity = a(63, 'Order the walnut vanity', home, [5], { parent_id: upstairsBath.id });
  const plumbingRough = a(64, 'Plumbing rough-in', home, [5], { parent_id: upstairsBath.id });
  const tileShower = a(65, 'Tile the shower', home, [5], { parent_id: upstairsBath.id });
  const hangVanity = a(66, 'Hang the vanity', home, [5], { parent_id: upstairsBath.id });
  const punchList = a(67, 'Caulk and punch list', home, [3], { parent_id: upstairsBath.id });

  const backsplash = a(70, 'Kitchen backsplash', home, [5]);
  const pickGrout = a(71, 'Pick a grout color', home, [2], { parent_id: backsplash.id });
  const cutTile = a(72, 'Cut the subway tile', home, [5], { parent_id: backsplash.id });
  const waitThinset = a(73, 'Wait for thinset to cure', home, [4], { parent_id: backsplash.id });
  const groutBacksplash = a(74, 'Grout the backsplash', home, [5], { parent_id: backsplash.id });

  const sideFence = a(80, 'Fence the side yard', home, [5]);
  const measureLot = a(81, 'Measure the lot line', home, [2], { parent_id: sideFence.id });
  const permitQuestion = a(82, 'Do we need a fence permit?', home, [2], {
    parent_id: sideFence.id,
    flavor: 'question',
  });
  const digPosts = a(83, 'Dig the post holes', home, [5], { parent_id: sideFence.id });

  let eventId = 100;
  const events: TraceEvent[] = [];
  const ev = (days: number, phase: EventPhase, act: Activity, message?: string) => {
    events.push({
      id: eventId,
      timestamp: daysAgo(now, days),
      phase,
      activity: act,
      ...(message ? { message } : {}),
    });
    eventId += 1;
  };

  // One stack per thread: parents stay open, siblings never overlap.
  ev(120, 'B', fercGlue, 'Started');
  ev(119, 'B', readFerc);
  ev(118, 'B', upstairsBath, 'Started');
  ev(117, 'B', demoTile);
  ev(114, 'E', readFerc, 'Plant table is 2014–2024');
  ev(113, 'B', sketchJoin);
  ev(112, 'E', demoTile, 'Lath and plaster underneath');
  ev(111, 'Q', keepTub);
  ev(110, 'B', publicShares, 'Started');
  ev(109, 'Q', isJsonEnough, 'Do we need a live server?');
  ev(108, 'E', sketchJoin, 'Join on plant_id_eia plus report year');
  ev(106, 'V', isJsonEnough, 'A frozen file is enough');
  ev(105, 'V', keepTub, 'Keep it, refinish later');
  ev(105, 'B', frozenExport);
  ev(104, 'B', clipWindow);
  ev(100, 'E', clipWindow, 'Straddling spans clip to the window');
  ev(100, 'B', orderVanity);
  ev(99, 'B', stripSockets);
  ev(96, 'E', orderVanity, 'Eight-week lead time, hang it later');
  ev(95, 'E', stripSockets);
  ev(94, 'B', snapshotGuard);
  ev(93, 'B', plumbingRough);
  ev(91, 'E', snapshotGuard);
  ev(90, 'E', frozenExport, 'version 1 snapshots');
  ev(88, 'E', plumbingRough);
  ev(87, 'B', tileShower);
  ev(85, 'B', vercelViewer);
  ev(84, 'B', vitePackage);
  ev(78, 'E', vitePackage);
  ev(77, 'B', blobUpload);
  ev(72, 'E', blobUpload, 'Phoenix writes to Vercel Blob');
  ev(71, 'B', favicon);
  ev(70, 'E', tileShower);
  ev(69, 'E', favicon);
  ev(68, 'B', hangVanity);
  ev(68, 'B', routerCrash);
  ev(66, 'E', routerCrash);
  ev(65, 'E', vercelViewer, 'flambe-share.vercel.app');
  ev(60, 'E', hangVanity);
  ev(58, 'B', punchList);
  ev(51, 'E', punchList);
  ev(50, 'E', upstairsBath, 'First real shower');
  ev(49, 'B', backsplash);
  ev(48, 'B', pickGrout);
  ev(44, 'E', pickGrout, 'Warm gray');
  ev(43, 'B', cutTile);
  ev(38, 'E', cutTile);
  ev(37, 'B', waitThinset);
  ev(33, 'S', waitThinset, '24 hours');
  ev(28, 'R', waitThinset);
  ev(27.5, 'E', waitThinset);
  ev(27, 'B', groutBacksplash);
  ev(25, 'B', playground);
  ev(24.5, 'B', lightTheme);
  ev(23, 'E', groutBacksplash);
  ev(23, 'E', lightTheme);
  ev(22.8, 'B', dragDrop);
  ev(22, 'E', backsplash, 'No leftover tiles');
  ev(21, 'B', sideFence);
  ev(21, 'E', dragDrop);
  ev(20.5, 'B', liveEditor);
  ev(20.5, 'B', measureLot);
  ev(19, 'B', persistLocal);
  ev(19, 'E', measureLot);
  ev(18.5, 'Q', permitQuestion);
  ev(17, 'V', permitQuestion, 'Under 6 feet, no permit');
  ev(16, 'E', persistLocal);
  ev(16, 'B', digPosts);
  ev(12, 'E', liveEditor);
  ev(11.5, 'B', loginChrome);
  ev(10, 'E', loginChrome);
  ev(9.8, 'B', monthEpics);
  ev(8.5, 'E', monthEpics);
  ev(8, 'E', playground, 'Drop JSON, edit live');
  ev(100, 'B', mysteryOrispl);
  ev(98, 'B', oregonSheet);
  ev(92, 'E', oregonSheet);
  ev(91, 'Q', cogenQuestion);
  ev(88, 'V', cogenQuestion, 'Mostly paper, two cogens');
  ev(87, 'B', handMap);
  ev(80, 'X', mysteryOrispl, 'One more Oregon mill');
  ev(76, 'E', handMap, '12 plants mapped');
  ev(75, 'E', mysteryOrispl);
  ev(70, 'S', fercGlue, 'Waiting on the 2025 FERC 1 release');
  ev(42, 'R', fercGlue, '2025 FERC 1 dropped');
  ev(41, 'B', diffRespondents);
  ev(37, 'E', diffRespondents, '41 new respondents');
  ev(36, 'B', reviewJoin);
  ev(33, 'E', reviewJoin, '98.4% coverage');
  ev(32, 'E', fercGlue, 'Join holds on plant_id_eia');
  ev(31, 'B', annualRebuild);
  ev(30.5, 'B', bumpSchema);
  ev(28, 'E', bumpSchema);
  ev(27, 'B', waitShapefile);
  ev(24, 'S', waitShapefile, 'Census shapefile still missing');
  ev(22, 'R', waitShapefile, 'Shapefile landed');
  ev(21.8, 'E', waitShapefile);
  ev(21.5, 'B', rebuildTables);
  ev(18, 'E', rebuildTables);
  ev(17.8, 'B', spotCheck);
  ev(16.5, 'E', spotCheck, 'Generation totals match EIA');
  ev(16, 'E', annualRebuild, 'pudl.sqlite is 4.2 GB');
  ev(15, 'B', form1Harvest);
  ev(14.8, 'B', downloadXbrl);
  ev(13.5, 'E', downloadXbrl);
  ev(13.2, 'B', parseFilings);
  ev(8, 'B', flagDupes);
  ev(6, 'E', publicShares);

  events.sort((left, right) => left.timestamp - right.timestamp || Number(left.id) - Number(right.id));

  return {
    version: 1,
    exportedAt: now,
    viewport: {
      leftBoundaryTime: daysAgo(now, 125),
      rightBoundaryTime: now,
    },
    timeLabels: {
      absoluteTimeLabels: true,
      twelveHourClock: false,
    },
    fixture: {
      attentionShifts: [
        { thread_id: pudl.id, timestamp: daysAgo(now, 120) },
        { thread_id: home.id, timestamp: daysAgo(now, 118) },
        { thread_id: flambe.id, timestamp: daysAgo(now, 110) },
        { thread_id: pudl.id, timestamp: daysAgo(now, 100) },
        { thread_id: home.id, timestamp: daysAgo(now, 93) },
        { thread_id: flambe.id, timestamp: daysAgo(now, 85) },
        { thread_id: home.id, timestamp: daysAgo(now, 70) },
        { thread_id: pudl.id, timestamp: daysAgo(now, 70) },
        { thread_id: flambe.id, timestamp: daysAgo(now, 25) },
        { thread_id: home.id, timestamp: daysAgo(now, 21) },
        { thread_id: pudl.id, timestamp: daysAgo(now, 15) },
      ],
      categories,
      events,
      threads: [flambe, pudl, home],
      traceId: 1,
      traceName: 'Share playground',
    },
  };
}

export const formatSnapshotJson = formatTimelineSnapshotJson;

export function exampleSnapshotJson(now = Date.now()): string {
  return formatSnapshotJson(createExampleSnapshot(now));
}
