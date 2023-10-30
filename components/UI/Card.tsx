import React from 'react';

import classes from './Card.module.css';

const Card = React.forwardRef<
  HTMLDivElement,
  { className: string; children: React.ReactNode }
>((props, ref) => {
  const classnames = `${classes.card} ${props.className}`;
  return (
    <div ref={ref} className={classnames}>
      {props.children}
    </div>
  );
});

Card.displayName = 'Card';
export default Card;
