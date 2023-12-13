function Avatar(props: {
  width: number | null;
  height: number | null;
  scaler: number;
}) {
  return (
    <svg
      width={props.width || 50 * props.scaler}
      height={props.height || 50 * props.scaler}
      viewBox="0 0 50 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx={25}
        cy={20.8333}
        r={6.25}
        stroke="var(--main-border-item-color)"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <circle
        cx={25}
        cy={25}
        r={18.75}
        stroke="var(--main-border-item-color)"
        strokeWidth={3}
      />
      <path
        d="M37.043 39.222a.597.597 0 00.278-.741c-.803-2.013-2.351-3.786-4.443-5.078-2.26-1.396-5.03-2.153-7.878-2.153-2.849 0-5.618.757-7.878 2.153-2.092 1.292-3.64 3.065-4.443 5.078a.597.597 0 00.278.74 25.023 25.023 0 0024.086 0z"
        fill="var(--main-border-item-color)"
      />
    </svg>
  );
}

export default Avatar;
