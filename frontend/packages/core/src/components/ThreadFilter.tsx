import React from 'react';
import Select from 'react-select';
import { getFilteredThreads } from '../utilities/timeline';
import type { EntityId } from '../types/ids';
import type { Thread } from '../types/Thread';

interface ThreadOption {
  label: string;
  value: EntityId;
}

type FilterThread = Thread & { suspendedActivityCount?: number };

interface Props {
  allThreads?: Record<string, FilterThread>;
  includedThreads?: ThreadOption[];
  filterExcludes: EntityId[];
  onChange: (selectedThreads: ThreadOption[]) => unknown;
}

const format = (threads: Record<string, FilterThread>): ThreadOption[] =>
  Object.entries(threads).map(([id, thread]) => ({ value: id, label: thread.name }));

const ThreadFilter = ({
  allThreads = {},
  includedThreads,
  filterExcludes,
  onChange,
}: Props) => {
  const threads = format(allThreads);

  const filteredThreads =
    includedThreads || format(getFilteredThreads(filterExcludes, allThreads));

  return (
    <Select
      aria-label="Filter threads"
      isMulti
      value={filteredThreads}
      options={threads}
      onChange={selectedThreads => onChange([...selectedThreads])}
    />
  );
};

export default ThreadFilter;

/* <Wrapper>
      {Object.entries(allThreads).map(([id, thread]) => (
        <div key={id}>
          <label>
            <Checkbox
              onChange={e => onChange(e.target.checked, id)}
              checked={Object.keys(filteredThreads)
                .map(k => Number(k))
                .includes(Number(id))}
              type="checkbox"
            />
            {thread.name}{' '}
            <span
              style={{
                color: getShamefulColor(thread.suspendedActivityCount * 5),
              }}
            >
              ({thread.suspendedActivityCount})
            </span>
          </label>
        </div>
      ))}
    </Wrapper> */
