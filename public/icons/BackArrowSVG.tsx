function BackArrow(props: {
  width: number | null;
  height: number | null;
  scaler: number;
}) {
  return (
    <svg
      width={props.width || 35 * props.scaler}
      height={props.height || 26 * props.scaler}
      viewBox="0 0 35 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 10.308l-1.337 1.487-1.654-1.487L3.663 8.82 5 10.308zM33 22a2 2 0 11-4 0h4zm-21.212-2.898l-8.125-7.307L6.337 8.82l8.125 7.307-2.674 2.974zM3.663 8.821l8.125-7.308 2.674 2.974-8.125 7.308L3.663 8.82zM5 8.308h20v4H5v-4zm28 8V22h-4v-5.692h4zm-8-8a8 8 0 018 8h-4a4 4 0 00-4-4v-4z"
        fill="var(--main-border-item-color)"
      />
    </svg>
  );
}

export default BackArrow;
