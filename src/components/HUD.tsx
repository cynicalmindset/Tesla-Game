import React from 'react';
import type { TelemetryData } from '../types';
import { Volume2, VolumeX, Pause, Wind, Target } from 'lucide-react';

interface HUDProps {
  telemetry: TelemetryData;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  telemetry,
  isMuted,
  onToggleMute,
  onPause,
}) => {
  const {
    kmh,
    altitude,
    thrusterGas,
    score,
    combo,
    recentStunt,
    isAirborne,
    missions,
    currentMissionIndex,
  } = telemetry;

  const activeMission = missions[currentMissionIndex];
  const isRecentStuntActive = recentStunt && Date.now() - recentStunt.timestamp < 2200;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6 overflow-hidden">
      {/* ----------------- TOP BAR: DYNAMIC ISLAND & QUIET CONTROLS ----------------- */}
      <div className="flex items-center justify-between w-full pointer-events-auto">
        {/* Left: Minimalist Score Pill */}
        <div className="apple-pill px-4 py-2 flex items-center gap-2">
          {combo > 1 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
          <span className="text-xs font-semibold text-white tracking-wide">
            {score.toLocaleString()} <span className="text-[10px] text-gray-400 font-normal">PTS</span>
          </span>
          {combo > 1 && (
            <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-full">
              {combo}x
            </span>
          )}
        </div>

        {/* Center: Dynamic Island (Shows Stunt Flash or Active Mission) */}
        <div className="absolute left-1/2 -translate-x-1/2 top-4 pointer-events-auto">
          {isRecentStuntActive ? (
            <div className="apple-island px-5 py-2 flex items-center gap-2.5 animate-island shadow-2xl">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-bold text-white tracking-wide uppercase">
                {recentStunt.name}
              </span>
              <span className="text-xs font-semibold text-emerald-400 border-l border-white/10 pl-2">
                +{recentStunt.points}
              </span>
            </div>
          ) : activeMission ? (
            <div className="apple-island px-4 py-2 flex items-center gap-3">
              <Target className="w-3.5 h-3.5 text-gray-400" />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-white tracking-tight">
                    {activeMission.title}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {activeMission.current}/{activeMission.target}
                  </span>
                </div>
                {/* Thin progress line */}
                <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden mt-0.5">
                  <div
                    className="h-full bg-white transition-all duration-200"
                    style={{
                      width: `${Math.min(100, (activeMission.current / activeMission.target) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Right: Audio & Pause Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMute}
            className="apple-pill p-2.5 text-gray-300 hover:text-white cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-white" />}
          </button>

          <button
            onClick={onPause}
            className="apple-pill p-2.5 text-gray-300 hover:text-white cursor-pointer"
            title="Pause (Esc)"
          >
            <Pause className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* ----------------- BOTTOM BAR: REFINED INSTRUMENT CLUSTER ----------------- */}
      <div className="flex items-end justify-between w-full">
        {/* Bottom Left: State Pill & Hotkeys */}
        <div className="apple-pill px-3.5 py-2 flex items-center gap-2.5 text-xs text-gray-300">
          <span className={`w-2 h-2 rounded-full ${isAirborne ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`} />
          <span className="font-semibold text-white tracking-tight">
            {isAirborne ? `Flight ${altitude.toFixed(0)}m` : 'Drive'}
          </span>
          <span className="text-gray-400 text-[11px] hidden sm:inline border-l border-white/10 pl-2">
            Space: Jump • F: Flip • X: Roll
          </span>
        </div>

        {/* Bottom Right: Digital Speedometer & Cold-Gas Thruster Level */}
        <div className="apple-glass p-4 flex flex-col min-w-[140px] text-right">
          <div className="flex items-baseline justify-end gap-1">
            <span className="text-4xl md:text-5xl font-bold text-white tracking-tighter leading-none">
              {kmh}
            </span>
            <span className="text-[11px] font-medium text-gray-400 tracking-wider">
              KM/H
            </span>
          </div>

          {/* Minimalist Thruster Progress Pill */}
          <div className="mt-3 flex items-center gap-2 justify-end">
            <Wind className="w-3 h-3 text-gray-400" />
            <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-75 ${
                  thrusterGas > 20 ? 'bg-white' : 'bg-red-500'
                }`}
                style={{ width: `${thrusterGas}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-400 font-mono w-6 text-right">
              {thrusterGas}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
