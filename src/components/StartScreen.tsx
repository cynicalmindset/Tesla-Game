import React from 'react';
import { Volume2, VolumeX, ArrowRight } from 'lucide-react';
import { soundManager } from '../audio/SoundManager';

interface StartScreenProps {
  onStart: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onStart,
  isMuted,
  onToggleMute,
}) => {
  const handleStart = () => {
    soundManager.init();
    soundManager.resume();
    soundManager.playCountdownBeep(true);
    onStart();
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between p-6 md:p-10 bg-black/50 pointer-events-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between w-full">
        <div className="apple-pill px-3.5 py-1.5 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span className="text-xs font-medium text-white tracking-wide">
            Tesla Proving Ground • SpaceX Package
          </span>
        </div>

        <button
          onClick={onToggleMute}
          className="apple-pill px-3.5 py-1.5 flex items-center gap-2 text-gray-300 hover:text-white cursor-pointer text-xs"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-white" />}
          <span className="font-medium">{isMuted ? 'Muted' : 'Audio'}</span>
        </button>
      </div>

      {/* Center Keynote Showcase */}
      <div className="flex flex-col items-center text-center my-auto max-w-xl mx-auto">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Special Demonstration
        </span>

        <h1 className="text-6xl sm:text-7xl font-bold text-white tracking-tighter leading-none mb-3">
          Roadster.
        </h1>
        <div className="text-xl sm:text-2xl font-light text-gray-300 tracking-tight mb-6">
          Equipped with cold-gas thrusters.
        </div>

        <p className="text-sm sm:text-base text-gray-400 mb-8 max-w-md font-normal leading-relaxed">
          Accelerate beyond 450 km/h. Launch vertically from a standstill, flip in mid-air with underbody thrusters, and maneuver through highway traffic.
        </p>

        {/* Apple Style Primary CTA Pill */}
        <button
          onClick={handleStart}
          className="apple-pill apple-pill-active px-8 py-3.5 text-black font-semibold text-sm tracking-tight cursor-pointer flex items-center gap-2 transform hover:scale-[1.03] active:scale-[0.98] transition-all"
        >
          <span>Begin Demonstration</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Keycap Guide Pills */}
      <div className="w-full max-w-2xl mx-auto flex flex-wrap items-center justify-center gap-2 text-xs text-gray-400">
        <div className="apple-pill px-3 py-1.5 flex items-center gap-1.5">
          <span className="text-white font-medium">W A S D</span>
          <span>Drive</span>
        </div>
        <div className="apple-pill px-3 py-1.5 flex items-center gap-1.5">
          <span className="text-white font-medium">Space</span>
          <span>Underbody Jump</span>
        </div>
        <div className="apple-pill px-3 py-1.5 flex items-center gap-1.5">
          <span className="text-white font-medium">F</span>
          <span>Flip</span>
        </div>
        <div className="apple-pill px-3 py-1.5 flex items-center gap-1.5">
          <span className="text-white font-medium">X</span>
          <span>Roll</span>
        </div>
        <div className="apple-pill px-3 py-1.5 flex items-center gap-1.5">
          <span className="text-white font-medium">C</span>
          <span>Spin</span>
        </div>
      </div>
    </div>
  );
};
