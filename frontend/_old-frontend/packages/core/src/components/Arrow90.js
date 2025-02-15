import React from 'react';

const Arrow = ({ scale = 1 }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={23 * scale}
      height={11 * scale}
      viewBox={`0 0 ${23} ${11}`}
      fill="none"
    >
      <path
        d="M0.5 11C0.5 1 15.3 4.7 16.5 3.5L15 1C15 1 18.5 3.49998 22.5 4C19.5 5.00001 15 8.5 15 8.5L16.5 6C9.83334 6.16667 3 4.6768 3 11"
        stroke="navajowhite"
        strokeWidth="0.5"
        fill="yellow"
      />
    </svg>
  );
};

export default Arrow;
