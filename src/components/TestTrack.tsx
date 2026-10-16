import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { TrackRamp, TrackRing, TrackGap } from '../game/physics';

interface TestTrackProps {
  carZ: number;
  ramps: TrackRamp[];
  rings: TrackRing[];
  gaps: TrackGap[];
}

export const TestTrack: React.FC<TestTrackProps> = ({
  carZ,
  ramps,
  rings,
  gaps,
}) => {
  const ringsGroupRef = useRef<THREE.Group>(null);

  // Refined Architectural Materials
  const asphaltMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#10131a'),
        roughness: 0.85,
        metalness: 0.1,
      }),
    []
  );

  const neonStripeCyan = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#ffffff'),
      }),
    []
  );

  const neonStripeRed = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#ff3b30'),
      }),
    []
  );

  const rampMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#181c26'),
        roughness: 0.5,
        metalness: 0.5,
      }),
    []
  );

  const barrierMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#1c202c'),
        roughness: 0.4,
        metalness: 0.7,
      }),
    []
  );

  const ringUncollectedMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#ffffff'),
        emissive: new THREE.Color('#38bdf8'),
        emissiveIntensity: 1.5,
        roughness: 0.15,
        metalness: 0.9,
      }),
    []
  );

  const ringCollectedMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#334155'),
        transparent: true,
        opacity: 0.2,
      }),
    []
  );

  // Dynamically calculate visible road chunks around car (e.g. from carZ - 100 to carZ + 1200)
  const chunkSize = 100;
  const numChunks = 14;
  const startChunkIdx = Math.max(0, Math.floor((carZ - 150) / chunkSize));

  const visibleChunks = useMemo(() => {
    const list = [];
    for (let i = 0; i < numChunks; i++) {
      list.push(startChunkIdx + i);
    }
    return list;
  }, [startChunkIdx]);

  // Filter ramps and rings that are in visible range
  const visibleRamps = useMemo(() => {
    const minZ = carZ - 150;
    const maxZ = carZ + 1400;
    return ramps.filter((r) => r.zEnd >= minZ && r.zStart <= maxZ);
  }, [carZ, ramps]);

  const visibleRings = useMemo(() => {
    const minZ = carZ - 150;
    const maxZ = carZ + 1400;
    return rings.filter((r) => r.position.z >= minZ && r.position.z <= maxZ);
  }, [carZ, rings]);

  const visibleGaps = useMemo(() => {
    const minZ = carZ - 150;
    const maxZ = carZ + 1400;
    return gaps.filter((g) => g.zEnd >= minZ && g.zStart <= maxZ);
  }, [carZ, gaps]);

  // Rotate floating rings smoothly
  useFrame(({ clock }) => {
    if (ringsGroupRef.current) {
      const t = clock.getElapsedTime();
      ringsGroupRef.current.children.forEach((child, index) => {
        child.rotation.y = t * 1.5 + index * 0.4;
        child.rotation.z = Math.sin(t * 2 + index) * 0.15;
      });
    }
  });

  return (
    <group name="TestTrack">
      {/* ----------------- ROAD SEGMENTS ----------------- */}
      {visibleChunks.map((chunkIdx) => {
        const zCenter = chunkIdx * chunkSize + chunkSize / 2;
        // Check if this chunk is inside a gap
        const isInGap = visibleGaps.some(
          (g) => zCenter >= g.zStart && zCenter <= g.zEnd
        );

        if (isInGap) {
          // Render glowing abyss / broken track supports
          return (
            <group key={`chunk-gap-${chunkIdx}`} position={[0, -2, zCenter]}>
              {/* High-voltage electrical conduit glow beneath chasm */}
              <mesh position={[0, -15, 0]}>
                <boxGeometry args={[26, 1, chunkSize]} />
                <meshBasicMaterial color="#ff1e42" wireframe />
              </mesh>
            </group>
          );
        }

        return (
          <group key={`chunk-${chunkIdx}`} position={[0, 0, zCenter]}>
            {/* Main Asphalt Roadbed (Width = 25m, Length = 100m) */}
            <mesh
              receiveShadow
              rotation={[-Math.PI / 2, 0, 0]}
              material={asphaltMaterial}
            >
              <planeGeometry args={[25, chunkSize]} />
            </mesh>

            {/* Neon Border Edge Left */}
            <mesh
              position={[-12.4, 0.04, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              material={neonStripeCyan}
            >
              <planeGeometry args={[0.35, chunkSize]} />
            </mesh>

            {/* Neon Border Edge Right */}
            <mesh
              position={[12.4, 0.04, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              material={neonStripeCyan}
            >
              <planeGeometry args={[0.35, chunkSize]} />
            </mesh>

            {/* Center Dashed Speed Stripes */}
            {[-35, -15, 5, 25].map((zOffset) => (
              <mesh
                key={`dash-${zOffset}`}
                position={[0, 0.04, zOffset]}
                rotation={[-Math.PI / 2, 0, 0]}
                material={neonStripeCyan}
              >
                <planeGeometry args={[0.3, 10]} />
              </mesh>
            ))}

            {/* Left Guardrail */}
            <mesh position={[-12.7, 0.55, 0]} material={barrierMaterial}>
              <boxGeometry args={[0.35, 1.1, chunkSize]} />
            </mesh>
            <mesh position={[-12.7, 1.12, 0]} material={neonStripeRed}>
              <boxGeometry args={[0.38, 0.08, chunkSize]} />
            </mesh>

            {/* Right Guardrail */}
            <mesh position={[12.7, 0.55, 0]} material={barrierMaterial}>
              <boxGeometry args={[0.35, 1.1, chunkSize]} />
            </mesh>
            <mesh position={[12.7, 1.12, 0]} material={neonStripeRed}>
              <boxGeometry args={[0.38, 0.08, chunkSize]} />
            </mesh>

            {/* Track Light Pylons every 100m */}
            <group position={[-13.5, 0, 0]}>
              <mesh position={[0, 3.5, 0]} material={barrierMaterial}>
                <cylinderGeometry args={[0.15, 0.22, 7, 8]} />
              </mesh>
              <mesh position={[1.2, 7.0, 0]} material={neonStripeCyan}>
                <boxGeometry args={[2.5, 0.2, 0.4]} />
              </mesh>
            </group>
            <group position={[13.5, 0, 0]}>
              <mesh position={[0, 3.5, 0]} material={barrierMaterial}>
                <cylinderGeometry args={[0.15, 0.22, 7, 8]} />
              </mesh>
              <mesh position={[-1.2, 7.0, 0]} material={neonStripeCyan}>
                <boxGeometry args={[2.5, 0.2, 0.4]} />
              </mesh>
            </group>

            {/* Futuristic Overhead Gantry every 300m */}
            {chunkIdx % 3 === 0 && (
              <group position={[0, 0, 0]}>
                <mesh position={[-13.2, 5, 0]} material={barrierMaterial}>
                  <boxGeometry args={[0.8, 10, 0.8]} />
                </mesh>
                <mesh position={[13.2, 5, 0]} material={barrierMaterial}>
                  <boxGeometry args={[0.8, 10, 0.8]} />
                </mesh>
                <mesh position={[0, 9.8, 0]} material={barrierMaterial}>
                  <boxGeometry args={[27.2, 0.8, 1.2]} />
                </mesh>
                {/* Overhead Digital Display */}
                <mesh position={[0, 9.3, -0.6]}>
                  <planeGeometry args={[12, 1.2]} />
                  <meshBasicMaterial color="#00f0ff" />
                </mesh>
              </group>
            )}
          </group>
        );
      })}

      {/* ----------------- HIGH-SPEED LAUNCH RAMPS ----------------- */}
      {visibleRamps.map((ramp, index) => {
        const rampLength = ramp.zEnd - ramp.zStart;
        const rampCenterZ = (ramp.zStart + ramp.zEnd) / 2;
        const rampAngle = Math.atan2(ramp.height, rampLength);

        return (
          <group
            key={`ramp-${index}`}
            position={[0, 0, rampCenterZ]}
          >
            {/* Angled launch deck */}
            <mesh
              position={[0, ramp.height * 0.5, 0]}
              rotation={[rampAngle, 0, 0]}
              material={rampMaterial}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[12, 0.5, Math.hypot(rampLength, ramp.height)]} />
            </mesh>

            {/* Glowing Arrow Chevron Markings on Ramp */}
            {[-8, 0, 8].map((zOff, i) => (
              <mesh
                key={`chevron-${i}`}
                position={[0, ramp.height * 0.5 + 0.35, zOff]}
                rotation={[rampAngle, 0, 0]}
                material={neonStripeCyan}
              >
                <planeGeometry args={[6.0, 1.5]} />
              </mesh>
            ))}

            {/* Ramp side support pillars */}
            <mesh
              position={[-5.8, ramp.height * 0.25, 0]}
              material={barrierMaterial}
            >
              <boxGeometry args={[0.4, ramp.height * 0.5, rampLength]} />
            </mesh>
            <mesh
              position={[5.8, ramp.height * 0.25, 0]}
              material={barrierMaterial}
            >
              <boxGeometry args={[0.4, ramp.height * 0.5, rampLength]} />
            </mesh>
          </group>
        );
      })}

      {/* ----------------- FLOATING HOLOGRAPHIC RINGS ----------------- */}
      <group ref={ringsGroupRef}>
        {visibleRings.map((ring) => (
          <group key={ring.id} position={ring.position.toArray()}>
            {/* Outer Torus Ring */}
            <mesh material={ring.collected ? ringCollectedMat : ringUncollectedMat}>
              <torusGeometry args={[ring.radius, 0.28, 12, 32]} />
            </mesh>

            {/* Inner Holographic Energy Field */}
            {!ring.collected && (
              <mesh>
                <circleGeometry args={[ring.radius * 0.94, 24]} />
                <meshBasicMaterial
                  color="#00f0ff"
                  transparent
                  opacity={0.18}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}

            {/* Ring Anchor Drone / Floater Nodes */}
            <mesh position={[0, ring.radius + 0.6, 0]} material={barrierMaterial}>
              <boxGeometry args={[0.6, 0.4, 0.6]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
};
