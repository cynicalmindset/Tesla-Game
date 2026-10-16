import React, { useEffect, useState } from 'react';
import { soundManager } from '../audio/SoundManager';

interface CountdownOverlayProps {
  onComplete: () => void;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ onComplete }) => {
  const [count, setCount] = useState<number | string>(3);

  useEffect(() => {
    soundManager.playCountdownBeep(false);

    const timer1 = setTimeout(() => {
      setCount(2);
      soundManager.playCountdownBeep(false);
    }, 900);

    const timer2 = setTimeout(() => {
      setCount(1);
      soundManager.playCountdownBeep(false);
    }, 1800);

    const timer3 = setTimeout(() => {
      setCount('LAUNCH!');
      soundManager.playCountdownBeep(true);
    }, 2700);

    const timer4 = setTimeout(() => {
      onComplete();
    }, 3500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete]);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none bg-black/35 backdrop-blur-[2px]">
      <div className="flex flex-col items-center">
        <span className="text-xs md:text-sm font-semibold tracking-[0.25em] text-gray-400 uppercase mb-2">
          COLD-GAS SYSTEMS ARMED
        </span>
        <div
          key={String(count)}
          className="text-7xl md:text-9xl font-black text-white tracking-tighter"
        >
          {count}
        </div>
      </div>
    </div>
  );
};
