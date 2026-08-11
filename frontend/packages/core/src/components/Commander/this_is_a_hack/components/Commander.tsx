import * as React from 'react';
// 🔮 might not want to rely on a modal
import Modal from 'react-modal';
import type { Styles } from 'react-modal';

import Wrapper from './Wrapper';
import Field from './Field';
import type { GetItems } from './Field';
import type { Command } from '../../../../constants/commands';
import type { FieldInput } from '../machines/field';

const modalStyles: Styles = {
  overlay: { zIndex: 20 },
  content: {
    padding: 0,
    border: 'none',
    borderRadius: 0,
    background: 'none',
    overflow: 'unset',
    right: 'unset',
    bottom: 'unset',
    position: 'unset',
  },
};

interface Props {
  appElement?: HTMLElement | HTMLElement[] | HTMLCollection | NodeList;
  commands: Command[];
  field?: FieldInput;
  getItems: GetItems;
  hideCommander: () => unknown;
  isOpen: boolean;
  onSubmit: (command: { action: Command['action'] } & Record<string, unknown>) => unknown;
}

function Commander({
  commands,
  onSubmit,
  hideCommander,
  appElement,
  isOpen,
  getItems,
  field = undefined,
}: Props) {
  return (
    <Modal
      appElement={appElement}
      style={modalStyles}
      isOpen={isOpen}
      onRequestClose={hideCommander}
    >
      <Wrapper>
        <Field
          availableCommands={commands}
          field={field}
          getItems={getItems}
          onFullyLoaded={onSubmit}
        />
      </Wrapper>
    </Modal>
  );
}

export default Commander;
