import React from 'react';
import ReactDOM from 'react-dom';
/* ⚠️ I have no clue why Logo isn't working... */
// import Logo from 'flambe-logo';
import Timeline from 'flambe-core';
import rawData from './rawData';

import styled from 'styled-components';

const Wrapper = styled.div`
  font-size: ${props => props.size}px;
  font-family: 'Yesteryear', cursive;
  width: max-content;
  position: relative;
  /* font-weight: bold; */

  &::after {
    content: '🔥';
    position: absolute;
    right: 0;
    transform-origin: top right;
    transform: translate(30%, 23%) scale(0.5) rotate(30deg);
    z-index: -1;
  }
`;

const Logo = ({ size }) => <Wrapper size={size}>flambé</Wrapper>;

const noop = () => {};

const getTimeline = () => rawData.timeline;
const getUser = () => rawData.user;
const state = rawData;

ReactDOM.render(
  <div>
    <header style={{ textAlign: 'center' }}>
      <div style={{ display: 'inline-block' }}>
        <Logo size={40} />
      </div>
    </header>
    <main>
      <Timeline
        addCommand={noop}
        {...{
          activities: getTimeline(state).activities,
          blocks: getTimeline(state).blocks,
          categories: getUser(state).categories,
          focusedBlockActivity_id: getTimeline(state).focusedBlockActivity_id,
          mantras: getUser(state).mantras,
          minTime: getTimeline(state).minTime,
          maxTime: getTimeline(state).maxTime,
          modifiers: state.modifiers,
          threadLevels: getTimeline(state).threadLevels,
          threads: getTimeline(state).threads,
          lastCategory_id: getTimeline(state).lastCategory_id,
          lastThread_id: getTimeline(state).lastThread_id,
          attentionShifts: getUser(state).attentionShifts,
          searchTerms: getUser(state).searchTerms,
          settings: state.settings,
          tabs: getUser(state).tabs,
          /* ⚠️ these really shouldn't be noops */
          hoverBlock: noop,
          focusBlock: noop,
          toggleThread: noop
        }}
      />
    </main>
  </div>,
  document.getElementById('app-root')
);
// const render = Component => {
//   ReactDOM.render(
//     <AppContainer>
//       <Provider store={store}>
//         <Component />
//       </Provider>
//     </AppContainer>,
//     document.getElementById('app-root')
//   );
// };

// export default render;

// render(App);

// // Hot Module Replacement API
// if (module.hot) {
//   module.hot.accept(() => {
//     render(App);
//   });
// }
