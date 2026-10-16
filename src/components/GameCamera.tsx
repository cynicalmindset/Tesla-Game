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
  const cameraHeading = useRef(new THREE.Vector3(0, 0, 1));
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
      perspCamera.up.set(0, 1, 0);
      perspCamera.fov = 48;
      perspCamera.updateProjectionMatrix();

      currentCameraPos.current.copy(perspCamera.position);
      currentLookAt.current.set(0, 0.45, 0);
      cameraHeading.current.set(0, 0, 1);
      return;
    }

    // ----------------------------------------------------
    // GAMEPLAY CHASE CAMERA (STUNT-STABILIZED CHASE)
    // ----------------------------------------------------
    const speedMs = carVelocity.length();
    const speedKmh = speedMs * 3.6;
    const speedRatio = Math.min(speedKmh / 440, 1.0);

    // Calculate car forward vector
    const carForward = new THREE.Vector3(0, 0, 1).applyQuaternion(carQuaternion);

    // CRITICAL STUNT STABILITY:
    // Only update horizontal camera heading when the car is firmly on the ground.
    // During airborne stunts (flips, barrel rolls, spins, launches), camera heading
    // is locked to the horizontal track heading (+Z) so the CAMERA NEVER FLIPS OR ROLLS!
    if (!isAirborne) {
      const groundForward = new THREE.Vector3(carForward.x, 0, carForward.z);
      if (groundForward.z > 0.2 && groundForward.lengthSq() > 0.1) {
        groundForward.normalize();
        const headingAlpha = 1 - Math.exp(-9.0 * clampedDelta);
        cameraHeading.current.lerp(groundForward, headingAlpha);
        cameraHeading.current.normalize();
      }
    } else {
      // While airborne, gently align camera heading with the track trajectory (+Z)
      const trackForward = new THREE.Vector3(0, 0, 1);
      const headingAlpha = 1 - Math.exp(-2.5 * clampedDelta);
      cameraHeading.current.lerp(trackForward, headingAlpha);
      cameraHeading.current.normalize();
    }

    const chaseHeading = cameraHeading.current;

    // Chase distance and elevation adjust with speed and flight altitude
    const baseDistance = isAirborne ? 8.2 : 7.0 + speedRatio * 1.5;
    const baseHeight = isAirborne ? 3.2 : 2.2 + speedRatio * 0.4;

    // Camera is positioned strictly behind the car along the horizontal heading,
    // elevated vertically with world up — completely immune to vehicle inversion/flips
    const idealCameraPos = carPosition
      .clone()
      .sub(chaseHeading.clone().multiplyScalar(baseDistance))
      .add(new THREE.Vector3(0, baseHeight, 0));

    // Smooth tactile rocket vibration
    if (screenShakeIntensity > 0 || isThrusterActive) {
      const shakeAmt = Math.max(screenShakeIntensity * 0.15, isThrusterActive ? 0.035 : 0);
      const wave = Math.sin(clock.getElapsedTime() * 55) * shakeAmt;
      idealCameraPos.x += wave * 0.6;
      idealCameraPos.y += wave * 0.4;
      idealCameraPos.z += wave * 0.5;
    }

    // Exponential smoothing for buttery-smooth tracking
    const posDamping = isAirborne ? 8.5 : 12.0;
    const posAlpha = 1 - Math.exp(-posDamping * clampedDelta);
    currentCameraPos.current.lerp(idealCameraPos, posAlpha);
    perspCamera.position.copy(currentCameraPos.current);

    // Look-at point: Targets the vehicle center plus slight forward look-ahead along track
    const lookAheadDistance = isAirborne ? 3.5 : 7.0 + speedRatio * 5.0;
    const lookAtElevation = isAirborne ? 0.6 : 0.85;
    const idealLookAt = carPosition
      .clone()
      .add(chaseHeading.clone().multiplyScalar(lookAheadDistance))
      .add(new THREE.Vector3(0, lookAtElevation, 0));

    const lookDamping = 14.0;
    const lookAlpha = 1 - Math.exp(-lookDamping * clampedDelta);
    currentLookAt.current.lerp(idealLookAt, lookAlpha);

    // Camera up-vector is STRICTLY locked to world UP (0, 1, 0)
    perspCamera.up.set(0, 1, 0);
    perspCamera.lookAt(currentLookAt.current);

    // Dynamic FOV with smooth exponential transition
    const targetFov = 56 + speedRatio * 20 + (isThrusterActive ? 6 : 0);
    perspCamera.fov = THREE.MathUtils.lerp(perspCamera.fov, targetFov, 1 - Math.exp(-5.0 * clampedDelta));
    perspCamera.updateProjectionMatrix();
  });

  return null;
};
