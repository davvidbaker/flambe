import * as React from 'react';

interface Props {
  initialInputValue: string;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onSubmit: (value: string) => unknown;
  placeholder?: string;
}

function SimplePrompt({ initialInputValue, onBlur, placeholder, onSubmit }: Props) {
  const [value, setValue] = React.useState(initialInputValue);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const selectionRef = React.useRef(false);

  /* 💁 I only want this effect to run once. */
  // https://reactjs.org/docs/hooks-faq.html#is-there-something-like-instance-variables
  React.useLayoutEffect(() => {
    if (!selectionRef.current) {
      selectionRef.current = true;
      inputRef.current?.setSelectionRange(0, value.length);
    }
  });

  const maybeSubmit = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      setValue('');
      onSubmit(value);
    }
  };

  return (
    <input
      autoFocus
      type="text"
      value={value}
      onChange={e => setValue(e.target.value)}
      onKeyDown={maybeSubmit}
      placeholder={placeholder}
      onBlur={onBlur}
      ref={inputRef}
    />
  );
}

export default SimplePrompt;
