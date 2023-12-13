export default function ToggleOffInputIcon(props: {
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
      <g id="Remove">
        <path
          id="Ellipse 47"
          d="M30.25 19.125C30.25 26.3737 24.3737 32.25 17.125 32.25C9.87626 32.25 4 26.3737 4 19.125C4 11.8763 9.87626 6 17.125 6C24.3737 6 30.25 11.8763 30.25 19.125Z"
          stroke="var(--stak-dark-yellow)"
          strokeWidth="3"
        />
        <path
          id="Vector 8"
          d="M13 23.75L21.75 15"
          stroke="var(--stak-dark-yellow)"
          strokeWidth="3"
        />
        <path
          id="Vector 9"
          d="M21.75 23.7505L13 15.0005"
          stroke="var(--stak-dark-yellow)"
          strokeWidth="3"
        />
      </g>
    </svg>
  );
}
