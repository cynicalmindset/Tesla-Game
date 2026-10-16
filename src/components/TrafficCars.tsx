import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { TrafficVehicle } from '../types';

interface TrafficCarsProps {
  carZ: number;
  traffic: TrafficVehicle[];
}

export const TrafficCars: React.FC<TrafficCarsProps> = ({ carZ, traffic }) => {
  // Only render traffic within viewing distance
  const visibleTraffic = useMemo(() => {
    const minZ = carZ - 50;
    const maxZ = carZ + 750;
    return traffic.filter((t) => t.z >= minZ && t.z <= maxZ);
  }, [carZ, traffic]);

  // Shared Materials
  const cybertruckSteelMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#98a0ab'),
        metalness: 0.96,
        roughness: 0.22,
      }),
    []
  );

  const glassMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#050810'),
        metalness: 0.9,
        roughness: 0.05,
        transmission: 0.6,
        transparent: true,
      }),
    []
  );

  const headlightMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#ffffff'),
      }),
    []
  );

  const taillightMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#ff1e42'),
      }),
    []
  );

  const tireMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#141517'),
        roughness: 0.85,
      }),
    []
  );

  return (
    <group name="TrafficVehicles">
      {visibleTraffic.map((car) => {
        if (car.modelType === 'CYBERTRUCK') {
          return (
            <group key={car.id} position={[car.x, 0, car.z]}>
              {/* Angular Cybertruck Body */}
              <mesh position={[0, 0.75, 0]} material={cybertruckSteelMat} castShadow>
                <boxGeometry args={[2.0, 0.85, 4.6]} />
              </mesh>

              {/* Angled Roof Vault */}
              <mesh position={[0, 1.35, -0.2]} material={cybertruckSteelMat} castShadow>
                <boxGeometry args={[1.75, 0.65, 2.8]} />
              </mesh>

              {/* Glass canopy */}
              <mesh position={[0, 1.35, 0.2]} material={glassMat}>
                <boxGeometry args={[1.78, 0.58, 2.0]} />
              </mesh>

              {/* Front full-width LED Light bar */}
              <mesh position={[0, 0.92, 2.32]} material={headlightMat}>
                <boxGeometry args={[1.9, 0.08, 0.05]} />
              </mesh>

              {/* Rear full-width red LED Light bar */}
              <mesh position={[0, 0.95, -2.32]} material={taillightMat}>
                <boxGeometry args={[1.9, 0.08, 0.05]} />
              </mesh>

              {/* Wheels */}
              {[-0.98, 0.98].map((wx, i) => (
                <React.Fragment key={`ct-wheel-${i}`}>
                  <mesh position={[wx, 0.38, 1.4]} rotation={[0, 0, Math.PI / 2]} material={tireMat}>
                    <cylinderGeometry args={[0.38, 0.38, 0.28, 16]} />
                  </mesh>
                  <mesh position={[wx, 0.38, -1.4]} rotation={[0, 0, Math.PI / 2]} material={tireMat}>
                    <cylinderGeometry args={[0.38, 0.38, 0.28, 16]} />
                  </mesh>
                </React.Fragment>
              ))}
            </group>
          );
        }

        if (car.modelType === 'SEMI') {
          return (
            <group key={car.id} position={[car.x, 0, car.z]}>
              {/* Cab */}
              <mesh position={[0, 1.6, 2.2]} castShadow>
                <boxGeometry args={[2.4, 2.6, 2.8]} />
                <meshStandardMaterial color="#1a1e28" metalness={0.7} roughness={0.3} />
              </mesh>

              {/* Aerodynamic Windshield */}
              <mesh position={[0, 2.0, 3.4]} material={glassMat}>
                <boxGeometry args={[2.2, 1.2, 0.5]} />
              </mesh>

              {/* Cargo Trailer */}
              <mesh position={[0, 2.0, -2.8]} castShadow>
                <boxGeometry args={[2.4, 3.0, 7.5]} />
                <meshStandardMaterial color={car.color} metalness={0.8} roughness={0.2} />
              </mesh>

              {/* Headlights */}
              <mesh position={[-0.9, 0.7, 3.62]} material={headlightMat}>
                <boxGeometry args={[0.4, 0.15, 0.05]} />
              </mesh>
              <mesh position={[0.9, 0.7, 3.62]} material={headlightMat}>
                <boxGeometry args={[0.4, 0.15, 0.05]} />
              </mesh>

              {/* Rear Trailer Lights */}
              <mesh position={[0, 1.0, -6.57]} material={taillightMat}>
                <boxGeometry args={[2.2, 0.1, 0.05]} />
              </mesh>
            </group>
          );
        }

        // Standard Electric Sedan
        return (
          <group key={car.id} position={[car.x, 0, car.z]}>
            {/* Sedan Body */}
            <mesh position={[0, 0.5, 0]} castShadow>
              <boxGeometry args={[1.85, 0.55, 4.2]} />
              <meshStandardMaterial color={car.color} metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Cabin */}
            <mesh position={[0, 0.95, -0.2]} material={glassMat}>
              <boxGeometry args={[1.5, 0.5, 2.1]} />
            </mesh>

            {/* Headlights */}
            <mesh position={[-0.65, 0.52, 2.12]} material={headlightMat}>
              <boxGeometry args={[0.35, 0.08, 0.05]} />
            </mesh>
            <mesh position={[0.65, 0.52, 2.12]} material={headlightMat}>
              <boxGeometry args={[0.35, 0.08, 0.05]} />
            </mesh>

            {/* Rear Lights */}
            <mesh position={[0, 0.6, -2.12]} material={taillightMat}>
              <boxGeometry args={[1.7, 0.08, 0.05]} />
            </mesh>

            {/* Wheels */}
            {[-0.92, 0.92].map((wx, i) => (
              <React.Fragment key={`sedan-wheel-${i}`}>
                <mesh position={[wx, 0.32, 1.2]} rotation={[0, 0, Math.PI / 2]} material={tireMat}>
                  <cylinderGeometry args={[0.32, 0.32, 0.22, 16]} />
                </mesh>
                <mesh position={[wx, 0.32, -1.2]} rotation={[0, 0, Math.PI / 2]} material={tireMat}>
                  <cylinderGeometry args={[0.32, 0.32, 0.22, 16]} />
                </mesh>
              </React.Fragment>
            ))}
          </group>
        );
      })}
    </group>
  );
};
