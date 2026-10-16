import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface EnvironmentSceneProps {
  carZ: number;
  carSpeedKmh: number;
  isMarsMode?: boolean;
}

export const EnvironmentScene: React.FC<EnvironmentSceneProps> = ({
  carZ,
  carSpeedKmh,
  isMarsMode = false,
}) => {
  const speedLinesRef = useRef<THREE.Points>(null);
  const starmanRef = useRef<THREE.Group>(null);
  const starshipSteamRef = useRef<THREE.Points>(null);
  const starlinkTrainRef = useRef<THREE.Group>(null);
  const marsDustRef = useRef<THREE.Points>(null);

  // Martian Red Dust Storm Particles
  const dustCount = 180;
  const [dustPos, dustVel] = useMemo(() => {
    const pos = new Float32Array(dustCount * 3);
    const vel = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = 0.2 + Math.random() * 12;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 160;

      vel[i * 3 + 0] = -8 - Math.random() * 14; // Fierce Martian crosswind
      vel[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
      vel[i * 3 + 2] = -4 - Math.random() * 8;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return [geo, vel];
  }, []);

  // Modern Gigafactory architectural monoliths
  const monoliths = useMemo(() => {
    const list = [];
    for (let i = 0; i < 28; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * (60 + (i * 13) % 70);
      const z = i * 350 + 60;
      const h = 30 + (i * 19) % 75;
      const w = 16 + (i * 7) % 20;
      const d = 22 + (i * 9) % 25;
      const color = isMarsMode
        ? (i % 2 === 0 ? '#78350f' : '#92400e')
        : (i % 3 === 0 ? '#1e2430' : i % 3 === 1 ? '#0f172a' : '#334155');
      list.push({ x, z, h, w, d, color });
    }
    return list;
  }, [isMarsMode]);

  // Cryogenic steam venting particles for Starship
  const steamCount = 80;
  const [steamPos, steamVel] = useMemo(() => {
    const pos = new Float32Array(steamCount * 3);
    const vel = new Float32Array(steamCount * 3);
    for (let i = 0; i < steamCount; i++) {
      pos[i * 3 + 0] = -120 + (Math.random() - 0.5) * 8;
      pos[i * 3 + 1] = 40 + Math.random() * 50;
      pos[i * 3 + 2] = 200 + (Math.random() - 0.5) * 8;

      vel[i * 3 + 0] = -3 - Math.random() * 4;
      vel[i * 3 + 1] = 0.5 + Math.random() * 1.5;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return [geo, vel];
  }, []);

  // Motion streaks at extreme velocity
  const lineCount = 140;
  const [linePositions, lineSpeeds] = useMemo(() => {
    const pos = new Float32Array(lineCount * 3);
    const speeds = new Float32Array(lineCount);
    for (let i = 0; i < lineCount; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 36;
      pos[i * 3 + 1] = 0.5 + Math.random() * 9;
      pos[i * 3 + 2] = Math.random() * 120;
      speeds[i] = 1.0 + Math.random() * 1.8;
    }
    return [pos, speeds];
  }, []);

  const linesGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    return geo;
  }, [linePositions]);

  // Ambient stars in high stratosphere
  const starGeo = useMemo(() => {
    const starCount = 350;
    const pos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 600;
      pos[i * 3 + 1] = 90 + Math.random() * 180;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 800;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return geo;
  }, []);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();

    // High velocity speed lines
    if (speedLinesRef.current) {
      const isFast = carSpeedKmh > 180;
      speedLinesRef.current.visible = isFast;

      if (isFast) {
        const speedFactor = (carSpeedKmh / 400) * 120;
        const posAttr = speedLinesRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;

        for (let i = 0; i < lineCount; i++) {
          arr[i * 3 + 2] -= delta * speedFactor * lineSpeeds[i];
          if (arr[i * 3 + 2] < carZ - 20) {
            arr[i * 3 + 2] = carZ + 140 + Math.random() * 60;
            arr[i * 3 + 0] = (Math.random() - 0.5) * 36;
            arr[i * 3 + 1] = 0.5 + Math.random() * 9;
          }
        }
        posAttr.needsUpdate = true;
      }
    }

    // Starman floating orbit in the upper sky
    if (starmanRef.current) {
      starmanRef.current.rotation.y = t * 0.15;
      starmanRef.current.rotation.x = Math.sin(t * 0.2) * 0.1;
      starmanRef.current.position.set(70, 110, carZ + 180 + Math.sin(t * 0.1) * 20);
    }

    // Starship cryogenic steam venting
    if (starshipSteamRef.current) {
      const posAttr = starshipSteamRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < steamCount; i++) {
        arr[i * 3 + 0] += steamVel[i * 3 + 0] * delta * 2.5;
        arr[i * 3 + 1] += steamVel[i * 3 + 1] * delta;
        if (arr[i * 3 + 0] < -170 || Math.random() < 0.04) {
          arr[i * 3 + 0] = -120 + (Math.random() - 0.5) * 5;
          arr[i * 3 + 1] = 40 + Math.random() * 55;
          arr[i * 3 + 2] = carZ + 280 + (Math.random() - 0.5) * 10;
        }
      }
      posAttr.needsUpdate = true;
    }

    // Starlink satellite train drifting across the sky
    if (starlinkTrainRef.current) {
      starlinkTrainRef.current.position.set(0, 160, carZ + 80);
      starlinkTrainRef.current.rotation.y = 0.25;
    }

    // Martian Dust Storm animation
    if (isMarsMode && marsDustRef.current) {
      const posAttr = marsDustRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < dustCount; i++) {
        arr[i * 3 + 0] += dustVel[i * 3 + 0] * delta;
        arr[i * 3 + 1] += dustVel[i * 3 + 1] * delta;
        arr[i * 3 + 2] += dustVel[i * 3 + 2] * delta;

        if (arr[i * 3 + 0] < -45 || arr[i * 3 + 2] < carZ - 50) {
          arr[i * 3 + 0] = 40 + Math.random() * 20;
          arr[i * 3 + 1] = 0.2 + Math.random() * 12;
          arr[i * 3 + 2] = carZ + 80 + Math.random() * 60;
        }
      }
      posAttr.needsUpdate = true;
    }
  });

  const skyColor = isMarsMode ? '#3c1208' : '#06080d';
  const fogColor = isMarsMode ? '#7c2d12' : '#07090f';

  return (
    <group name="Environment">
      {/* Dynamic Sky & Atmospheric Fog */}
      <color attach="background" args={[skyColor]} />
      <fog attach="fog" args={[fogColor, isMarsMode ? 60 : 100, isMarsMode ? 420 : 600]} />

      {/* Ambient Lighting */}
      <ambientLight intensity={isMarsMode ? 0.9 : 0.65} color={isMarsMode ? '#fed7aa' : '#cbd5e1'} />

      {/* Sun / Key Light */}
      <directionalLight
        position={[60, 120, carZ + 80]}
        intensity={isMarsMode ? 2.5 : 2.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={10}
        shadow-camera-far={320}
        shadow-camera-left={-55}
        shadow-camera-right={55}
        shadow-camera-top={55}
        shadow-camera-bottom={-55}
        color={isMarsMode ? '#ffedd5' : '#ffffff'}
      />

      {/* Atmospheric Fill Light */}
      <directionalLight
        position={[-60, 50, carZ - 40]}
        intensity={0.5}
        color={isMarsMode ? '#ea580c' : '#64748b'}
      />

      {/* High Altitude Cosmic Stars */}
      <points geometry={starGeo}>
        <pointsMaterial size={1.2} color="#ffffff" transparent opacity={isMarsMode ? 0.35 : 0.75} />
      </points>

      {/* Surrounding Ground Plane (Starbase Asphalt / Martian Regolith) */}
      <mesh position={[0, -0.25, carZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1800, 3600]} />
        <meshStandardMaterial
          color={isMarsMode ? '#5e1b07' : '#090c12'}
          roughness={0.94}
          metalness={0.06}
        />
      </mesh>

      {/* ----------------- MARS CELESTIAL PLANET & MOON ----------------- */}
      {isMarsMode && (
        <group position={[110, 130, carZ + 360]}>
          {/* Giant Mars Globe */}
          <mesh>
            <sphereGeometry args={[44, 32, 32]} />
            <meshStandardMaterial color="#c2410c" roughness={0.9} emissive="#7c2d12" emissiveIntensity={0.35} />
          </mesh>
          {/* Glowing Atmosphere Ring */}
          <mesh>
            <sphereGeometry args={[45.5, 32, 32]} />
            <meshBasicMaterial color="#f97316" transparent opacity={0.22} side={THREE.BackSide} />
          </mesh>
          {/* Martian Moon Phobos */}
          <mesh position={[60, 24, -25]}>
            <sphereGeometry args={[6.5, 16, 16]} />
            <meshStandardMaterial color="#78716c" roughness={0.95} />
          </mesh>
        </group>
      )}

      {/* Swirling Martian Dust Storm Particles */}
      {isMarsMode && (
        <points ref={marsDustRef} geometry={dustPos}>
          <pointsMaterial
            size={0.8}
            color="#fb923c"
            transparent
            opacity={0.65}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      )}

      {/* ----------------- STARBASE ORBITAL LAUNCH COMPLEX ----------------- */}
      {/* 120m Starship & Super Heavy on Launch Mount */}
      <group position={[-120, 0, carZ + 280]}>
        {/* Launch Mount Table (Concrete Pedestal) */}
        <mesh position={[0, 10, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[12, 16, 20, 16]} />
          <meshStandardMaterial color="#334155" roughness={0.7} metalness={0.4} />
        </mesh>

        {/* Super Heavy Booster (Stainless Steel Mirror Fuselage) */}
        <mesh position={[0, 55, 0]} castShadow>
          <cylinderGeometry args={[5.2, 5.2, 70, 24]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.15} />
        </mesh>

        {/* 4 Grid Fins on Booster */}
        {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => (
          <mesh
            key={`gridfin-${i}`}
            position={[Math.sin(angle) * 6.2, 86, Math.cos(angle) * 6.2]}
            rotation={[0, angle, 0]}
          >
            <boxGeometry args={[2.5, 3.5, 0.4]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
          </mesh>
        ))}

        {/* Starship Upper Stage (Black Heat Shield Tiles on Front) */}
        <mesh position={[0, 115, 0]} castShadow>
          <cylinderGeometry args={[4.8, 5.0, 50, 24]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.18} />
        </mesh>

        {/* Starship Aerodynamic Nose Cone */}
        <mesh position={[0, 148, 0]} castShadow>
          <coneGeometry args={[4.8, 16, 24]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.15} />
        </mesh>

        {/* Mechazilla Launch Tower ("Chopsticks") */}
        <mesh position={[18, 75, 0]} castShadow>
          <boxGeometry args={[9, 150, 9]} />
          <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.4} />
        </mesh>
        {/* Giant Robotic Catch Arms (Chopsticks) */}
        <mesh position={[7, 105, 7]} rotation={[0, -0.4, 0]}>
          <boxGeometry args={[16, 3, 2]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.3} />
        </mesh>
      </group>

      {/* Starship Cryogenic Boil-off Venting Steam */}
      <points ref={starshipSteamRef} geometry={steamPos}>
        <pointsMaterial
          size={2.8}
          color="#ffffff"
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* ----------------- ELON MUSK EASTER EGG: STARMAN IN ORBIT ----------------- */}
      <group ref={starmanRef}>
        {/* Midnight Cherry Red Roadster in Deep Space */}
        <mesh castShadow>
          <boxGeometry args={[3.2, 0.9, 6.2]} />
          <meshStandardMaterial color="#881337" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Cockpit with "Starman" Mannequin in SpaceX Suit */}
        <mesh position={[0, 0.7, -0.3]}>
          <boxGeometry args={[2.2, 0.8, 2.8]} />
          <meshStandardMaterial color="#05070a" roughness={0.1} metalness={0.9} />
        </mesh>
        {/* Starman Helmet (SpaceX White Visor) */}
        <mesh position={[-0.5, 1.1, -0.2]}>
          <sphereGeometry args={[0.35, 16, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.95} />
        </mesh>
        {/* Glowing Headlights pointing into the cosmos */}
        <mesh position={[-0.9, 0.1, 3.15]}>
          <boxGeometry args={[0.5, 0.15, 0.1]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.9, 0.1, 3.15]}>
          <boxGeometry args={[0.5, 0.15, 0.1]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        {/* Distant Earth & Moon in the Background */}
        <group position={[45, 20, 120]}>
          <mesh>
            <sphereGeometry args={[16, 32, 32]} />
            <meshStandardMaterial color="#0284c7" emissive="#0369a1" emissiveIntensity={0.2} />
          </mesh>
          <mesh position={[35, 10, -20]}>
            <sphereGeometry args={[4, 16, 16]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
        </group>
      </group>

      {/* ----------------- STARLINK SATELLITE TRAIN ----------------- */}
      <group ref={starlinkTrainRef}>
        {[-80, -40, 0, 40, 80, 120].map((xOff, i) => (
          <mesh key={`starlink-${i}`} position={[xOff, 0, xOff * 0.4]}>
            <boxGeometry args={[0.8, 0.3, 0.3]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        ))}
      </group>

      {/* ----------------- GIGAFACTORY ARCHITECTURE & ILLUMINATED LOGO ----------------- */}
      <group position={[150, 0, carZ + 180]}>
        {/* Main Low-Slung Factory Hub */}
        <mesh position={[0, 15, 0]} castShadow receiveShadow>
          <boxGeometry args={[120, 30, 240]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.7} />
        </mesh>
        {/* Illuminated Red Tesla 'T' Logo on Facade */}
        <mesh position={[-60.5, 22, 0]}>
          <boxGeometry args={[0.4, 7, 7]} />
          <meshBasicMaterial color="#e82127" />
        </mesh>
      </group>

      {/* Minimalist Monolith Buildings */}
      {monoliths.map((bldg, idx) => (
        <group key={`bldg-${idx}`} position={[bldg.x, 0, bldg.z]}>
          <mesh position={[0, bldg.h / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[bldg.w, bldg.h, bldg.d]} />
            <meshStandardMaterial
              color={bldg.color}
              roughness={0.8}
              metalness={0.2}
            />
          </mesh>
          <mesh position={[0, bldg.h + 0.05, 0]}>
            <boxGeometry args={[bldg.w * 0.96, 0.1, bldg.d * 0.96]} />
            <meshBasicMaterial color={isMarsMode ? '#f97316' : '#ffffff'} />
          </mesh>
        </group>
      ))}

      {/* High-Velocity Speed Streaks */}
      <points ref={speedLinesRef} geometry={linesGeometry} visible={false}>
        <pointsMaterial
          size={0.25}
          color={isMarsMode ? '#fed7aa' : '#ffffff'}
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
};
