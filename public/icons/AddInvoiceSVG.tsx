function AddInvoice(props: { width: number | null; height: number | null }) {
  return (
    <svg
      width={props.width || 60}
      height={props.height || 60}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.5 32.5h15M22.5 22.5h10M22.5 42.5h10"
        stroke="#fff"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <path
        d="M47.5 32.5v14c0 2.828 0 4.243-.879 5.121-.878.879-2.293.879-5.121.879h-23c-2.828 0-4.243 0-5.121-.879-.879-.878-.879-2.293-.879-5.121v-33c0-2.828 0-4.243.879-5.121.878-.879 2.293-.879 5.121-.879h9"
        stroke="#fff"
        strokeWidth={3}
      />
      <path
        d="M45 7.5v15M52.5 15h-15"
        stroke="#fff"
        strokeWidth={3}
        strokeLinecap="round"
      />
    </svg>
  );
}

export default AddInvoice;
