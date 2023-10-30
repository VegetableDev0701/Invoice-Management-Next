// Countdown.tsx
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/index'; // Import RootState from your store

const Countdown = () => {
  const estimatedTime = useSelector(
    (state: RootState) => state.processing.estimatedTime
  );
  const [timeLeft, setTimeLeft] = useState(estimatedTime);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTimeLeft) => Math.max(prevTimeLeft - 1000, 0));
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    setTimeLeft(estimatedTime);
  }, [estimatedTime]);

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div>
      <strong>Time remaining:</strong> {formatTime(timeLeft)}
    </div>
  );
};

export default Countdown;
