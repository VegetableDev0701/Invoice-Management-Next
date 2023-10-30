function LogoSVG(props: {
  width: number | null;
  height: number | null;
  scaler: number;
}) {
  return (
    <svg
      width={props.width || 46 * props.scaler}
      height={props.height || 44 * props.scaler}
      viewBox="0 0 46 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        stroke="var(--main-border-item-color)"
        strokeWidth={4}
        strokeLinecap="round"
      >
        <path d="M23 26v-8M31.363 32V12M39.727 38V6M14.636 12v20M6.273 6v32" />
      </g>
    </svg>
  );
}

export default LogoSVG;
