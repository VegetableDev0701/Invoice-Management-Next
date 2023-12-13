function Help(props: {
  width: number | null;
  height: number | null;
  scaler: number;
}) {
  return (
    <svg
      width={props.width || 40 * props.scaler}
      height={props.height || 41 * props.scaler}
      viewBox="0 0 40 41"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx={19.9999}
        cy={20}
        r={16.6667}
        stroke="var(--main-border-item-color)"
        strokeWidth={4}
      />
      <g filter="url(#filter0_d_2874_158984)">
        <circle cx={20} cy={30} r={1.11111} fill="#D9D9D9" />
        <circle
          cx={20}
          cy={30}
          r={1.11111}
          stroke="var(--main-border-item-color)"
          strokeWidth={2}
        />
      </g>
      <path
        d="M20 26.667v-2.365a3.656 3.656 0 012.5-3.469v0a3.656 3.656 0 002.5-3.468v-.855a4.843 4.843 0 00-4.843-4.843H20a5 5 0 00-5 5v0"
        stroke="var(--main-border-item-color)"
        strokeWidth={4}
      />
      <defs>
        <filter
          id="filter0_d_2874_158984"
          x={9.88892}
          y={19.8889}
          width={20.2222}
          height={20.2222}
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity={0} result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset />
          <feGaussianBlur stdDeviation={4} />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0" />
          <feBlend
            in2="BackgroundImageFix"
            result="effect1_dropShadow_2874_158984"
          />
          <feBlend
            in="SourceGraphic"
            in2="effect1_dropShadow_2874_158984"
            result="shape"
          />
        </filter>
      </defs>
    </svg>
  );
}

export default Help;
