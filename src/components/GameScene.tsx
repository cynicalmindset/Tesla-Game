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

interface GameSceneProps {
  gameState: GameState;
  inputState: InputState;
  onUpdateTelemetry: (telemetry: TelemetryData) => void;
  onGameOver: () => void;
  engine: PhysicsEngine;
}

// Inner loop component within Canvas context
const SimulationLoop: React.FC<{
  gameState: GameState;
  inputState: InputState;
  onUpdateTelemetry: (telemetry: TelemetryData) => void;
  onGameOver: () => void;
  engine: PhysicsEngine;
}> = ({ gameState, inputState, onUpdateTelemetry, onGameOver, engine }) => {
  const carGroupRef = useRef<THREE.Group>(null);
  const screenShakeRef = useRef(0);
  const slowMoTimerRef = useRef(0);
  const wasGroundedBeforeThruster = useRef(true);

  useFrame((_, delta) => {
    if (gameState === 'IDLE') {
      // In idle, slowly spin idle car on track
      if (carGroupRef.current) {
        carGroupRef.current.position.set(0, 0.45, 0);
        carGroupRef.current.quaternion.identity();
      }
      return;
    }

    if (gameState === 'PAUSED' || gameState === 'GAMEOVER') {
      return;
    }

    // Launch Slow-Motion Bullet-Time Effect:
    // If player hits thrusters while on the ground, trigger brief cinematic slow-mo!
    let timeScale = 1.0;
    if (inputState.thruster && wasGroundedBeforeThruster.current && !engine.state.isAirborne) {
      slowMoTimerRef.current = 0.45; // 0.45s of slow-motion
      screenShakeRef.current = 0.35;
    }
    wasGroundedBeforeThruster.current = !engine.state.isAirborne;

    if (slowMoTimerRef.current > 0) {
      slowMoTimerRef.current -= delta;
      timeScale = 0.42; // Slow down time for dramatic rocket launch feel
    }

    const dt = delta * timeScale;

    // Decay screen shake
    if (screenShakeRef.current > 0) {
      screenShakeRef.current = Math.max(0, screenShakeRef.current - delta * 1.5);
    }

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
      screenShakeRef.current = 0.5;
      if (engine.state.crashState.timer <= 0 || engine.state.health <= 0) {
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

      <group ref={carGroupRef} position={[0, 0.45, 0]}>
        <RoadsterModel
          steeringAngle={engine.state.steeringAngle}
          wheelsRotation={engine.state.wheelsRotation}
          isThrusterActive={inputState.thruster && engine.state.thrusterGas > 5}
          isBoosting={inputState.boost && engine.state.boostEnergy > 5}
          isAirborne={engine.state.isAirborne}
          input={inputState}
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
}) => {
  return (
    <div className="absolute inset-0 w-full h-full bg-[#05070c]">
      <Canvas
        shadows
        camera={{ position: [0, 2.5, -8], fov: 60 }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
        }}
      >
        <SimulationLoop
          gameState={gameState}
          inputState={inputState}
          onUpdateTelemetry={onUpdateTelemetry}
          onGameOver={onGameOver}
          engine={engine}
        />
      </Canvas>
    </div>
  );
};
