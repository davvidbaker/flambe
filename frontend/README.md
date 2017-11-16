# flame-chart🔥🔥🔥 web component

```
npm start
```

___

# Flame Chart - for keeping track of where I am and making sure I come back up for air(✍️)
- easy color changing UI
- easy editing, drag and drop?
	- add child
- off-topic-initializers(?) (like the flow events in Chrome DevTools)
- details (optional)
- multiple threads and flow events/initializers between threads

___

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

 ___
 
## Why not just fork Chrome DevTools?

 Several reasons:
 - thought I could learn more starting more from scratch
 - DevTools Frontend is a complicated beast, with much more functionality than I need. It's also *a lot* to take in.
 - I like using Redux to manage state. **DevTools is super OG fresh**. It has like no dependencies.

___

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

### Not implemented
- `S`: Spark/Conception
  - When an activity is thought up (sparked).
  - 1 activity per event (I think this makes most sense).
- `Z`: Sleep
- `W`: Wake

___

## Dependent shoutouts
*add links later*
- React DnD
- React Color
- Styled Components
- Redux
- Downshift