function Calendar(props: { width: number | null; height: number | null }) {
  return (
    <svg
      width={props.width || 24}
      height={props.height || 25}
      viewBox="0 0 24 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x={3}
        y={6.5}
        width={18}
        height={15}
        rx={2}
        stroke="var(--stak-dark-gray)"
        strokeWidth={2}
      />
      <path
        d="M3 10.5c0-1.886 0-2.828.586-3.414C4.172 6.5 5.114 6.5 7 6.5h10c1.886 0 2.828 0 3.414.586C21 7.672 21 8.614 21 10.5H3z"
        fill="var(--stak-dark-gray)"
      />
      <path
        d="M7 3.5v3M17 3.5v3"
        stroke="var(--stak-dark-gray)"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <rect
        x={7}
        y={12.5}
        width={4}
        height={2}
        rx={0.5}
        fill="var(--stak-dark-gray)"
      />
      <rect
        x={7}
        y={16.5}
        width={4}
        height={2}
        rx={0.5}
        fill="var(--stak-dark-gray)"
      />
      <rect
        x={13}
        y={12.5}
        width={4}
        height={2}
        rx={0.5}
        fill="var(--stak-dark-gray)"
      />
      <rect
        x={13}
        y={16.5}
        width={4}
        height={2}
        rx={0.5}
        fill="var(--stak-dark-gray)"
      />
    </svg>
  );
}

export default Calendar;
