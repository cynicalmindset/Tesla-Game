import React from 'react';
import type { TelemetryData } from '../types';
import { Volume2, VolumeX, Pause, Wind, Target, CheckSquare, Smartphone, Flame, AlertTriangle, Orbit, Zap } from 'lucide-react';
import { GithubIcon } from './GithubIcon';

interface HUDProps {
  telemetry: TelemetryData;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onOpenMissions: () => void;
  isTouchControlsVisible: boolean;
  onToggleTouchControls: () => void;
  onToggleMars: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  telemetry,
  isMuted,
  onToggleMute,
  onPause,
  onOpenMissions,
  isTouchControlsVisible,
  onToggleTouchControls,
  onToggleMars,
}) => {
  const {
    kmh,
    altitude,
    thrusterGas,
    boostEnergy = 100,
    score,
    combo,
    recentStunt,
    isAirborne,
    missions,
    currentMissionIndex,
    isMarsMode,
    health = 100,
    damageLevel = 0,
    isFireActive = false,
  } = telemetry;

  const activeMission = missions[currentMissionIndex];
  const isRecentStuntActive = recentStunt && Date.now() - recentStunt.timestamp < 2200;
  const completedMissionsCount = missions.filter((m) => m.completed).length;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 overflow-hidden select-none">
      {/* ----------------- TOP BAR: 3-COLUMN FLOATING NON-OVERLAPPING ROW ----------------- */}
      <div className="hud-top-bar pointer-events-auto">
        {/* Left: Score & Missions */}
        <div className="flex items-center gap-2 flex-1 justify-start">
          {/* Score Pill */}
          <div className="apple-pill h-9 px-3.5 flex items-center gap-2 flex-shrink-0">
            {combo > 1 && (
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-semibold text-white tracking-wide whitespace-nowrap">
              {score.toLocaleString()} <span className="text-[10px] text-gray-400 font-normal">PTS</span>
            </span>
            {combo > 1 && (
              <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                {combo}x
              </span>
            )}
          </div>

          {/* Missions Checklist Button */}
          <button
            onClick={onOpenMissions}
            className="apple-pill h-9 px-3 flex items-center gap-1.5 text-xs text-gray-300 hover:text-white cursor-pointer active:scale-95 flex-shrink-0"
            title="Open Mission Checklist (M)"
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="hidden sm:inline text-[11px] font-medium">Missions</span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
              {completedMissionsCount}/{missions.length}
            </span>
          </button>
        </div>

        {/* Center: Dynamic Island (Centered in middle with zero chance of overlap) */}
        <div className="flex justify-center items-center flex-shrink-0 px-1">
          {isRecentStuntActive ? (
            <div className={`apple-island h-9 px-4 flex items-center gap-2.5 shadow-2xl ${
              recentStunt.name.includes('MARS') ? 'border-amber-500/40' : ''
            }`}>
              <span className={`w-2 h-2 rounded-full animate-pulse flex-shrink-0 ${
                recentStunt.name.includes('MARS') ? 'bg-amber-400' : 'bg-emerald-400'
              }`} />
              <span className="text-xs font-bold text-white tracking-wide uppercase truncate max-w-[180px] sm:max-w-[280px]">
                {recentStunt.name}
              </span>
              <span className="text-xs font-semibold text-emerald-400 border-l border-white/10 pl-2 flex-shrink-0">
                +{recentStunt.points}
              </span>
            </div>
          ) : activeMission ? (
            <div
              onClick={onOpenMissions}
              className="apple-island h-9 px-3.5 flex items-center gap-2 cursor-pointer hover:bg-white/10 transition-colors"
              title="Click to view all missions (M)"
            >
              <Target className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-[11px] font-medium text-white tracking-tight truncate max-w-[120px] sm:max-w-[180px]">
                    {activeMission.title}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">
                    {activeMission.current}/{activeMission.target}
                  </span>
                </div>
                <div className="w-16 sm:w-20 h-1 bg-white/10 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-200"
                    style={{
                      width: `${Math.min(100, (activeMission.current / activeMission.target) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Right: Mars Mode Toggle, Audio Mute, GitHub & Pause Controls */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          {/* Mars Mode Toggle */}
          <button
            onClick={onToggleMars}
            className={`apple-pill h-9 px-3 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all flex-shrink-0 ${
              isMarsMode
                ? 'text-amber-400 bg-amber-500/20 border-amber-500/50'
                : 'text-gray-300 hover:text-white'
            }`}
            title="Toggle Mars Flight Mode (P)"
          >
            <Orbit className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap hidden sm:inline">
              {isMarsMode ? 'Mars 3.7m/s²' : 'Mars Mode'}
            </span>
          </button>

          {/* Toggle Touch Controls (Strictly Hidden on Desktop) */}
          <button
            onClick={onToggleTouchControls}
            className={`mobile-only md:hidden apple-pill h-9 w-9 flex items-center justify-center cursor-pointer active:scale-95 flex-shrink-0 ${
              isTouchControlsVisible ? 'text-cyan-400 border-cyan-400/40 bg-cyan-500/10' : 'text-gray-400 hover:text-white'
            }`}
            title={isTouchControlsVisible ? 'Hide Touch Controls' : 'Show Touch Controls'}
          >
            <Smartphone className="w-4 h-4" />
          </button>

          {/* Toggle Mute */}
          <button
            onClick={onToggleMute}
            className="apple-pill h-9 w-9 flex items-center justify-center text-gray-300 hover:text-white cursor-pointer active:scale-95 flex-shrink-0"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-white" />}
          </button>

          {/* GitHub Repository */}
          <a
            href="https://github.com/cynicalmindset/Tesla-Game"
            target="_blank"
            rel="noopener noreferrer"
            className="apple-pill h-9 w-9 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer active:scale-95 flex-shrink-0"
            title="cynicalmindset/Tesla-Game on GitHub"
          >
            <GithubIcon className="w-4 h-4 fill-current" />
          </a>

          {/* Pause */}
          <button
            onClick={onPause}
            className="apple-pill h-9 w-9 flex items-center justify-center text-gray-300 hover:text-white cursor-pointer active:scale-95 flex-shrink-0"
            title="Pause (Esc)"
          >
            <Pause className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* ----------------- BOTTOM BAR: FLOATING MINIMAL TELEMETRY ----------------- */}
      <div
        className={`flex items-end justify-between w-full pointer-events-none transition-all duration-300 md:mb-0 ${
          isTouchControlsVisible ? 'mb-22 sm:mb-0' : 'mb-0'
        }`}
      >
        {/* Bottom Left: Vehicle Damage Alert + Drive Mode State & Hotkeys */}
        <div className="flex flex-col gap-1.5 items-start pointer-events-auto">
          {/* Vehicle Damage / Thermal Fire Alert */}
          {Boolean(isFireActive || (damageLevel && damageLevel > 0)) && (
            <div className="apple-pill px-3 py-1.5 flex items-center gap-2 bg-red-950/70 border-red-500/40 text-red-400">
              {isFireActive ? (
                <Flame className="w-3.5 h-3.5 text-orange-400" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              )}
              <span className="text-[11px] font-bold tracking-tight uppercase">
                {isFireActive ? 'Thermal Fire Warning' : `Chassis Damage Lvl ${damageLevel}`}
              </span>
              <span className="text-[10px] font-mono text-gray-300 border-l border-red-500/30 pl-2">
                {Math.round(health)}% Integrity
              </span>
            </div>
          )}

          {/* Drive Mode & Controls Guide Pill */}
          <div className="apple-pill px-3 py-1.5 sm:px-3.5 sm:py-2 flex items-center gap-2 text-xs text-gray-300">
            <span className={`w-2 h-2 rounded-full ${
              isMarsMode ? 'bg-amber-400' : isAirborne ? 'bg-red-500' : 'bg-emerald-400'
            }`} />
            <span className="font-semibold text-white tracking-tight">
              {isMarsMode
                ? `Mars Flight ${altitude.toFixed(0)}m`
                : isAirborne
                ? `Flight ${altitude.toFixed(0)}m`
                : 'Drive Mode'}
            </span>
            <span className="text-gray-400 text-[11px] hidden md:inline border-l border-white/10 pl-2">
              A/D: Steer & Air Roll • Space: Jump • F: 360 Flip • X: Barrel Roll • C: Flat Spin • M: Missions
            </span>
          </div>
        </div>

        {/* Bottom Right: Floating Digital Speedometer & Cold-Gas Thruster Level */}
        <div className="apple-glass p-3 sm:p-4 flex flex-col min-w-[130px] sm:min-w-[160px] text-right pointer-events-auto">
          <div className="flex items-baseline justify-end gap-1">
            <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tighter leading-none text-white font-sans">
              {kmh}
            </span>
            <span className="text-[10px] sm:text-[11px] font-medium text-gray-400 tracking-wider">
              {kmh >= 420 ? 'PLAID' : 'KM/H'}
            </span>
          </div>

          {/* Thruster Cold-Gas Gauge */}
          <div className="mt-2.5 sm:mt-3 flex items-center gap-2 justify-end">
            <Wind className="w-3 h-3 text-cyan-400" />
            <div className="w-16 sm:w-22 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-75 ${
                  thrusterGas > 20 ? (isMarsMode ? 'bg-amber-400' : 'bg-cyan-400') : 'bg-red-500'
                }`}
                style={{ width: `${thrusterGas}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-300 font-mono w-6 text-right font-medium">
              {thrusterGas}%
            </span>
          </div>

          {/* Electric Boost Capacitor */}
          <div className="mt-1.5 flex items-center gap-2 justify-end">
            <Zap className="w-3 h-3 text-red-400" />
            <div className="w-16 sm:w-22 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all duration-75"
                style={{ width: `${boostEnergy}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-300 font-mono w-6 text-right font-medium">
              {Math.round(boostEnergy)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
