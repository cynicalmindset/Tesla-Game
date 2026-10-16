import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCw, Wind } from 'lucide-react';
import type { InputState } from '../types';

interface TouchControlsProps {
  setInputState: React.Dispatch<React.SetStateAction<InputState>>;
  isAirborne: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  setInputState,
  isAirborne,
}) => {
  const setKey = (key: keyof InputState, value: boolean) => {
    setInputState((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="absolute inset-x-0 bottom-4 pointer-events-none z-20 flex justify-between px-4 sm:hidden">
      {/* Left: Steering or Airborne Roll */}
      <div className="flex gap-2 pointer-events-auto">
        <button
          onTouchStart={() => setKey(isAirborne ? 'rollLeft' : 'steerLeft', true)}
          onTouchEnd={() => setKey(isAirborne ? 'rollLeft' : 'steerLeft', false)}
          className="w-14 h-14 rounded-full tesla-card flex items-center justify-center text-white active:bg-white/20"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <button
          onTouchStart={() => setKey(isAirborne ? 'rollRight' : 'steerRight', true)}
          onTouchEnd={() => setKey(isAirborne ? 'rollRight' : 'steerRight', false)}
          className="w-14 h-14 rounded-full tesla-card flex items-center justify-center text-white active:bg-white/20"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Right: Thrusters, Flip, Accelerate/Brake */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Flip button */}
        <button
          onTouchStart={() => setKey('instantFlip', true)}
          onTouchEnd={() => setKey('instantFlip', false)}
          className="w-12 h-12 rounded-full tesla-card flex items-center justify-center text-white active:bg-white/20"
          title="Standing Flip"
        >
          <RotateCw className="w-4 h-4 text-red-500" />
        </button>

        {/* Big Underbody Rocket Thruster Launch Button */}
        <button
          onTouchStart={() => setKey('thruster', true)}
          onTouchEnd={() => setKey('thruster', false)}
          className="w-16 h-16 rounded-full bg-white active:scale-95 flex items-center justify-center text-black shadow-[0_0_25px_rgba(255,255,255,0.6)]"
          title="Underbody Thrusters"
        >
          <Wind className="w-7 h-7 text-black" />
        </button>

        <div className="flex flex-col gap-2">
          <button
            onTouchStart={() => setKey(isAirborne ? 'pitchDown' : 'accelerate', true)}
            onTouchEnd={() => setKey(isAirborne ? 'pitchDown' : 'accelerate', false)}
            className="w-12 h-12 rounded-full tesla-card flex items-center justify-center text-white active:bg-white/20"
          >
            <ArrowUp className="w-5 h-5" />
          </button>

          <button
            onTouchStart={() => setKey(isAirborne ? 'pitchUp' : 'brake', true)}
            onTouchEnd={() => setKey(isAirborne ? 'pitchUp' : 'brake', false)}
            className="w-12 h-12 rounded-full tesla-card flex items-center justify-center text-white active:bg-white/20"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
