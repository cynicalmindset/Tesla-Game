import React, { useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { PhysicsEngine } from '../game/physics';
import type { GameState, InputState, TelemetryData } from '../types';
import { RoadsterModel } from './RoadsterModel';
import { TestTrack } from './TestTrack';
import { TrafficCars } from './TrafficCars';
import { EnvironmentScene } from './EnvironmentScene';
import { GameCamera } from './GameCamera';
import { ErrorBoundary } from './ErrorBoundary';

interface GameSceneProps {
  gameState: GameState;
  inputState: InputState;
  onUpdateTelemetry: (telemetry: TelemetryData) => void;
  onGameOver: () => void;
  engine: PhysicsEngine;
  isMarsMode?: boolean;
}

// Inner loop component within Canvas context
const SimulationLoop: React.FC<{
  gameState: GameState;
  inputState: InputState;
  onUpdateTelemetry: (telemetry: TelemetryData) => void;
  onGameOver: () => void;
  engine: PhysicsEngine;
  isMarsMode?: boolean;
}> = ({ gameState, inputState, onUpdateTelemetry, onGameOver, engine, isMarsMode = false }) => {
  const carGroupRef = useRef<THREE.Group>(null);
  const screenShakeRef = useRef(0);
  const wasGroundedBeforeThruster = useRef(true);

  useFrame((_, delta) => {
    if (gameState === 'IDLE') {
      // In idle, slowly spin idle car on track
      if (carGroupRef.current) {
        carGroupRef.current.position.set(0, 0.46, 0);
        carGroupRef.current.quaternion.identity();
      }
      return;
    }

    if (gameState === 'PAUSED' || gameState === 'GAMEOVER') {
      return;
    }

    // Screen shake decay
    if (screenShakeRef.current > 0) {
      screenShakeRef.current = Math.max(0, screenShakeRef.current - delta * 2.0);
    }

    if (inputState.thruster && wasGroundedBeforeThruster.current && !engine.state.isAirborne) {
      screenShakeRef.current = 0.25;
    }
    wasGroundedBeforeThruster.current = !engine.state.isAirborne;

    const dt = Math.min(delta, 0.035);

    // Step physics simulation
    const telemetry = engine.update(dt, inputState);
    onUpdateTelemetry(telemetry);

    // Sync 3D Car Model Transform
    if (carGroupRef.current) {
      carGroupRef.current.position.copy(engine.state.position);
      carGroupRef.current.quaternion.copy(engine.state.quaternion);
    }

    // Check crash / death state
    if (engine.state.crashState.isCrashing) {
      engine.state.crashState.timer -= delta;
      screenShakeRef.current = Math.min(1.2, engine.state.crashState.timer * 0.4 + 0.35);
      if (engine.state.crashState.timer <= 0) {
        onGameOver();
      }
    }
  });

  return (
    <>
      <GameCamera
        carPosition={engine.state.position}
        carQuaternion={engine.state.quaternion}
        carVelocity={engine.state.velocity}
        isAirborne={engine.state.isAirborne}
        isThrusterActive={inputState.thruster && engine.state.thrusterGas > 5}
        gameState={gameState}
        screenShakeIntensity={screenShakeRef.current}
      />

      <EnvironmentScene
        carZ={engine.state.position.z}
        carSpeedKmh={engine.state.velocity.length() * 3.6}
        isMarsMode={isMarsMode || engine.isMarsMode}
      />

      <TestTrack
        carZ={engine.state.position.z}
        ramps={engine.ramps}
        rings={engine.rings}
        gaps={engine.gaps}
      />

      <TrafficCars
        carZ={engine.state.position.z}
        traffic={engine.traffic}
      />

      <group ref={carGroupRef} position={[0, 0.46, 0]}>
        <RoadsterModel
          steeringAngle={engine.state.steeringAngle}
          wheelsRotation={engine.state.wheelsRotation}
          isThrusterActive={inputState.thruster && engine.state.thrusterGas > 5}
          isBoosting={inputState.boost && engine.state.boostEnergy > 5}
          isAirborne={engine.state.isAirborne}
          input={inputState}
          isCrashing={engine.state.crashState.isCrashing}
          isFireActive={engine.state.isFireActive}
          damageLevel={engine.state.damageLevel}
          isStuntActive={engine.activeStunt !== null}
        />
      </group>
    </>
  );
};

export const GameScene: React.FC<GameSceneProps> = ({
  gameState,
  inputState,
  onUpdateTelemetry,
  onGameOver,
  engine,
  isMarsMode = false,
}) => {
  return (
    <div className="absolute inset-0 w-full h-full bg-[#05070c]">
      <ErrorBoundary fallbackMessage="WebGL Flight Display Interrupted">
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [0, 2.5, -8], fov: 60 }}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
          }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener(
              'webglcontextlost',
              (event) => {
                event.preventDefault();
                console.warn('WebGL context lost. Holding state...');
              },
              false
            );
          }}
        >
          <SimulationLoop
            gameState={gameState}
            inputState={inputState}
            onUpdateTelemetry={onUpdateTelemetry}
            onGameOver={onGameOver}
            engine={engine}
            isMarsMode={isMarsMode}
          />
        </Canvas>
      </ErrorBoundary>
    </div>
  );
};
