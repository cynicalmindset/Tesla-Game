import React, { useState, useEffect } from 'react';
import type { TelemetryData } from '../types';
import { RotateCcw, Share2, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GameOverModalProps {
  telemetry: TelemetryData;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  telemetry,
  onRestart,
}) => {
  const [copied, setCopied] = useState(false);

  const {
    score,
    maxSpeed,
    distance,
    totalAirtime,
    landingCount,
    cleanLandingCount,
    trafficLeaped,
    stuntHistory,
  } = telemetry;

  const landingAccuracy =
    landingCount > 0 ? Math.round((cleanLandingCount / landingCount) * 100) : 100;

  useEffect(() => {
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#ffffff', '#ff3b30', '#0a84ff', '#30d158'],
    });
  }, []);

  const handleShare = async () => {
    const text = `Tesla Roadster Demonstration Summary:
Score: ${score.toLocaleString()} pts
Top Speed: ${maxSpeed} km/h
Traffic Flyovers: ${trafficLeaped}
Total Airtime: ${totalAirtime.toFixed(1)}s
Landing Accuracy: ${landingAccuracy}%
Distance: ${distance.toLocaleString()}m
SpaceX Cold-Gas Package`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Tesla Roadster Flight Telemetry',
          text,
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback
      }
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-2xl pointer-events-auto overflow-y-auto">
      <div className="apple-glass p-8 max-w-lg w-full text-center my-auto">
        {/* Top Status */}
        <div className="inline-flex items-center gap-2 apple-pill px-3 py-1 text-xs font-medium text-gray-300 mb-4">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Demonstration Complete
        </div>

        {/* Final Score */}
        <div className="mb-6">
          <span className="text-xs uppercase tracking-widest text-gray-400 block mb-1">
            Total Score
          </span>
          <div className="text-5xl md:text-6xl font-bold text-white tracking-tighter">
            {score.toLocaleString()}
          </div>
        </div>

        {/* 6-Grid Activity Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 mb-6 text-left">
          <div className="apple-pill rounded-xl p-3">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Top Speed</span>
            <span className="text-xl font-bold text-white">{maxSpeed} <span className="text-xs text-gray-400 font-normal">km/h</span></span>
          </div>

          <div className="apple-pill rounded-xl p-3">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Distance</span>
            <span className="text-xl font-bold text-white">{distance.toLocaleString()} <span className="text-xs text-gray-400 font-normal">m</span></span>
          </div>

          <div className="apple-pill rounded-xl p-3">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Total Airtime</span>
            <span className="text-xl font-bold text-white">{totalAirtime.toFixed(1)} <span className="text-xs text-gray-400 font-normal">s</span></span>
          </div>

          <div className="apple-pill rounded-xl p-3">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Cars Jumped</span>
            <span className="text-xl font-bold text-blue-400">{trafficLeaped}</span>
          </div>

          <div className="apple-pill rounded-xl p-3">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Accuracy</span>
            <span className="text-xl font-bold text-emerald-400">{landingAccuracy}%</span>
          </div>

          <div className="apple-pill rounded-xl p-3">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Stunts</span>
            <span className="text-xl font-bold text-white">{stuntHistory.length}</span>
          </div>
        </div>

        {/* Action Pills */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={onRestart}
            className="flex-1 py-3 px-4 apple-pill apple-pill-active text-sm font-semibold tracking-tight cursor-pointer flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4 fill-black" />
            Repeat Run (R)
          </button>

          <button
            onClick={handleShare}
            className="flex-1 py-3 px-4 apple-pill text-white text-sm font-medium tracking-tight cursor-pointer flex items-center justify-center gap-2"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            {copied ? 'Copied' : 'Share Report'}
          </button>
        </div>
      </div>
    </div>
  );
};
