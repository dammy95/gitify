import React from 'react';

export const IconCog = ({ className = '' }: { className?: string }) => {
  return (
    <svg
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
    >
      <g className="prefix__fa-group">
        <path
          className="prefix__fa-secondary"
          fill="currentColor"
          d="M487.75 315.6l-42.6-24.6a192.62 192.62 0 000-70.2l42.6-24.6a12.11 12.11 0 005.5-14 249.2 249.2 0 00-54.7-94.6 12 12 0 00-14.8-2.3l-42.6 24.6a188.83 188.83 0 00-60.8-35.1V25.7A12 12 0 00311 14a251.43 251.43 0 00-109.2 0 12 12 0 00-9.4 11.7v49.2a194.59 194.59 0 00-60.8 35.1L89.05 85.4a11.88 11.88 0 00-14.8 2.3 247.66 247.66 0 00-54.7 94.6 12 12 0 005.5 14l42.6 24.6a192.62 192.62 0 000 70.2l-42.6 24.6a12.08 12.08 0 00-5.5 14 249 249 0 0054.7 94.6 12 12 0 0014.8 2.3l42.6-24.6a188.54 188.54 0 0060.8 35.1v49.2a12 12 0 009.4 11.7 251.43 251.43 0 00109.2 0 12 12 0 009.4-11.7v-49.2a194.7 194.7 0 0060.8-35.1l42.6 24.6a11.89 11.89 0 0014.8-2.3 247.52 247.52 0 0054.7-94.6 12.36 12.36 0 00-5.6-14.1zm-231.4 36.2a95.9 95.9 0 1195.9-95.9 95.89 95.89 0 01-95.9 95.9z"
          opacity={0.4}
        />
        <path
          className="prefix__fa-primary"
          fill="currentColor"
          d="M256.35 319.8a63.9 63.9 0 1163.9-63.9 63.9 63.9 0 01-63.9 63.9z"
        />
      </g>
    </svg>
  );
};
