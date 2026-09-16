import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

import AppModal from './AppModal';
import { hideKeyboardShortcuts as hideKeyboardShortcutsAction } from '../actions';
import {
  KEYBOARD_SHORTCUT_SECTIONS,
  displayKey,
  isAppleKeyboardPlatform,
  type ShortcutToken,
} from '../utilities/keyboardShortcuts';

const Wrapper = styled.div`
  font-size: 12px;
  min-width: min(90vw, 480px);

  h1 {
    margin: 0 0 12px;
    font-size: 16px;
  }
`;

const Section = styled.section`
  & + & {
    margin-top: 14px;
  }

  h2 {
    margin: 0 0 6px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #777;
  }

  p {
    margin: 0 0 8px;
    color: #999;
    font-size: 0.9em;
  }
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const Row = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 4px 0;
  border-bottom: 1px solid #eee;

  &:last-child {
    border-bottom: none;
  }
`;

const Label = styled.span`
  color: #222;
`;

const Keys = styled.span`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
`;

const Kbd = styled.kbd`
  display: inline-block;
  min-width: 1.4em;
  padding: 1px 6px;
  border: 1px solid #ccc;
  border-bottom-width: 2px;
  border-radius: 3px;
  background: #f7f7f7;
  color: #333;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  line-height: 1.4;
  text-align: center;
`;

interface Props {
  hideKeyboardShortcuts: () => unknown;
  keyboardShortcutsVisible: boolean;
}

function ShortcutKeys({ keys, apple }: { keys: ShortcutToken[]; apple: boolean }) {
  return (
    <Keys>
      {keys.map((token, index) => (
        <Kbd key={`${token}-${index}`}>{displayKey(token, apple)}</Kbd>
      ))}
    </Keys>
  );
}

const KeyboardShortcuts = ({
  keyboardShortcutsVisible,
  hideKeyboardShortcuts,
}: Props) => {
  const apple = isAppleKeyboardPlatform();

  return (
    <AppModal
      contentLabel="Keyboard shortcuts"
      isOpen={keyboardShortcutsVisible}
      onRequestClose={hideKeyboardShortcuts}
      wide
    >
      <Wrapper>
        <h1>Keyboard shortcuts</h1>
        {KEYBOARD_SHORTCUT_SECTIONS.map(section => (
          <Section key={section.title}>
            <h2>{section.title}</h2>
            {section.note ? <p>{section.note}</p> : null}
            <List>
              {section.shortcuts.map(shortcut => (
                <Row key={shortcut.id}>
                  <Label>{shortcut.label}</Label>
                  <ShortcutKeys keys={shortcut.keys} apple={apple} />
                </Row>
              ))}
            </List>
          </Section>
        ))}
      </Wrapper>
    </AppModal>
  );
};

export default connect(
  (state: { keyboardShortcutsVisible: boolean }) => ({
    keyboardShortcutsVisible: state.keyboardShortcutsVisible,
  }),
  dispatch => ({
    hideKeyboardShortcuts: () => dispatch(hideKeyboardShortcutsAction()),
  }),
)(KeyboardShortcuts);
