import React, { type HTMLAttributes } from 'react';

const Panel = (props: HTMLAttributes<HTMLDivElement>) => (
  <div {...props}>{props.children}</div>
);

export default Panel
