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

  ev(120, 'B', fercGlue, 'Started');
  ev(118, 'B', upstairsBath, 'Started');
  ev(117, 'B', demoTile);
  ev(119, 'B', readFerc);
  ev(113, 'E', readFerc, 'Plant table is 2014–2024');
  ev(112, 'E', demoTile, 'Lath and plaster underneath');
  ev(111, 'Q', keepTub);
  ev(114, 'B', sketchJoin);
  ev(110, 'B', publicShares, 'Started');
  ev(109, 'Q', isJsonEnough, 'Do we need a live server?');
  ev(108, 'E', sketchJoin, 'Join on plant_id_eia plus report year');
  ev(106, 'V', isJsonEnough, 'A frozen file is enough');
  ev(105, 'V', keepTub, 'Keep it, refinish later');
  ev(105, 'B', frozenExport);
  ev(104.5, 'B', orderVanity);
  ev(104, 'B', clipWindow);
  ev(100, 'B', mysteryOrispl);
  ev(100, 'B', stripSockets);
  ev(98, 'B', oregonSheet);
  ev(98, 'E', clipWindow, 'Straddling spans clip to the window');
  ev(96, 'B', snapshotGuard);
  ev(95, 'Q', cogenQuestion);
  ev(93, 'E', stripSockets);
  ev(92, 'V', cogenQuestion, 'Mostly paper, two cogens');
  ev(91, 'E', snapshotGuard);
  ev(90, 'E', frozenExport, 'version 1 snapshots');
  ev(90, 'B', handMap);
  ev(89, 'S', orderVanity, 'Eight-week lead time');
  ev(88, 'E', oregonSheet);
  ev(85, 'B', vercelViewer);
  ev(84, 'B', vitePackage);
  ev(80, 'B', blobUpload);
  ev(78, 'E', vitePackage);
  ev(75, 'E', handMap, '12 plants mapped');
  ev(75, 'E', mysteryOrispl);
  ev(74.5, 'R', orderVanity, 'Vanity shipped');
  ev(74, 'B', favicon);
  ev(73, 'E', orderVanity);
  ev(72.5, 'B', plumbingRough);
  ev(72, 'E', blobUpload, 'Phoenix writes to Vercel Blob');
  ev(71, 'B', routerCrash);
  ev(70, 'E', favicon);
  ev(70, 'S', fercGlue, 'Waiting on the 2025 FERC 1 release');
  ev(66, 'E', routerCrash);
  ev(65.5, 'E', plumbingRough);
  ev(65, 'E', vercelViewer, 'flambe-share.vercel.app');
  ev(64, 'B', tileShower);
  ev(60, 'B', annualRebuild);
  ev(59, 'B', bumpSchema);
  ev(54, 'E', bumpSchema);
  ev(52, 'B', waitShapefile);
  ev(50, 'S', annualRebuild, 'Census shapefile still missing');
  ev(50, 'S', waitShapefile);
  ev(48, 'B', backsplash);
  ev(47, 'B', pickGrout);
  ev(44, 'E', pickGrout, 'Warm gray');
  ev(42, 'R', fercGlue, '2025 FERC 1 dropped');
  ev(41, 'B', diffRespondents);
  ev(40, 'E', tileShower);
  ev(39.5, 'B', hangVanity);
  ev(38, 'B', cutTile);
  ev(36, 'E', hangVanity);
  ev(36, 'E', diffRespondents, '41 new respondents');
  ev(35.5, 'E', cutTile);
  ev(35.2, 'B', waitThinset);
  ev(35, 'B', reviewJoin);
  ev(34.5, 'B', punchList);
  ev(33, 'S', waitThinset, '24 hours');
  ev(32, 'E', reviewJoin, '98.4% coverage');
  ev(32, 'E', fercGlue, 'Join holds on plant_id_eia');
  ev(30, 'E', punchList);
  ev(29, 'E', upstairsBath, 'First real shower');
  ev(28, 'R', annualRebuild, 'Shapefile landed');
  ev(28, 'R', waitShapefile);
  ev(27.8, 'R', waitThinset);
  ev(27.5, 'E', waitShapefile);
  ev(27.2, 'E', waitThinset);
  ev(27, 'B', rebuildTables);
  ev(26.5, 'B', groutBacksplash);
  ev(25, 'B', playground);
  ev(24.5, 'B', lightTheme);
  ev(23, 'B', dragDrop);
  ev(22, 'E', lightTheme);
  ev(22, 'B', spotCheck);
  ev(20, 'B', liveEditor);
  ev(20, 'E', rebuildTables);
  ev(19, 'B', persistLocal);
  ev(18.5, 'E', dragDrop);
  ev(17.5, 'E', spotCheck, 'Generation totals match EIA');
  ev(16, 'E', annualRebuild, 'pudl.sqlite is 4.2 GB');
  ev(15.5, 'E', groutBacksplash);
  ev(15, 'E', backsplash, 'No leftover tiles');
  ev(14.5, 'B', sideFence);
  ev(14.2, 'B', measureLot);
  ev(14, 'B', form1Harvest);
  ev(14, 'E', persistLocal);
  ev(13.5, 'B', downloadXbrl);
  ev(13.2, 'E', measureLot);
  ev(13.1, 'Q', permitQuestion);
  ev(13, 'B', loginChrome);
  ev(12, 'E', downloadXbrl);
  ev(12, 'B', parseFilings);
  ev(11.8, 'V', permitQuestion, 'Under 6 feet, no permit');
  ev(11, 'B', monthEpics);
  ev(9.5, 'E', loginChrome);
  ev(8.2, 'E', monthEpics);
  ev(8, 'E', liveEditor);
  ev(8, 'B', flagDupes);
  ev(8, 'E', playground, 'Drop JSON, edit live');
  ev(7.5, 'B', digPosts);
  ev(6, 'E', publicShares);
  ev(4, 'X', mysteryOrispl, 'One more Oregon mill');

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
        { thread_id: home.id, timestamp: daysAgo(now, 89) },
        { thread_id: flambe.id, timestamp: daysAgo(now, 85) },
        { thread_id: pudl.id, timestamp: daysAgo(now, 70) },
        { thread_id: home.id, timestamp: daysAgo(now, 64) },
        { thread_id: pudl.id, timestamp: daysAgo(now, 60) },
        { thread_id: home.id, timestamp: daysAgo(now, 48) },
        { thread_id: pudl.id, timestamp: daysAgo(now, 42) },
        { thread_id: flambe.id, timestamp: daysAgo(now, 25) },
        { thread_id: home.id, timestamp: daysAgo(now, 14.5) },
        { thread_id: pudl.id, timestamp: daysAgo(now, 14) },
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
