function InfoSVG(props: { width: number | null; height: number | null }) {
  return (
    <svg
      width={props.width || 24}
      height={props.height || 24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2 12c0 5.523 4.477 10 10 10s10-4.477 10-10S17.523 2 12 2 2 6.477 2 12zm11-1v8h-2v-8h2zm-2-4v1h2V5h-2v2z"
        fill="#656565"
      />
    </svg>
  );
}

export default InfoSVG;
