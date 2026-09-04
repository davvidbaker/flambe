import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import tinycolor from 'tinycolor2';

import {
  reorderThreads as reorderThreadsAction,
  setHiddenThreads as setHiddenThreadsAction,
  setSetting as setSettingAction,
  toggleSetting as toggleSettingAction,
} from '../actions';
import { getTimeline, getFilterExcludes } from '../reducers/timeline';
import { getUser, type AttentionShift, type UserState } from '../reducers/user';
import {
  rankThreadsByAttention,
  sortThreadsByRank,
} from '../utilities/timelineGeometry';
import ThreadFilter from './ThreadFilter';
import Toggle from './Toggle';
import Unbutton from './Unbutton';
import { colors } from '../styles';
import filterIcon from '../images/filter_icon.svg';
import type { TimelineState } from '../reducers/timeline';
import type { SettingsState } from '../reducers/settings';
import type { EntityId } from '../types/ids';
import type { Thread } from '../types/Thread';

interface Props {
  attentionDrivenThreadOrder: boolean;
  attentionShifts: AttentionShift[];
  filterExcludes?: EntityId[];
  reorderThreads: (orderedIds: EntityId[]) => unknown;
  setHiddenThreads: (hiddenIds: EntityId[]) => unknown;
  setSetting: (setting: string, value: boolean) => unknown;
  threads?: Record<string, Thread>;
  toggleSetting: (setting: string) => unknown;
}

const Panel = styled.div`
  width: 16rem;
  position: absolute;
  top: 0;
  left: 125%;
  z-index: 100;
  padding: 8px 10px;
  background: ${colors.background};
  border: 1px solid ${tinycolor(colors.background).darken(15).toString()};
  font-size: 12px;
`;

const ButtonWrap = styled.span`
  position: relative;
  display: inline-flex;
`;

const Badge = styled.span`
  position: absolute;
  top: -4px;
  right: -6px;
  min-width: 14px;
  height: 14px;
  padding: 0 3px;
  border-radius: 7px;
  background: #666;
  color: #fff;
  font-size: 9px;
  line-height: 14px;
  text-align: center;
  pointer-events: none;
`;

function cloneThreads(threads: Record<string, Thread>): Record<string, Thread> {
  return Object.fromEntries(
    Object.entries(threads).map(([id, thread]) => [id, { ...thread }]),
  );
}

const TraceThreadFilter = ({
  attentionDrivenThreadOrder,
  attentionShifts,
  filterExcludes = [],
  reorderThreads,
  setHiddenThreads,
  setSetting,
  threads = {},
  toggleSetting,
}: Props) => {
  const ranked = attentionDrivenThreadOrder
    ? rankThreadsByAttention(attentionShifts, cloneThreads(threads))
    : threads;
  const orderedThreadIds = sortThreadsByRank(ranked).map(([id]) => id);
  const hiddenCount = filterExcludes.length;

  return (
    <Toggle>
      {({ on, toggle }) => (
        <div style={{ position: 'relative' }}>
          <ButtonWrap>
            <Unbutton
              type="button"
              aria-label="Manage threads"
              onClick={toggle}
            >
              <img height="24px" src={filterIcon} alt="filter" />
            </Unbutton>
            {hiddenCount > 0 && <Badge>{hiddenCount}</Badge>}
          </ButtonWrap>
          {on && (
            <Panel>
              <ThreadFilter
                allThreads={threads}
                attentionDrivenThreadOrder={attentionDrivenThreadOrder}
                filterExcludes={filterExcludes}
                onHideChange={setHiddenThreads}
                onReorder={orderedIds => {
                  reorderThreads(orderedIds);
                  if (attentionDrivenThreadOrder) {
                    setSetting('attentionDrivenThreadOrder', false);
                  }
                }}
                onToggleAttentionOrder={() => toggleSetting('attentionDrivenThreadOrder')}
                orderedThreadIds={orderedThreadIds}
              />
            </Panel>
          )}
        </div>
      )}
    </Toggle>
  );
};

export default connect(
  (state: { timeline: TimelineState; settings: SettingsState; user: UserState }) => ({
    threads: getTimeline(state).threads,
    filterExcludes: getFilterExcludes(state),
    attentionDrivenThreadOrder: state.settings.attentionDrivenThreadOrder,
    attentionShifts: getUser(state).attentionShifts,
  }),
  dispatch => ({
    setHiddenThreads: (hiddenIds: EntityId[]) => dispatch(setHiddenThreadsAction(hiddenIds)),
    reorderThreads: (orderedIds: EntityId[]) => dispatch(reorderThreadsAction(orderedIds)),
    setSetting: (setting: string, value: boolean) => dispatch(setSettingAction(setting, value)),
    toggleSetting: (setting: string) => dispatch(toggleSettingAction(setting)),
  }),
)(TraceThreadFilter);
