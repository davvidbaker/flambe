import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import Modal from 'react-modal';
import { InputFromButton } from './Button';

function EditorExample({ startAsInput = false, inModal = false, creation = false }) {
  const [value, setValue] = useState('Current name');
  const [commits, setCommits] = useState(0);
  const [shortcuts, setShortcuts] = useState(0);
  const [formSubmits, setFormSubmits] = useState(0);
  useEffect(() => {
    const onKey = () => setShortcuts(count => count + 1);
    document.addEventListener('keydown', onKey);
    document.addEventListener('keypress', onKey);
    document.addEventListener('keyup', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('keypress', onKey);
      document.removeEventListener('keyup', onKey);
    };
  }, []);
  const editor = (
    <form onSubmit={event => { event.preventDefault(); setFormSubmits(count => count + 1); }}>
      <InputFromButton startAsInput={startAsInput} placeholderIsDefaultValue={!creation}
        submit={name => { setValue(name); setCommits(count => count + 1); }}>
        {value}
      </InputFromButton>
      <button type="button" onClick={() => setValue('A much longer displayed activity name')}>Change displayed name</button>
      <button type="button">Outside editor</button>
      <output aria-label="Commits">{commits}</output>
      <output aria-label="Document shortcuts">{shortcuts}</output>
      <output aria-label="Form submissions">{formSubmits}</output>
    </form>
  );
  return inModal ? <Modal isOpen ariaHideApp={false} contentLabel="Editor dialog">{editor}</Modal> : editor;
}

const meta = {
  title: 'Primitives/MagicButton',
  component: EditorExample,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof EditorExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Inline: Story = {};
export const StartAsInput: Story = { args: { startAsInput: true } };
export const InsideModal: Story = { args: { startAsInput: true, inModal: true } };
export const Creation: Story = { args: { creation: true } };
