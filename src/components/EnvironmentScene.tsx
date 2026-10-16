import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface EnvironmentSceneProps {
  carZ: number;
  carSpeedKmh: number;
}

export const EnvironmentScene: React.FC<EnvironmentSceneProps> = ({ carZ, carSpeedKmh }) => {
  const speedLinesRef = useRef<THREE.Points>(null);

  // Clean architectural monoliths inspired by minimalist architectural renderings
  const monoliths = useMemo(() => {
    const list = [];
    for (let i = 0; i < 32; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * (55 + (i * 11) % 80);
      const z = i * 380 + 80;
      const h = 35 + (i * 23) % 90;
      const w = 14 + (i * 5) % 24;
      const d = 16 + (i * 7) % 28;
      // Elegant architectural white/slate tones
      const color = i % 3 === 0 ? '#e2e8f0' : i % 3 === 1 ? '#cbd5e1' : '#1e293b';
      list.push({ x, z, h, w, d, color });
    }
    return list;
  }, []);

  // Motion streaks at high velocity
  const lineCount = 120;
  const [linePositions, lineSpeeds] = useMemo(() => {
    const pos = new Float32Array(lineCount * 3);
    const speeds = new Float32Array(lineCount);
    for (let i = 0; i < lineCount; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 32;
      pos[i * 3 + 1] = 0.5 + Math.random() * 8;
      pos[i * 3 + 2] = Math.random() * 100;
      speeds[i] = 1.0 + Math.random() * 1.5;
    }
    return [pos, speeds];
  }, []);

  const linesGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    return geo;
  }, [linePositions]);

  useFrame((_, delta) => {
    if (speedLinesRef.current) {
      const isFast = carSpeedKmh > 200;
      speedLinesRef.current.visible = isFast;

      if (isFast) {
        const speedFactor = (carSpeedKmh / 400) * 110;
        const posAttr = speedLinesRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;

        for (let i = 0; i < lineCount; i++) {
          arr[i * 3 + 2] -= delta * speedFactor * lineSpeeds[i];
          if (arr[i * 3 + 2] < carZ - 20) {
            arr[i * 3 + 2] = carZ + 120 + Math.random() * 50;
            arr[i * 3 + 0] = (Math.random() - 0.5) * 32;
            arr[i * 3 + 1] = 0.5 + Math.random() * 8;
          }
        }
        posAttr.needsUpdate = true;
      }
    }
  });

  return (
    <group name="Environment">
      {/* Studio Twilight Architectural Atmosphere */}
      <color attach="background" args={['#080a10']} />
      <fog attach="fog" args={['#080a10', 90, 550]} />

      {/* Balanced Soft Ambient Light */}
      <ambientLight intensity={0.7} color="#cbd5e1" />

      {/* Primary Key Light - Crisp Architectural Sunlight */}
      <directionalLight
        position={[50, 110, carZ + 70]}
        intensity={2.0}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={10}
        shadow-camera-far={280}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
        color="#ffffff"
      />

      {/* Subtle Studio Fill Light */}
      <directionalLight
        position={[-50, 45, carZ - 30]}
        intensity={0.45}
        color="#94a3b8"
      />

      {/* Surrounding Ground Plane (Matte Architectural Asphalt Plane) */}
      <mesh
        position={[0, -0.2, carZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[1600, 3200]} />
        <meshStandardMaterial color="#0c0f17" roughness={0.92} metalness={0.08} />
      </mesh>

      {/* Minimalist Architectural Monoliths */}
      {monoliths.map((bldg, idx) => (
        <group key={`bldg-${idx}`} position={[bldg.x, 0, bldg.z]}>
          <mesh position={[0, bldg.h / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[bldg.w, bldg.h, bldg.d]} />
            <meshStandardMaterial
              color={bldg.color}
              roughness={0.85}
              metalness={0.15}
            />
          </mesh>
          {/* Subtle Roofline Specular Accent */}
          <mesh position={[0, bldg.h + 0.05, 0]}>
            <boxGeometry args={[bldg.w * 0.96, 0.1, bldg.d * 0.96]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}

      {/* High-Velocity Streaks */}
      <points ref={speedLinesRef} geometry={linesGeometry} visible={false}>
        <pointsMaterial
          size={0.2}
          color="#ffffff"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
};
