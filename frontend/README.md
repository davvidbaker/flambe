# Flambe frontend

The active frontend is the React/Vite SPA in `packages/core`. It is served by
Vite on port 5173 during development and proxies API, auth, and WebSocket
requests to Phoenix 1.8 on port 4001.

Use Node 22 on Windows, macOS, or Linux, then run:

```text
npm ci
npm run dev
```

Use `npm run build` to place the production bundle in
`../backend/priv/static/assets`, then visit http://localhost:4001.

```text
npm run typecheck
npm run test:unit
npm run test:smoke
npm run storybook
```

These npm scripts intentionally avoid shell-specific syntax and are exercised
by native Windows CI as well as Linux CI.

Storybook renders the production Timeline / FlameChart from fixture Redux
state. It does not start Phoenix or run sagas.

---

# Flame Chart - for keeping track of where I am and making sure I come back up for air(✍️)

- easy color changing UI
- easy editing, drag and drop? - add child
- off-topic-initializers(?) (like the flow events in Chrome DevTools)
- details (optional)
- multiple threads and flow events/initializers between threads

---

## Historical notes

```
npm install
npm run dev
```

## Left out for now

- async (see line 217 of TracingModel.js)

Trace Event possible phase values from ChromeDevTools

```
 SDK.TracingModel.Phase = {
   Begin: 'B',
   End: 'E',
   Complete: 'X',
   Instant: 'I',
   AsyncBegin: 'S',
   AsyncStepInto: 'T',
   AsyncStepPast: 'p',
   AsyncEnd: 'F',
   NestableAsyncBegin: 'b',
   NestableAsyncEnd: 'e',
   NestableAsyncInstant: 'n',
   FlowBegin: 's',
   FlowStep: 't',
   FlowEnd: 'f',
   Metadata: 'M',
   Counter: 'C',
   Sample: 'P',
   CreateObject: 'N',
   SnapshotObject: 'O',
   DeleteObject: 'D'
 };
```

---

## Why not just fork Chrome DevTools?

Several reasons:

- thought I could learn more starting more from scratch
- DevTools Frontend is a complicated beast, with much more functionality than I need. It's also _a lot_ to take in.
- I like using Redux to manage state. **DevTools is super OG fresh**. It has like no dependencies.

---

## Events

**Each event only points to a single activity.**

Events that start a new activity:

- `B`: Begin
  - begin a task
- `Q`: question
  - ask a question

Events that end an activity:

- `E`: End
  - end an activity
- `V`: Resolve
  - successfully complete an activity
- `J`: Reject
  - abandon an activity

Other

- `S`: Suspend
  - suspend work on an activity
- `R`: Resume
  - resume work on an activity
- `X`: Resurrect
  - resurrect an activity and begin working on it again

### Not implemented

- `S`: Spark/Conception
  - When an activity is thought up (sparked).
  - 1 activity per event (I think this makes most sense).
- `Z`: Sleep
- `W`: Wake

---

## Dependent shoutouts

_add links later_

- React DnD
- React Color
- Styled Components
- Redux
- Downshift
