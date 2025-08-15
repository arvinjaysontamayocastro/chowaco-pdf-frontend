import React from 'react';
import classes from './Snowfall.module.css';

export default function Snowfall({ count = 16 }) {
  return (
    <div className={classes.snowflakeContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={classes.snowflake}
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${6 + Math.random() * 5}s`,
            animationDelay: `${Math.random() * 5}s`,
            width: `${6 + Math.random() * 6}px`,
            height: `${6 + Math.random() * 6}px`,
          }}
        ></div>
      ))}
    </div>
  );
}
