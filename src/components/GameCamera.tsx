import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import type { GameState } from '../types';

interface GameCameraProps {
  carPosition: THREE.Vector3;
  carQuaternion: THREE.Quaternion;
  carVelocity: THREE.Vector3;
  isAirborne: boolean;
  isThrusterActive: boolean;
  gameState: GameState;
  screenShakeIntensity: number;
}

export const GameCamera: React.FC<GameCameraProps> = ({
  carPosition,
  carQuaternion,
  carVelocity,
  isAirborne,
  isThrusterActive,
  gameState,
  screenShakeIntensity,
}) => {
  const { camera } = useThree();
  const currentCameraPos = useRef(new THREE.Vector3(0, 3, -8));
  const currentLookAt = useRef(new THREE.Vector3(0, 1, 10));
  const orbitAngle = useRef(0);

  useFrame(({ clock }, delta) => {
    const perspCamera = camera as THREE.PerspectiveCamera;
    const clampedDelta = Math.min(Math.max(delta, 0.001), 0.04);

    // ----------------------------------------------------
    // START / IDLE SCREEN: CINEMATIC ORBIT
    // ----------------------------------------------------
    if (gameState === 'IDLE') {
      orbitAngle.current += clampedDelta * 0.35;
      const radius = 6.5;
      const height = 1.6 + Math.sin(clock.getElapsedTime() * 0.6) * 0.3;
      const camX = Math.sin(orbitAngle.current) * radius;
      const camZ = Math.cos(orbitAngle.current) * radius;

      perspCamera.position.set(camX, height, camZ);
      perspCamera.lookAt(0, 0.45, 0);
      perspCamera.fov = 48;
      perspCamera.updateProjectionMatrix();
      return;
    }

    // ----------------------------------------------------
    // GAMEPLAY CHASE CAMERA (EXPONENTIAL DAMPED SMOOTHING)
    // ----------------------------------------------------
    const speedMs = carVelocity.length();
    const speedKmh = speedMs * 3.6;

    // Car forward & up vectors
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(carQuaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(carQuaternion);

    // Chase distance and height adjust smoothly with speed and airborne state
    const speedRatio = Math.min(speedKmh / 440, 1.0);
    const baseDistance = isAirborne ? 8.6 : 7.2 + speedRatio * 1.6;
    const baseHeight = isAirborne ? 3.6 : 2.3 + speedRatio * 0.3;

    // Blend car's local up/forward with world up to prevent disorienting rolls during aerial stunts
    const blendUp = new THREE.Vector3(0, 1, 0).lerp(up, 0.22).normalize();
    const idealCameraPos = carPosition
      .clone()
      .sub(forward.clone().multiplyScalar(baseDistance))
      .add(blendUp.clone().multiplyScalar(baseHeight));

    // Smooth Harmonic Vibration (Tactile rocket rumble without jarring white-noise jitter)
    if (screenShakeIntensity > 0 || isThrusterActive) {
      const shakeAmt = Math.max(screenShakeIntensity * 0.15, isThrusterActive ? 0.035 : 0);
      const wave = Math.sin(clock.getElapsedTime() * 55) * shakeAmt;
      idealCameraPos.x += wave * 0.6;
      idealCameraPos.y += wave * 0.4;
      idealCameraPos.z += wave * 0.5;
    }

    // Framerate-independent exponential smoothing
    const posDamping = isAirborne ? 9.5 : 13.0;
    const posAlpha = 1 - Math.exp(-posDamping * clampedDelta);
    currentCameraPos.current.lerp(idealCameraPos, posAlpha);
    perspCamera.position.copy(currentCameraPos.current);

    // Look-at point: Ahead of the car along forward trajectory
    const lookAheadDistance = 14.0 + speedRatio * 8.0;
    const idealLookAt = carPosition
      .clone()
      .add(forward.clone().multiplyScalar(lookAheadDistance))
      .add(new THREE.Vector3(0, 1.1, 0));

    const lookDamping = 14.0;
    const lookAlpha = 1 - Math.exp(-lookDamping * clampedDelta);
    currentLookAt.current.lerp(idealLookAt, lookAlpha);
    perspCamera.lookAt(currentLookAt.current);

    // Dynamic FOV with smooth exponential transition
    const targetFov = 56 + speedRatio * 22 + (isThrusterActive ? 6 : 0);
    perspCamera.fov = THREE.MathUtils.lerp(perspCamera.fov, targetFov, 1 - Math.exp(-5.0 * clampedDelta));
    perspCamera.updateProjectionMatrix();
  });

  return null;
};
