import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { InputState } from '../types';

interface RoadsterModelProps {
  steeringAngle: number;
  wheelsRotation: number;
  isThrusterActive: boolean;
  isBoosting: boolean;
  isAirborne: boolean;
  input: InputState;
}

export const RoadsterModel: React.FC<RoadsterModelProps> = ({
  steeringAngle,
  wheelsRotation,
  isThrusterActive,
  isBoosting: _isBoosting,
  isAirborne: _isAirborne,
  input,
}) => {
  const frontLeftWheelRef = useRef<THREE.Group>(null);
  const frontRightWheelRef = useRef<THREE.Group>(null);
  const rearLeftWheelRef = useRef<THREE.Group>(null);
  const rearRightWheelRef = useRef<THREE.Group>(null);

  // Thruster particle references
  const rearPlumeRef = useRef<THREE.Points>(null);
  const downPlumeLeftRef = useRef<THREE.Points>(null);
  const downPlumeRightRef = useRef<THREE.Points>(null);
  const thrusterGlowRef = useRef<THREE.PointLight>(null);
  const groundGlowRef = useRef<THREE.PointLight>(null);

  // Authentic Multi-coat Pearlescent White Body Paint
  const bodyPaintMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#f5f7fa'),
        metalness: 0.75,
        roughness: 0.18,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        reflectivity: 0.95,
      }),
    []
  );

  // Matte Carbon Fiber (Diffuser, Splitter, Active Elevated Wing)
  const carbonMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#14171d'),
        roughness: 0.4,
        metalness: 0.6,
      }),
    []
  );

  // Tinted Panoramic Glass Roof
  const glassCanopyMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#0a0d14'),
        metalness: 0.95,
        roughness: 0.04,
        transmission: 0.65,
        opacity: 0.96,
        transparent: true,
      }),
    []
  );

  // Tesla Signature Red LED Taillight Bar
  const taillightMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#ff1e27'),
      }),
    []
  );

  // Front Cyber Headlights
  const headlightMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#ffffff'),
      }),
    []
  );

  // SpaceX Cold-Gas Titanium Thruster Nozzles
  const nozzleMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#23262d'),
        metalness: 0.95,
        roughness: 0.25,
      }),
    []
  );

  const wheelRimMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#22262e'),
        metalness: 0.92,
        roughness: 0.25,
      }),
    []
  );

  const tireRubberMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#121316'),
        roughness: 0.88,
        metalness: 0.1,
      }),
    []
  );

  const brakeCaliperMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#e82127'),
        roughness: 0.3,
        metalness: 0.8,
      }),
    []
  );

  // 1. Rear Horizontal Plume setup (4 nozzles)
  const rearParticleCount = 120;
  const [rearPos, rearVel] = useMemo(() => {
    const pos = new Float32Array(rearParticleCount * 3);
    const vel = new Float32Array(rearParticleCount * 3);
    for (let i = 0; i < rearParticleCount; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 0.9;
      pos[i * 3 + 1] = 0.32 + (Math.random() - 0.5) * 0.1;
      pos[i * 3 + 2] = -2.08;

      vel[i * 3 + 0] = (Math.random() - 0.5) * 1.0;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.8;
      vel[i * 3 + 2] = -12.0 - Math.random() * 16.0;
    }
    return [pos, vel];
  }, []);

  const rearPlumeGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(rearPos, 3));
    return geo;
  }, [rearPos]);

  // 2. Underbody Downward Plumes setup (Left and Right jets blasting into the ground!)
  const downParticleCount = 100;
  const createDownPlumeData = (xOffset: number) => {
    const pos = new Float32Array(downParticleCount * 3);
    const vel = new Float32Array(downParticleCount * 3);
    for (let i = 0; i < downParticleCount; i++) {
      pos[i * 3 + 0] = xOffset + (Math.random() - 0.5) * 0.2;
      pos[i * 3 + 1] = 0.18;
      pos[i * 3 + 2] = -1.5 + (Math.random() - 0.5) * 0.2;

      vel[i * 3 + 0] = (Math.random() - 0.5) * 1.5;
      vel[i * 3 + 1] = -15.0 - Math.random() * 12.0; // Shoot straight down!
      vel[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return { geo, vel };
  };

  const leftDownData = useMemo(() => createDownPlumeData(-0.72), []);
  const rightDownData = useMemo(() => createDownPlumeData(0.72), []);

  useFrame((_, delta) => {
    // Steer front wheels
    if (frontLeftWheelRef.current && frontRightWheelRef.current) {
      frontLeftWheelRef.current.rotation.y = steeringAngle;
      frontRightWheelRef.current.rotation.y = steeringAngle;
    }

    // Spin wheels
    if (frontLeftWheelRef.current && frontRightWheelRef.current && rearLeftWheelRef.current && rearRightWheelRef.current) {
      frontLeftWheelRef.current.children[0].rotation.x = wheelsRotation;
      frontRightWheelRef.current.children[0].rotation.x = wheelsRotation;
      rearLeftWheelRef.current.children[0].rotation.x = wheelsRotation;
      rearRightWheelRef.current.children[0].rotation.x = wheelsRotation;
    }

    // Thruster Gas Plumes Animation (Both Rear and Downward Underbody Jets!)
    const active = isThrusterActive || input.thruster;
    if (rearPlumeRef.current && downPlumeLeftRef.current && downPlumeRightRef.current) {
      rearPlumeRef.current.visible = active;
      downPlumeLeftRef.current.visible = active;
      downPlumeRightRef.current.visible = active;

      if (active) {
        // Animate rear plume
        const rearArr = (rearPlumeRef.current.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
        for (let i = 0; i < rearParticleCount; i++) {
          rearArr[i * 3 + 0] += rearVel[i * 3 + 0] * delta;
          rearArr[i * 3 + 1] += rearVel[i * 3 + 1] * delta;
          rearArr[i * 3 + 2] += rearVel[i * 3 + 2] * delta;
          if (rearArr[i * 3 + 2] < -6.5 || Math.random() < 0.05) {
            rearArr[i * 3 + 0] = (Math.random() - 0.5) * 0.9;
            rearArr[i * 3 + 1] = 0.32 + (Math.random() - 0.5) * 0.1;
            rearArr[i * 3 + 2] = -2.08;
          }
        }
        rearPlumeRef.current.geometry.attributes.position.needsUpdate = true;

        // Animate left downward plume
        const leftArr = (downPlumeLeftRef.current.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
        for (let i = 0; i < downParticleCount; i++) {
          leftArr[i * 3 + 0] += leftDownData.vel[i * 3 + 0] * delta;
          leftArr[i * 3 + 1] += leftDownData.vel[i * 3 + 1] * delta;
          leftArr[i * 3 + 2] += leftDownData.vel[i * 3 + 2] * delta;
          if (leftArr[i * 3 + 1] < -2.5 || Math.random() < 0.08) {
            leftArr[i * 3 + 0] = -0.72 + (Math.random() - 0.5) * 0.15;
            leftArr[i * 3 + 1] = 0.18;
            leftArr[i * 3 + 2] = -1.5 + (Math.random() - 0.5) * 0.15;
          }
        }
        downPlumeLeftRef.current.geometry.attributes.position.needsUpdate = true;

        // Animate right downward plume
        const rightArr = (downPlumeRightRef.current.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
        for (let i = 0; i < downParticleCount; i++) {
          rightArr[i * 3 + 0] += rightDownData.vel[i * 3 + 0] * delta;
          rightArr[i * 3 + 1] += rightDownData.vel[i * 3 + 1] * delta;
          rightArr[i * 3 + 2] += rightDownData.vel[i * 3 + 2] * delta;
          if (rightArr[i * 3 + 1] < -2.5 || Math.random() < 0.08) {
            rightArr[i * 3 + 0] = 0.72 + (Math.random() - 0.5) * 0.15;
            rightArr[i * 3 + 1] = 0.18;
            rightArr[i * 3 + 2] = -1.5 + (Math.random() - 0.5) * 0.15;
          }
        }
        downPlumeRightRef.current.geometry.attributes.position.needsUpdate = true;

        if (thrusterGlowRef.current) thrusterGlowRef.current.intensity = 4.0;
        if (groundGlowRef.current) groundGlowRef.current.intensity = 5.0;
      } else {
        if (thrusterGlowRef.current) thrusterGlowRef.current.intensity = 0.0;
        if (groundGlowRef.current) groundGlowRef.current.intensity = 0.0;
      }
    }
  });

  return (
    <group name="TeslaRoadsterOct15">
      {/* ----------------- CHASSIS MAIN BODY ----------------- */}
      {/* Lower sculpted fuselage */}
      <mesh castShadow receiveShadow position={[0, 0.34, 0.1]} material={bodyPaintMaterial}>
        <boxGeometry args={[1.92, 0.38, 4.3]} />
      </mesh>

      {/* Aerodynamic front wedge hood */}
      <mesh castShadow receiveShadow position={[0, 0.35, 1.35]} rotation={[-0.14, 0, 0]} material={bodyPaintMaterial}>
        <boxGeometry args={[1.84, 0.22, 1.5]} />
      </mesh>

      {/* Front splitter (Carbon fiber) */}
      <mesh castShadow position={[0, 0.14, 2.15]} material={carbonMaterial}>
        <boxGeometry args={[1.94, 0.06, 0.45]} />
      </mesh>

      {/* Flared front fenders */}
      <mesh castShadow position={[-0.95, 0.42, 1.25]} rotation={[0, 0, -0.08]} material={bodyPaintMaterial}>
        <boxGeometry args={[0.22, 0.32, 1.1]} />
      </mesh>
      <mesh castShadow position={[0.95, 0.42, 1.25]} rotation={[0, 0, 0.08]} material={bodyPaintMaterial}>
        <boxGeometry args={[0.22, 0.32, 1.1]} />
      </mesh>

      {/* Muscular rear haunches (exact to reveal photos) */}
      <mesh castShadow position={[-0.96, 0.48, -1.05]} rotation={[0, 0, -0.1]} material={bodyPaintMaterial}>
        <boxGeometry args={[0.26, 0.4, 1.25]} />
      </mesh>
      <mesh castShadow position={[0.96, 0.48, -1.05]} rotation={[0, 0, 0.1]} material={bodyPaintMaterial}>
        <boxGeometry args={[0.26, 0.4, 1.25]} />
      </mesh>

      {/* Side carbon skirts */}
      <mesh position={[-0.97, 0.16, 0.1]} material={carbonMaterial}>
        <boxGeometry args={[0.08, 0.14, 2.2]} />
      </mesh>
      <mesh position={[0.97, 0.16, 0.1]} material={carbonMaterial}>
        <boxGeometry args={[0.08, 0.14, 2.2]} />
      </mesh>

      {/* ----------------- COCKPIT & GLASS CANOPY ----------------- */}
      <mesh castShadow position={[0, 0.62, -0.12]} material={glassCanopyMaterial}>
        <boxGeometry args={[1.44, 0.38, 2.1]} />
      </mesh>

      {/* Minimalist Dashboard */}
      <mesh position={[0, 0.52, 0.4]} material={carbonMaterial}>
        <boxGeometry args={[1.1, 0.12, 0.35]} />
      </mesh>
      {/* Minimalist Steering Yoke */}
      <mesh position={[-0.32, 0.56, 0.28]} rotation={[0.4, 0, 0]}>
        <torusGeometry args={[0.12, 0.02, 8, 16, Math.PI * 1.5]} />
        <meshStandardMaterial color="#2a2e36" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* ----------------- LIGHTING ----------------- */}
      {/* Front Cyber Headlight Strips */}
      <mesh position={[-0.68, 0.36, 2.05]} material={headlightMaterial}>
        <boxGeometry args={[0.44, 0.04, 0.05]} />
      </mesh>
      <mesh position={[0.68, 0.36, 2.05]} material={headlightMaterial}>
        <boxGeometry args={[0.44, 0.04, 0.05]} />
      </mesh>

      {/* Forward Headlight Beams */}
      <spotLight
        position={[-0.65, 0.4, 2.1]}
        target-position={[-0.65, 0, 30]}
        intensity={6.0}
        angle={0.65}
        penumbra={0.4}
        distance={70}
        color="#ffffff"
      />
      <spotLight
        position={[0.65, 0.4, 2.1]}
        target-position={[0.65, 0, 30]}
        intensity={6.0}
        angle={0.65}
        penumbra={0.4}
        distance={70}
        color="#ffffff"
      />

      {/* Continuous Red LED Taillight Bar (Signature Tesla Tail) */}
      <mesh position={[0, 0.52, -2.06]} material={taillightMaterial}>
        <boxGeometry args={[1.86, 0.045, 0.05]} />
      </mesh>

      {/* ----------------- ACTIVE ELEVATED REAR WING (EXACT TO REVEAL PHOTO) ----------------- */}
      {/* Left & Right Wing Support Pylons */}
      <mesh position={[-0.65, 0.72, -1.82]} material={carbonMaterial} castShadow>
        <boxGeometry args={[0.06, 0.32, 0.18]} />
      </mesh>
      <mesh position={[0.65, 0.72, -1.82]} material={carbonMaterial} castShadow>
        <boxGeometry args={[0.06, 0.32, 0.18]} />
      </mesh>

      {/* Main Elevated Aerodynamic Carbon Wing Plank */}
      <mesh position={[0, 0.88, -1.85]} rotation={[0.08, 0, 0]} material={carbonMaterial} castShadow>
        <boxGeometry args={[1.96, 0.04, 0.42]} />
      </mesh>

      {/* Wing Left & Right Vertical Endplates */}
      <mesh position={[-0.98, 0.88, -1.85]} material={carbonMaterial} castShadow>
        <boxGeometry args={[0.04, 0.22, 0.44]} />
      </mesh>
      <mesh position={[0.98, 0.88, -1.85]} material={carbonMaterial} castShadow>
        <boxGeometry args={[0.04, 0.22, 0.44]} />
      </mesh>

      {/* ----------------- 4 HORIZONTAL SPACEX REAR THRUSTERS ----------------- */}
      {/* 4 circular nozzles in a row across the rear fascia plate (exact to photos) */}
      {[-0.45, -0.15, 0.15, 0.45].map((xOff, idx) => (
        <group key={`rear-nozzle-${idx}`} position={[xOff, 0.32, -2.08]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={nozzleMaterial}>
            <cylinderGeometry args={[0.1, 0.07, 0.18, 16, 1, true]} />
          </mesh>
          <mesh position={[0, 0, 0.06]} material={headlightMaterial}>
            <circleGeometry args={[0.065, 16]} />
          </mesh>
        </group>
      ))}

      {/* Rear Thruster Plume */}
      <points ref={rearPlumeRef} geometry={rearPlumeGeo} visible={false}>
        <pointsMaterial
          size={0.36}
          color="#e0f2fe"
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Rear Point Light */}
      <pointLight ref={thrusterGlowRef} position={[0, 0.32, -2.4]} color="#ffffff" intensity={0} distance={10} />

      {/* ----------------- 2 UNDERBODY DOWNWARD THRUSTERS (FOR STANDING FLIPS & JUMPS) ----------------- */}
      {/* Left Downward Nozzle */}
      <group position={[-0.72, 0.16, -1.5]}>
        <mesh material={nozzleMaterial}>
          <cylinderGeometry args={[0.11, 0.08, 0.14, 16]} />
        </mesh>
        <mesh position={[0, -0.06, 0]} rotation={[Math.PI / 2, 0, 0]} material={headlightMaterial}>
          <circleGeometry args={[0.08, 16]} />
        </mesh>
      </group>

      {/* Right Downward Nozzle */}
      <group position={[0.72, 0.16, -1.5]}>
        <mesh material={nozzleMaterial}>
          <cylinderGeometry args={[0.11, 0.08, 0.14, 16]} />
        </mesh>
        <mesh position={[0, -0.06, 0]} rotation={[Math.PI / 2, 0, 0]} material={headlightMaterial}>
          <circleGeometry args={[0.08, 16]} />
        </mesh>
      </group>

      {/* Underbody Downward Plumes shooting straight into the ground! */}
      <points ref={downPlumeLeftRef} geometry={leftDownData.geo} visible={false}>
        <pointsMaterial
          size={0.4}
          color="#f0f9ff"
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      <points ref={downPlumeRightRef} geometry={rightDownData.geo} visible={false}>
        <pointsMaterial
          size={0.4}
          color="#f0f9ff"
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Ground blast illumination point light */}
      <pointLight ref={groundGlowRef} position={[0, 0.1, -1.5]} color="#ffffff" intensity={0} distance={12} />

      {/* ----------------- WHEELS & PERFORMANCE BRAKES ----------------- */}
      {/* Front Left */}
      <group ref={frontLeftWheelRef} position={[-0.94, 0.32, 1.3]}>
        <group>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={tireRubberMaterial}>
            <cylinderGeometry args={[0.34, 0.34, 0.28, 24]} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} material={wheelRimMaterial}>
            <cylinderGeometry args={[0.24, 0.24, 0.285, 16]} />
          </mesh>
          <mesh position={[0.08, 0.12, 0]} material={brakeCaliperMaterial}>
            <boxGeometry args={[0.08, 0.12, 0.1]} />
          </mesh>
        </group>
      </group>

      {/* Front Right */}
      <group ref={frontRightWheelRef} position={[0.94, 0.32, 1.3]}>
        <group>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={tireRubberMaterial}>
            <cylinderGeometry args={[0.34, 0.34, 0.28, 24]} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} material={wheelRimMaterial}>
            <cylinderGeometry args={[0.24, 0.24, 0.285, 16]} />
          </mesh>
          <mesh position={[-0.08, 0.12, 0]} material={brakeCaliperMaterial}>
            <boxGeometry args={[0.08, 0.12, 0.1]} />
          </mesh>
        </group>
      </group>

      {/* Rear Left */}
      <group ref={rearLeftWheelRef} position={[-0.96, 0.34, -1.25]}>
        <group>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={tireRubberMaterial}>
            <cylinderGeometry args={[0.36, 0.36, 0.34, 24]} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} material={wheelRimMaterial}>
            <cylinderGeometry args={[0.25, 0.25, 0.345, 16]} />
          </mesh>
          <mesh position={[0.08, 0.12, 0]} material={brakeCaliperMaterial}>
            <boxGeometry args={[0.08, 0.14, 0.11]} />
          </mesh>
        </group>
      </group>

      {/* Rear Right */}
      <group ref={rearRightWheelRef} position={[0.96, 0.34, -1.25]}>
        <group>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={tireRubberMaterial}>
            <cylinderGeometry args={[0.36, 0.36, 0.34, 24]} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} material={wheelRimMaterial}>
            <cylinderGeometry args={[0.25, 0.25, 0.345, 16]} />
          </mesh>
          <mesh position={[-0.08, 0.12, 0]} material={brakeCaliperMaterial}>
            <boxGeometry args={[0.08, 0.14, 0.11]} />
          </mesh>
        </group>
      </group>
    </group>
  );
};
