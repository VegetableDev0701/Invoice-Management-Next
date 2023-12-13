export default function ToggleOnInputIcon(props: {
  width: number | null;
  height: number | null;
}) {
  return (
    <svg
      width={props.width || 24}
      height={props.height || 24}
      viewBox="0 0 35 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="Add_square">
        <path
          id="Rectangle 1"
          d="M4.375 14.2026C4.375 10.4314 4.375 8.54578 5.54657 7.37421C6.71815 6.20264 8.60376 6.20264 12.375 6.20264H22.375C26.1462 6.20264 28.0319 6.20264 29.2034 7.37421C30.375 8.54578 30.375 10.4314 30.375 14.2026V24.2026C30.375 27.9739 30.375 29.8595 29.2034 31.0311C28.0319 32.2026 26.1462 32.2026 22.375 32.2026H12.375C8.60376 32.2026 6.71815 32.2026 5.54657 31.0311C4.375 29.8595 4.375 27.9739 4.375 24.2026V14.2026Z"
          stroke="var(--stak-dark-green)"
          strokeWidth="3"
        />
        <path
          id="Vector 52"
          d="M17.5 13.2974L17.5 24.6487"
          stroke="var(--stak-dark-green)"
          strokeWidth="3"
          strokeLinecap="square"
          strokeLinejoin="round"
        />
        <path
          id="Vector 53"
          d="M23.333 18.9729L11.6663 18.9729"
          stroke="var(--stak-dark-green)"
          strokeWidth="3"
          strokeLinecap="square"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
