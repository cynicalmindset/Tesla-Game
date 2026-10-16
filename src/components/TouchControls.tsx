import React, { useCallback } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCw, Wind, Zap } from 'lucide-react';
import type { InputState } from '../types';

interface TouchControlsProps {
  setInputState: React.Dispatch<React.SetStateAction<InputState>>;
  isAirborne: boolean;
  visible?: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  setInputState,
  isAirborne,
  visible = true,
}) => {
  const [isMobileViewport, setIsMobileViewport] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });

  React.useEffect(() => {
    const checkViewport = () => {
      setIsMobileViewport(window.innerWidth < 768);
    };
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Strictly hidden on desktop (>= 768px)
  if (!visible || !isMobileViewport) return null;

  const handlePress = useCallback(
    (key: keyof InputState, active: boolean, haptic: boolean = false) => {
      setInputState((prev) => ({ ...prev, [key]: active }));
      if (active && haptic && typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(20);
        } catch {
          // Ignore
        }
      }
    },
    [setInputState]
  );

  const bind = (key: keyof InputState, haptic: boolean = false) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      handlePress(key, true, haptic);
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      handlePress(key, false);
    },
    onPointerCancel: (e: React.PointerEvent) => {
      e.preventDefault();
      handlePress(key, false);
    },
    onPointerLeave: (e: React.PointerEvent) => {
      e.preventDefault();
      handlePress(key, false);
    },
  });

  return (
    <div
      className="mobile-only md:hidden absolute inset-x-0 bottom-3 pointer-events-none z-30 flex justify-between items-end px-3 sm:px-6 select-none"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}
    >
      {/* ----------------- LEFT THUMB CLUSTER: STEERING & ROLL ----------------- */}
      <div className="flex flex-col gap-2 pointer-events-auto">
        <div className="flex items-center gap-2">
          {/* Left Arrow */}
          <button
            {...bind(isAirborne ? 'rollLeft' : 'steerLeft')}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl apple-glass flex flex-col items-center justify-center text-white active:scale-95 active:bg-white/20 transition-transform cursor-pointer border border-white/20 shadow-lg touch-none"
            aria-label={isAirborne ? 'Roll Left' : 'Steer Left'}
          >
            <ArrowLeft className="w-6 h-6" />
            <span className="text-[9px] font-semibold text-gray-300 mt-0.5 tracking-tight">
              {isAirborne ? 'ROLL L' : 'STEER L'}
            </span>
          </button>

          {/* Right Arrow */}
          <button
            {...bind(isAirborne ? 'rollRight' : 'steerRight')}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl apple-glass flex flex-col items-center justify-center text-white active:scale-95 active:bg-white/20 transition-transform cursor-pointer border border-white/20 shadow-lg touch-none"
            aria-label={isAirborne ? 'Roll Right' : 'Steer Right'}
          >
            <ArrowRight className="w-6 h-6" />
            <span className="text-[9px] font-semibold text-gray-300 mt-0.5 tracking-tight">
              {isAirborne ? 'ROLL R' : 'STEER R'}
            </span>
          </button>
        </div>

        {/* Instant Roll Stunt Button */}
        <button
          {...bind('instantRoll', true)}
          className="apple-pill py-2 px-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-white/90 active:scale-95 active:bg-white/20 touch-none"
        >
          <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>360° BARREL ROLL</span>
        </button>
      </div>

      {/* ----------------- RIGHT THUMB CLUSTER: THRUSTERS & PEDALS ----------------- */}
      <div className="flex items-end gap-2.5 pointer-events-auto">
        {/* Instant Flip Stunt Button */}
        <div className="flex flex-col gap-2 items-center">
          <button
            {...bind('instantFlip', true)}
            className="w-12 h-12 rounded-xl apple-glass flex flex-col items-center justify-center text-white active:scale-95 active:bg-white/20 transition-transform cursor-pointer border border-white/20 shadow-md touch-none"
            title="Standing 360 Flip"
          >
            <RotateCw className="w-4 h-4 text-red-400" />
            <span className="text-[8px] font-bold text-gray-300 mt-0.5">FLIP</span>
          </button>

          {/* Boost Button */}
          <button
            {...bind('boost', true)}
            className="w-12 h-12 rounded-xl apple-glass flex flex-col items-center justify-center text-white active:scale-95 active:bg-red-500/30 transition-transform cursor-pointer border border-red-500/30 shadow-md touch-none"
            title="Electric Boost"
          >
            <Zap className="w-4 h-4 text-red-500" />
            <span className="text-[8px] font-bold text-red-400 mt-0.5">BOOST</span>
          </button>
        </div>

        {/* Center Rocket Thruster / Jump Launch Button */}
        <button
          {...bind('thruster', true)}
          className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-white text-black active:scale-90 transition-transform flex flex-col items-center justify-center shadow-xl cursor-pointer touch-none select-none border border-white/60 active:bg-gray-100"
          title="Cold-Gas Rocket Thruster Launch"
        >
          <Wind className="w-7 h-7 sm:w-8 sm:h-8 text-black" />
          <span className="text-[10px] sm:text-[11px] font-black tracking-wider text-black mt-0.5">
            JUMP
          </span>
        </button>

        {/* Gas & Brake Pedals */}
        <div className="flex flex-col gap-2">
          {/* Gas Pedal */}
          <button
            {...bind(isAirborne ? 'pitchDown' : 'accelerate')}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl apple-glass flex flex-col items-center justify-center text-white active:scale-95 active:bg-white/20 transition-transform cursor-pointer border border-white/20 shadow-lg touch-none"
            aria-label={isAirborne ? 'Pitch Down' : 'Gas'}
          >
            <ArrowUp className="w-6 h-6 text-emerald-400" />
            <span className="text-[9px] font-semibold text-gray-300 mt-0.5 tracking-tight">
              {isAirborne ? 'PITCH' : 'GAS'}
            </span>
          </button>

          {/* Brake Pedal */}
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              handlePress('brake', true, true);
              if (isAirborne) handlePress('pitchUp', true);
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              handlePress('brake', false);
              handlePress('pitchUp', false);
            }}
            onPointerCancel={(e) => {
              e.preventDefault();
              handlePress('brake', false);
              handlePress('pitchUp', false);
            }}
            onPointerLeave={(e) => {
              e.preventDefault();
              handlePress('brake', false);
              handlePress('pitchUp', false);
            }}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl apple-glass flex flex-col items-center justify-center text-white active:scale-95 active:bg-red-500/20 transition-transform cursor-pointer border border-white/20 shadow-lg touch-none"
            aria-label="Brake"
          >
            <ArrowDown className="w-6 h-6 text-red-400" />
            <span className="text-[9px] font-semibold text-gray-300 mt-0.5 tracking-tight">
              {isAirborne ? 'BRAKE/UP' : 'BRAKE'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
