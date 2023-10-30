import Link from 'next/link';

import classes from '../NavBar.module.css';

interface Props {
  path: string;
  activeclass: string;
  name: string;
  testId?: string;
  items?: MenuItems[];
}

interface MenuItems {
  name: string;
  menuPath: string;
}

function NavDropDown(props: Props) {
  return (
    <div
      className={`${classes['nav-item']} ${props.activeclass}`}
      data-testid={props.testId}
    >
      <Link href={props.path} aria-label={props.name.toLowerCase()}>
        <div className="flex relative px-8">
          <span className="grow">{props.name}</span>
        </div>
      </Link>
      {props.items && (
        <div
          className={`${classes['dropdown-menu']} ${classes['dropdown-menu__left-arrow']}`}
        >
          <ul>
            {props.items.map((item, i) => {
              return (
                <Link key={Math.random()} href={item.menuPath}>
                  <li>{item.name}</li>
                </Link>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default NavDropDown;
