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

    // ----------------------------------------------------
    // START / IDLE SCREEN: CINEMATIC ORBIT
    // ----------------------------------------------------
    if (gameState === 'IDLE') {
      orbitAngle.current += delta * 0.35;
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
    // GAMEPLAY CHASE CAMERA
    // ----------------------------------------------------
    const speedMs = carVelocity.length();
    const speedKmh = speedMs * 3.6;

    // Car forward & up vectors
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(carQuaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(carQuaternion);

    // Chase distance and height adjust with speed and airborne state
    const speedRatio = Math.min(speedKmh / 450, 1.0);
    const baseDistance = isAirborne ? 8.5 : 7.2 + speedRatio * 1.5;
    const baseHeight = isAirborne ? 3.8 : 2.4;

    // Ideal camera position behind car
    // We blend car's local up/forward with world up to prevent disorienting camera rolls during 360 barrel rolls
    const blendUp = new THREE.Vector3(0, 1, 0).lerp(up, 0.25).normalize();
    const idealCameraPos = carPosition
      .clone()
      .sub(forward.clone().multiplyScalar(baseDistance))
      .add(blendUp.clone().multiplyScalar(baseHeight));

    // Screen Shake effect
    if (screenShakeIntensity > 0 || isThrusterActive) {
      const shakeAmt = Math.max(screenShakeIntensity, isThrusterActive ? 0.08 : 0);
      idealCameraPos.x += (Math.random() - 0.5) * shakeAmt;
      idealCameraPos.y += (Math.random() - 0.5) * shakeAmt;
      idealCameraPos.z += (Math.random() - 0.5) * shakeAmt;
    }

    // Smooth position lerp
    const posLerpRate = isAirborne ? 10.0 : 14.0;
    currentCameraPos.current.lerp(idealCameraPos, posLerpRate * delta);
    perspCamera.position.copy(currentCameraPos.current);

    // Look-at point: in front of the car
    const lookAheadDistance = 14.0 + speedRatio * 8.0;
    const idealLookAt = carPosition
      .clone()
      .add(forward.clone().multiplyScalar(lookAheadDistance))
      .add(new THREE.Vector3(0, 1.2, 0));

    currentLookAt.current.lerp(idealLookAt, 16.0 * delta);
    perspCamera.lookAt(currentLookAt.current);

    // Dynamic FOV based on speed and thrusters
    const targetFov = 58 + speedRatio * 24 + (isThrusterActive ? 8 : 0);
    perspCamera.fov = THREE.MathUtils.lerp(perspCamera.fov, targetFov, 6.0 * delta);
    perspCamera.updateProjectionMatrix();
  });

  return null;
};
