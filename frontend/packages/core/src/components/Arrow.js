import React from 'react';

const Arrow = ({ scale = 1 }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={26 * scale}
      height={9 * scale}
      viewBox={`0 0 ${26} ${9}`}
      fill="none"
    >
      <path
        d="M0.5 4C7 4.5 18.3 4.7 19.5 3.5L18 1C18 1 21.5 3.49999 25.5 4C22.5 5.00001 18 8.5 18 8.5L19.5 6C12.8333 6.16667 8 6 0.5 6.5"
        stroke="navajowhite"
        strokeWidth="0.5"
        fill="yellow"
      />
    </svg>
  );
};

export default Arrow;
