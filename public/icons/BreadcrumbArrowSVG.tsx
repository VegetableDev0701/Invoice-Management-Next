function BreadcrumbArrow(props: {
  width: number | null;
  height: number | null;
}) {
  return (
    <svg
      width={props.width || 14}
      height={props.height || 14}
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 4h5.25l2.917 3.5L8.25 11H3V4z"
        fill="var(--stak-dark-yellow)"
      />
    </svg>
  );
}

export default BreadcrumbArrow;
