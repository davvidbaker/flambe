import * as React from 'react';
import styled from 'styled-components';
import tinycolor from 'tinycolor2';
import { limboItems } from '../utilities/limbo';
import type { ProcessedActivity } from '../utilities/processTrace';
import type { Category } from '../types/Category';
import type { EntityId } from '../types/ids';

interface Props {
  activities: Record<string, ProcessedActivity>;
  beginActivity: (id: EntityId) => unknown;
  categories: Category[];
  deleteActivity: (id: EntityId, threadId: EntityId) => unknown;
  focusActivity: (id: EntityId) => unknown;
}

const FALLBACK_FILL = '#c47b2b';
const SURFACE = '#ffffff';
const TRAY_BACKGROUND = '#f4f3f0';
const TEXT = '#262421';
const MUTED = '#6f6b63';

const Tray = styled.section`
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-top: 1px solid #d9d6d0;
  background: ${TRAY_BACKGROUND};
  color: ${TEXT};
  font-family: sans-serif;
`;

const TrayHeader = styled.header`
  min-height: 36px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 12px;
  border-bottom: 1px solid #dfdcd6;
`;

const TrayTitle = styled.strong`
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const TrayHint = styled.span`
  overflow: hidden;
  color: ${MUTED};
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Groups = styled.div`
  min-height: 0;
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  overflow: auto;
`;

const Group = styled.section`
  min-width: 0;
  padding: 9px 12px 12px;
  border-right: 1px solid #dfdcd6;

  &:last-child {
    border-right: 0;
  }
`;

const GroupHeading = styled.h3`
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 8px;
  color: ${MUTED};
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const Count = styled.span`
  min-width: 16px;
  padding: 1px 5px;
  border-radius: 10px;
  background: #e4e1dc;
  color: #57534d;
  text-align: center;
  letter-spacing: 0;
`;

const CardRail = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 0 0 5px;
`;

const Card = styled.article<{ $accent: string; $draggable: boolean; $paused: boolean }>`
  position: relative;
  box-sizing: border-box;
  width: 218px;
  min-width: 218px;
  height: 92px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #d8d5cf;
  border-top: 4px solid ${props => props.$accent};
  border-radius: 6px;
  background: ${SURFACE};
  box-shadow: 0 1px 2px rgba(35, 31, 25, 0.07);
  cursor: ${props => props.$draggable ? 'grab' : 'default'};
  opacity: ${props => props.$paused ? 0.82 : 1};
  transition: border-color 100ms ease, box-shadow 100ms ease, transform 100ms ease;

  &:hover,
  &:focus-within {
    border-color: #aaa59d;
    box-shadow: 0 3px 10px rgba(35, 31, 25, 0.13);
    transform: translateY(-1px);
  }

  &:active {
    cursor: ${props => props.$draggable ? 'grabbing' : 'default'};
  }
`;

const CardMain = styled.button`
  min-height: 0;
  flex: 1;
  padding: 9px 10px 4px;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-align: left;

  &:focus-visible {
    outline: 2px solid #4c7ac7;
    outline-offset: -2px;
  }
`;

const CardName = styled.span`
  display: -webkit-box;
  overflow: hidden;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.25;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
`;

const Metadata = styled.span`
  display: flex;
  gap: 6px;
  margin-top: 5px;
  color: ${MUTED};
  font-size: 10px;
`;

const Weight = styled.span`
  padding: 1px 5px;
  border-radius: 8px;
  background: #eeece8;
`;

const Actions = styled.div`
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  padding: 0 7px 5px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 100ms ease;

  ${Card}:hover &,
  ${Card}:focus-within & {
    opacity: 1;
    pointer-events: auto;
  }

  @media (hover: none) {
    opacity: 1;
    pointer-events: auto;
  }
`;

const Action = styled.button<{ $destructive?: boolean }>`
  padding: 2px 6px;
  border: 1px solid ${props => props.$destructive ? '#d8b0aa' : '#cbc7c0'};
  border-radius: 4px;
  background: ${SURFACE};
  color: ${props => props.$destructive ? '#9e3328' : '#4d4943'};
  cursor: pointer;
  font-size: 10px;

  &:hover {
    background: ${props => props.$destructive ? '#fff1ef' : '#f2f0ec'};
  }
`;

