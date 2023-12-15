import * as React from 'react';

interface SvgProps {
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

const ArrowSVG = ({ ...props }: SvgProps) => {
  const { width = 20, height = 20, color = 'inherit', className } = props;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 20 20"
      fill="inherit"
      aria-hidden="true"
      className={className}
    >
      <path
        fill={color}
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export default ArrowSVG;
