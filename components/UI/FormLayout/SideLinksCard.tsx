import { formatNameForID } from '@/lib/utility/formatter';
import Card from '../Card';

import classes from '../../Forms/InputFormLayout/FormLayout.module.css';

interface Props {
  sideLinks: string[];
  onclicklink: (link: string) => void;
}

function SideLinksCard(props: Props) {
  const { sideLinks } = props;

  const clickLinkHandler = (e: React.MouseEvent<HTMLLIElement>) => {
    props.onclicklink((e.target as HTMLElement).id.split('_')[0]);
  };

  return (
    <Card className={`${classes['parent-frame']} w-64 py-5 bg-stak-white`}>
      <div className="flex flex-1 h-full self-stretch overflow-y-scroll">
        <ul
          className={`flex flex-1 flex-col gap-4 ${classes['content-frame__links']}`}
        >
          {sideLinks.map((el, i) => (
            <li
              key={i}
              id={`${formatNameForID(el)}_link`}
              onClick={clickLinkHandler}
            >
              {el}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

export default SideLinksCard;
