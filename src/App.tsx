import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { GameState, InputState, TelemetryData } from './types';
import { PhysicsEngine, INITIAL_MISSIONS } from './game/physics';
import { GameScene } from './components/GameScene';
import { HUD } from './components/HUD';
import { StartScreen } from './components/StartScreen';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { TouchControls } from './components/TouchControls';
import { soundManager } from './audio/SoundManager';

const defaultInputState: InputState = {
  accelerate: false,
  brake: false,
  steerLeft: false,
  steerRight: false,
  thruster: false,
  pitchUp: false,
  pitchDown: false,
  rollLeft: false,
  rollRight: false,
  yawLeft: false,
  yawRight: false,
  boost: false,
  restart: false,
};

const initialTelemetry: TelemetryData = {
  speed: 0,
  kmh: 0,
  altitude: 0,
  airtime: 0,
  totalAirtime: 0,
  thrusterGas: 100,
  boostEnergy: 100,
  pitch: 0,
  roll: 0,
  yaw: 0,
  landingStability: 'OPTIMAL',
  isAirborne: false,
  distance: 0,
  score: 0,
  combo: 1,
  maxSpeed: 0,
  stuntHistory: [],
  recentStunt: null,
  landingCount: 0,
  cleanLandingCount: 0,
  ringsCollected: 0,
  flightModeActive: false,
  health: 100,
  trafficLeaped: 0,
  nearMisses: 0,
  currentMissionIndex: 0,
  missions: JSON.parse(JSON.stringify(INITIAL_MISSIONS)),
};

export const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [telemetry, setTelemetry] = useState<TelemetryData>(initialTelemetry);
  const [inputState, setInputState] = useState<InputState>(defaultInputState);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getIsMuted());

  // Persistent physics engine instance
  const engine = useMemo(() => new PhysicsEngine(), []);

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      // Pause toggle
      if (e.code === 'Escape') {
        if (gameState === 'PLAYING') {
          setGameState('PAUSED');
        } else if (gameState === 'PAUSED') {
          setGameState('PLAYING');
        }
        return;
      }

      // Quick restart
      if (e.code === 'KeyR') {
        restartGame();
        return;
      }

      const isAirborne = engine.state.isAirborne;

      setInputState((prev) => {
        const next = { ...prev };
        switch (e.code) {
          case 'KeyW':
          case 'ArrowUp':
            if (isAirborne) {
              next.pitchDown = true;
            } else {
              next.accelerate = true;
            }
            break;
          case 'KeyS':
          case 'ArrowDown':
            if (isAirborne) {
              next.pitchUp = true;
            } else {
              next.brake = true;
            }
            break;
          case 'KeyA':
          case 'ArrowLeft':
            if (isAirborne) {
              next.rollLeft = true;
            } else {
              next.steerLeft = true;
            }
            break;
          case 'KeyD':
          case 'ArrowRight':
            if (isAirborne) {
              next.rollRight = true;
            } else {
              next.steerRight = true;
            }
            break;
          case 'KeyQ':
            next.yawLeft = true;
            break;
          case 'KeyE':
            next.yawRight = true;
            break;
          case 'KeyF':
            next.instantFlip = true;
            break;
          case 'KeyX':
            next.instantRoll = true;
            break;
          case 'KeyC':
            next.instantSpin = true;
            break;
          case 'Space':
            next.thruster = true;
            break;
          case 'ShiftLeft':
          case 'ShiftRight':
            next.boost = true;
            break;
        }
        return next;
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setInputState((prev) => {
        const next = { ...prev };
        switch (e.code) {
          case 'KeyW':
          case 'ArrowUp':
            next.accelerate = false;
            next.pitchDown = false;
            break;
          case 'KeyS':
          case 'ArrowDown':
            next.brake = false;
            next.pitchUp = false;
            break;
          case 'KeyA':
          case 'ArrowLeft':
            next.steerLeft = false;
            next.rollLeft = false;
            break;
          case 'KeyD':
          case 'ArrowRight':
            next.steerRight = false;
            next.rollRight = false;
            break;
          case 'KeyQ':
            next.yawLeft = false;
            break;
          case 'KeyE':
            next.yawRight = false;
            break;
          case 'KeyF':
            next.instantFlip = false;
            break;
          case 'KeyX':
            next.instantRoll = false;
            break;
          case 'KeyC':
            next.instantSpin = false;
            break;
          case 'Space':
            next.thruster = false;
            break;
          case 'ShiftLeft':
          case 'ShiftRight':
            next.boost = false;
            break;
        }
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, engine]);

  // Restart function
  const restartGame = useCallback(() => {
    engine.reset();
    setInputState(defaultInputState);
    setTelemetry(initialTelemetry);
    setGameState('PLAYING');
  }, [engine]);

  // Toggle Mute
  const handleToggleMute = useCallback(() => {
    soundManager.init();
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-inter">
      {/* 3D Game Canvas Scene */}
      <GameScene
        gameState={gameState}
        inputState={inputState}
        onUpdateTelemetry={setTelemetry}
        onGameOver={() => setGameState('GAMEOVER')}
        engine={engine}
      />

      {/* Speed & Boost Vignettes */}
      {gameState === 'PLAYING' && telemetry.kmh > 240 && (
        <div className="absolute inset-0 speed-vignette pointer-events-none transition-opacity duration-300" />
      )}
      {gameState === 'PLAYING' && inputState.boost && (
        <div className="absolute inset-0 boost-vignette pointer-events-none transition-opacity duration-150" />
      )}

      {/* HUD Telemetry Overlay during Playing */}
      {gameState === 'PLAYING' && (
        <HUD
          telemetry={telemetry}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onPause={() => setGameState('PAUSED')}
        />
      )}

      {/* Mobile / Touchscreen On-Screen Buttons */}
      {gameState === 'PLAYING' && (
        <TouchControls
          setInputState={setInputState}
          isAirborne={telemetry.isAirborne}
        />
      )}

      {/* Start / Briefing Screen */}
      {gameState === 'IDLE' && (
        <StartScreen
          onStart={() => setGameState('PLAYING')}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Pause Modal */}
      {gameState === 'PAUSED' && (
        <PauseModal
          onResume={() => setGameState('PLAYING')}
          onRestart={restartGame}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Game Over Flight Report Modal */}
      {gameState === 'GAMEOVER' && (
        <GameOverModal
          telemetry={telemetry}
          onRestart={restartGame}
        />
      )}
    </div>
  );
};

export default App;
