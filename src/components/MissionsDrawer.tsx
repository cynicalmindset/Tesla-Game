import React from 'react';
import type { Mission } from '../types';
import { CheckCircle2, Circle, X, Trophy, Sparkles } from 'lucide-react';

interface MissionsDrawerProps {
  missions: Mission[];
  isOpen: boolean;
  onClose: () => void;
}

export const MissionsDrawer: React.FC<MissionsDrawerProps> = ({
  missions,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const completedCount = missions.filter((m) => m.completed).length;
  const totalCount = missions.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);
  const totalReward = missions
    .filter((m) => m.completed)
    .reduce((sum, m) => sum + m.rewardPoints, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-island">
      <div className="apple-glass w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-white/15">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight">
                  Mission Checklist
                </h2>
                <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {completedCount}/{totalCount} Done
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">
                October 15 Next-Gen Roadster Flight Objectives
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="apple-pill p-2 text-gray-400 hover:text-white cursor-pointer active:scale-95"
            title="Close (M or Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Overall Progress Bar */}
        <div className="px-5 py-3 bg-white/[0.02] border-b border-white/5 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-gray-400">Total Completion</span>
            <span className="text-white font-medium">{progressPercent}% • {totalReward.toLocaleString()} PTS Earned</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Scrollable Missions List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {missions.map((mission) => {
            const pct = Math.min(100, Math.round((mission.current / mission.target) * 100));

            return (
              <div
                key={mission.id}
                className={`p-3 rounded-xl transition-all duration-200 border ${
                  mission.completed
                    ? 'bg-emerald-500/[0.06] border-emerald-500/25'
                    : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Status Checkbox */}
                  <div className="mt-0.5 flex-shrink-0">
                    {mission.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-500" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs sm:text-sm font-semibold tracking-tight ${
                          mission.completed ? 'text-emerald-300 line-through opacity-85' : 'text-white'
                        }`}
                      >
                        {mission.title}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          mission.completed
                            ? 'bg-emerald-400/20 text-emerald-300'
                            : 'bg-white/10 text-gray-300'
                        }`}
                      >
                        +{mission.rewardPoints} PTS
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {mission.description}
                    </p>

                    {/* Live Progress Bar */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-200 ${
                            mission.completed ? 'bg-emerald-400' : 'bg-white'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">
                        {mission.current.toLocaleString()} / {mission.target.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-white/[0.02] border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>Complete stunts & jumps anywhere to check off items</span>
          </div>
          <span className="hidden sm:inline font-mono text-[10px]">Press 'M' to toggle</span>
        </div>
      </div>
    </div>
  );
};