function swatch(activity: ProcessedActivity, categories: Category[]) {
  const category = categories.find(entry => String(entry.id) === String(activity.categories?.[0]));
  const base = category?.color_background ?? FALLBACK_FILL;
  const fill = tinycolor(base).isValid() ? tinycolor(base).toHexString() : FALLBACK_FILL;
  return { fill };
}

interface CardProps {
  activity: ProcessedActivity;
  beginActivity: Props['beginActivity'];
  categories: Category[];
  deleteActivity: Props['deleteActivity'];
  focusActivity: Props['focusActivity'];
}

function ActivityCard({
  activity,
  beginActivity,
  categories,
  deleteActivity,
  focusActivity,
}: CardProps) {
  const unstarted = activity.status === 'unstarted';
  const { fill } = swatch(activity, categories);
  const category = categories.find(entry => String(entry.id) === String(activity.categories?.[0]));
  const title = activity.name ?? 'Untitled activity';

  return (
    <Card
      $accent={fill}
      $draggable={unstarted}
      $paused={!unstarted}
      draggable={unstarted}
      onDragStart={event => {
        event.dataTransfer.setData('text/flambe-activity', String(activity.id));
      }}
    >
      <CardMain type="button" title={title} onClick={() => focusActivity(activity.id)}>
        <CardName>{title}</CardName>
        <Metadata>
          {category?.name && <span>{category.name}</span>}
          {typeof activity.weight === 'number' && Number.isFinite(activity.weight) && (
            <Weight>weight {activity.weight}</Weight>
          )}
        </Metadata>
      </CardMain>
      <Actions>
        {unstarted && activity.thread_id !== undefined && (
          <>
            <Action type="button" onClick={() => beginActivity(activity.id)}>Begin</Action>
            <Action
              type="button"
              $destructive
              onClick={() => deleteActivity(activity.id, activity.thread_id!)}
            >
              Give up
            </Action>
          </>
        )}
        {!unstarted && <span style={{ color: MUTED, fontSize: 10 }}>Select to view</span>}
      </Actions>
    </Card>
  );
}

export default function LimboPane({
  activities,
  beginActivity,
  categories,
  deleteActivity,
  focusActivity,
}: Props) {
  const items = limboItems(activities);
  const unstarted = items.filter(item => item.activity.status === 'unstarted');
  const paused = items.filter(item => item.activity.status === 'suspended');

  return (
    <Tray aria-label="Limbo">
      <TrayHeader>
        <TrayTitle>Limbo</TrayTitle>
        <TrayHint>
          {items.length === 0
            ? 'No unscheduled or paused work'
            : 'Drag unstarted work onto the timeline to schedule it'}
        </TrayHint>
      </TrayHeader>
      {items.length > 0 && (
        <Groups>
          {unstarted.length > 0 && (
            <Group>
              <GroupHeading>Not started <Count>{unstarted.length}</Count></GroupHeading>
              <CardRail>
                {unstarted.map(({ activity }) => (
                  <ActivityCard
                    key={String(activity.id)}
                    activity={activity}
                    beginActivity={beginActivity}
                    categories={categories}
                    deleteActivity={deleteActivity}
                    focusActivity={focusActivity}
                  />
                ))}
              </CardRail>
            </Group>
          )}
          {paused.length > 0 && (
            <Group>
              <GroupHeading>Paused <Count>{paused.length}</Count></GroupHeading>
              <CardRail>
                {paused.map(({ activity }) => (
                  <ActivityCard
                    key={String(activity.id)}
                    activity={activity}
                    beginActivity={beginActivity}
                    categories={categories}
                    deleteActivity={deleteActivity}
                    focusActivity={focusActivity}
                  />
                ))}
              </CardRail>
            </Group>
          )}
        </Groups>
      )}
    </Tray>
  );
}
