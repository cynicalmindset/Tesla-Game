import React from 'react';
import { Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { GithubIcon } from './GithubIcon';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl pointer-events-auto">
      <div className="apple-glass p-8 max-w-sm w-full text-center">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">
          Demonstration
        </span>
        <h2 className="text-3xl font-bold text-white tracking-tight mb-6">
          Paused
        </h2>

        <div className="flex flex-col gap-2.5 mb-6">
          <button
            onClick={onResume}
            className="w-full py-3 px-4 apple-pill apple-pill-active text-sm font-semibold tracking-tight cursor-pointer flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-black" />
            Resume (Esc)
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 px-4 apple-pill text-white text-sm font-medium tracking-tight cursor-pointer flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Restart Run (R)
          </button>

          <button
            onClick={onToggleMute}
            className="w-full py-2.5 px-4 apple-pill text-gray-300 text-xs font-medium cursor-pointer flex items-center justify-center gap-2"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-white" />}
            {isMuted ? 'Unmute Sound' : 'Mute Sound'}
          </button>

          <a
            href="https://github.com/cynicalmindset/Tesla-Game"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 apple-pill text-gray-300 hover:text-white text-xs font-medium cursor-pointer flex items-center justify-center gap-2 transition-colors"
          >
            <GithubIcon className="w-3.5 h-3.5 fill-current" />
            <span>GitHub Repository</span>
          </a>
        </div>

        <div className="border-t border-white/10 pt-4 text-xs text-gray-400 text-left">
          <div className="font-medium text-white mb-2">Controls Quick Guide</div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div><span className="text-white">Space:</span> Underbody Jump</div>
            <div><span className="text-white">F:</span> 360 Flip</div>
            <div><span className="text-white">X:</span> Barrel Roll</div>
            <div><span className="text-white">C:</span> Flat Spin</div>
          </div>
        </div>
      </div>
    </div>
  );
};
