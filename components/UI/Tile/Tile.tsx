interface Props {
  children?: React.ReactNode;
  icon?: JSX.Element;
  label: string;
  className?: string;
}

function Tile(props: Props) {
  const { children, icon, label, className } = props;
  return (
    <div className={`flex flex-col grow ${className}`}>
      <div className="flex">
        <div className="flex gap-x-3.5 items-center">
          <span className="text-2xl font-medium">{label}</span>
          {icon && icon}
        </div>
        <div className="flex grow justify-end items-center">
          Make this a Prop
        </div>
      </div>
      {children && children}
    </div>
  );
}

export default Tile;
