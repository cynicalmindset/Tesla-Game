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
  isCrashing?: boolean;
  isFireActive?: boolean;
  damageLevel?: number;
  isStuntActive?: boolean;
}

export const RoadsterModel: React.FC<RoadsterModelProps> = ({
  steeringAngle,
  wheelsRotation,
  isThrusterActive,
  isBoosting: _isBoosting,
  isAirborne,
  input,
  isCrashing = false,
  isFireActive = false,
  damageLevel = 0,
  isStuntActive = false,
}) => {
  const frontLeftWheelRef = useRef<THREE.Group>(null);
  const frontRightWheelRef = useRef<THREE.Group>(null);
  const rearLeftWheelRef = useRef<THREE.Group>(null);
  const rearRightWheelRef = useRef<THREE.Group>(null);

  // Thruster particle references
  const rearPlumeRef = useRef<THREE.Points>(null);
  const downPlumeLeftRef = useRef<THREE.Points>(null);
  const downPlumeRightRef = useRef<THREE.Points>(null);
  const rcsPuffRef = useRef<THREE.Points>(null);

  // Crash Fire, Smoke & Sparks tracking references
  const crashFireRef = useRef<THREE.Points>(null);
  const crashSmokeRef = useRef<THREE.Points>(null);
  const crashSparksRef = useRef<THREE.Points>(null);
  const fireLightRef = useRef<THREE.PointLight>(null);

  // Shock diamonds & ground rings
  const rearConesGroupRef = useRef<THREE.Group>(null);
  const downConesGroupRef = useRef<THREE.Group>(null);
  const groundRingMeshRef = useRef<THREE.Mesh>(null);
  const groundRingScaleRef = useRef(0.8);

  const thrusterGlowRef = useRef<THREE.PointLight>(null);
  const groundGlowRef = useRef<THREE.PointLight>(null);

  // Authentic Multi-coat Pearlescent White Body Paint
  const bodyPaintMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#f8fafc'),
        metalness: 0.8,
        roughness: 0.16,
        clearcoat: 1.0,
        clearcoatRoughness: 0.04,
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

  // Supersonic Shock Cones (Cyan Plasma / Cold-Gas Core)
  const flameCoreMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#38bdf8'),
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  const shockDiamondMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#ffffff'),
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  // Expanding Ground Impact Shockwave Ring Material
  const groundRingMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#7dd3fc'),
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
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

  // Elon Musk Easter Egg 1: Center Touchscreen "DON'T PANIC!"
  const dontPanicTexture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, 512, 256);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
      ctx.lineWidth = 1;
      for (let x = 0; x < 512; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 256);
        ctx.stroke();
      }
      for (let y = 0; y < 256; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();
      }

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.strokeRect(6, 6, 500, 244);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 15px monospace';
      ctx.fillText('SPACEX COLD-GAS THRUSTERS ACTIVE', 20, 36);
      ctx.fillText('420 KM/H PLAID', 340, 36);

      ctx.fillStyle = '#34d399';
      ctx.font = '900 56px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#34d399';
      ctx.shadowBlur = 18;
      ctx.fillText("DON'T PANIC!", 256, 128);

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 18px monospace';
      ctx.fillText('ORBITAL VELOCITY • MARS BOUND', 256, 178);

      ctx.fillStyle = '#f59e0b';
      ctx.font = '14px monospace';
      ctx.fillText('TARGET: OCCUPY MARS', 256, 222);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = true;
    return texture;
  }, []);

  const dontPanicMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: dontPanicTexture,
      }),
    [dontPanicTexture]
  );

  // Elon Musk Easter Egg 2: Undercarriage Plaque "MADE ON EARTH BY HUMANS"
  const madeOnEarthTexture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#080a10';
      ctx.fillRect(0, 0, 512, 128);

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.strokeRect(6, 6, 500, 116);

      ctx.fillStyle = '#fef08a';
      ctx.font = '900 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 10;
      ctx.fillText('MADE ON EARTH BY HUMANS', 256, 60);

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 16px monospace';
      ctx.fillText('TESLA ROADSTER • SPACEX STARSHIP PACK', 256, 94);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = true;
    return texture;
  }, []);

  const madeOnEarthMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: madeOnEarthTexture,
        side: THREE.DoubleSide,
      }),
    [madeOnEarthTexture]
  );


  // Procedural Smooth Radial Particle Textures (Removes square edges, creates photorealistic volumetric particles)
  const particleTexture = useMemo(() => {
    if (typeof document === 'undefined') return undefined;
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.7)');
    gradient.addColorStop(0.65, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
  }, []);

  const fireTexture = useMemo(() => {
    if (typeof document === 'undefined') return undefined;
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 240, 200, 1)');
    gradient.addColorStop(0.25, 'rgba(255, 120, 20, 0.85)');
    gradient.addColorStop(0.65, 'rgba(220, 38, 38, 0.35)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
  }, []);

  const smokeTexture = useMemo(() => {
    if (typeof document === 'undefined') return undefined;
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(24, 24, 27, 0.8)');
    gradient.addColorStop(0.35, 'rgba(39, 39, 42, 0.5)');
    gradient.addColorStop(0.7, 'rgba(63, 63, 70, 0.15)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
  }, []);

  // 1. Rear Horizontal Plume setup (4 nozzles)
  const rearParticleCount = 140;
  const [rearPos, rearVel] = useMemo(() => {
    const pos = new Float32Array(rearParticleCount * 3);
    const vel = new Float32Array(rearParticleCount * 3);
    for (let i = 0; i < rearParticleCount; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 0.9;
      pos[i * 3 + 1] = 0.32 + (Math.random() - 0.5) * 0.1;
      pos[i * 3 + 2] = -2.08;

      vel[i * 3 + 0] = (Math.random() - 0.5) * 1.2;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.9;
      vel[i * 3 + 2] = -14.0 - Math.random() * 18.0;
    }
    return [pos, vel];
  }, []);

  const rearPlumeGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(rearPos, 3));
    return geo;
  }, [rearPos]);

  // 2. Underbody Downward Plumes setup (Left and Right jets blasting into the ground!)
  const downParticleCount = 120;
  const createDownPlumeData = (xOffset: number) => {
    const pos = new Float32Array(downParticleCount * 3);
    const vel = new Float32Array(downParticleCount * 3);
    for (let i = 0; i < downParticleCount; i++) {
      pos[i * 3 + 0] = xOffset + (Math.random() - 0.5) * 0.22;
      pos[i * 3 + 1] = 0.18;
      pos[i * 3 + 2] = -1.5 + (Math.random() - 0.5) * 0.22;

      vel[i * 3 + 0] = (Math.random() - 0.5) * 2.2;
      vel[i * 3 + 1] = -18.0 - Math.random() * 14.0; // Violent downward jet
      vel[i * 3 + 2] = (Math.random() - 0.5) * 2.2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return { geo, vel };
  };

  const leftDownData = useMemo(() => createDownPlumeData(-0.72), []);
  const rightDownData = useMemo(() => createDownPlumeData(0.72), []);

  // 3. RCS Micro-Puffs for Attitude Stunts (Flips, Rolls, Spins)
  const rcsParticleCount = 60;
  const [rcsPos, rcsVel] = useMemo(() => {
    const pos = new Float32Array(rcsParticleCount * 3);
    const vel = new Float32Array(rcsParticleCount * 3);
    for (let i = 0; i < rcsParticleCount; i++) {
      pos[i * 3 + 0] = (Math.random() > 0.5 ? 0.95 : -0.95);
      pos[i * 3 + 1] = 0.45;
      pos[i * 3 + 2] = (Math.random() > 0.5 ? 1.6 : -1.8);

      vel[i * 3 + 0] = Math.sign(pos[i * 3 + 0]) * (4.0 + Math.random() * 6.0);
      vel[i * 3 + 1] = (Math.random() - 0.5) * 3.0;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 3.0;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return [geo, vel];
  }, []);

  // 4. Tracking Crash Fire Particles (Attached to Car Origin)
  const crashFireCount = 130;
  const [crashFirePos, crashFireVel] = useMemo(() => {
    const pos = new Float32Array(crashFireCount * 3);
    const vel = new Float32Array(crashFireCount * 3);
    for (let i = 0; i < crashFireCount; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 1.4;
      pos[i * 3 + 1] = 0.35 + Math.random() * 0.4;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2.2;

      vel[i * 3 + 0] = (Math.random() - 0.5) * 2.0;
      vel[i * 3 + 1] = 4.5 + Math.random() * 6.5; // Fierce roaring fire
      vel[i * 3 + 2] = -4.0 - Math.random() * 9.0; // Flame blown backward
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return [geo, vel];
  }, []);

  // 5. Billowing Black Smoke Particles
  const crashSmokeCount = 100;
  const [crashSmokePos, crashSmokeVel] = useMemo(() => {
    const pos = new Float32Array(crashSmokeCount * 3);
    const vel = new Float32Array(crashSmokeCount * 3);
    for (let i = 0; i < crashSmokeCount; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 1.6;
      pos[i * 3 + 1] = 0.5 + Math.random() * 0.6;
      pos[i * 3 + 2] = -0.5 + (Math.random() - 0.5) * 2.0;

      vel[i * 3 + 0] = (Math.random() - 0.5) * 2.5;
      vel[i * 3 + 1] = 3.5 + Math.random() * 5.5; // Billowing skyward
      vel[i * 3 + 2] = -6.0 - Math.random() * 11.0;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return [geo, vel];
  }, []);

  // 6. Ground Friction Metal Sparks
  const crashSparksCount = 60;
  const [crashSparksPos, crashSparksVel] = useMemo(() => {
    const pos = new Float32Array(crashSparksCount * 3);
    const vel = new Float32Array(crashSparksCount * 3);
    for (let i = 0; i < crashSparksCount; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 1.8;
      pos[i * 3 + 1] = 0.05 + Math.random() * 0.2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2.0;

      vel[i * 3 + 0] = (Math.random() - 0.5) * 9.0;
      vel[i * 3 + 1] = 0.5 + Math.random() * 3.5;
      vel[i * 3 + 2] = -12.0 - Math.random() * 14.0;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return [geo, vel];
  }, []);

  useFrame(({ clock }, delta) => {
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

    const isStuntKey = Boolean(input.instantFlip || input.instantRoll || input.instantSpin || isStuntActive);
    const active = isThrusterActive || input.thruster || isStuntKey;

    // Supersonic Shock Cones & Mach Diamonds Animation
    if (rearConesGroupRef.current && downConesGroupRef.current) {
      rearConesGroupRef.current.visible = active;
      downConesGroupRef.current.visible = active;

      if (active) {
        const flutter = 1.0 + Math.sin(clock.getElapsedTime() * 75) * 0.18;
        rearConesGroupRef.current.scale.set(1.0, 1.0, flutter);
        downConesGroupRef.current.scale.set(1.0, flutter * 1.15, 1.0);
      }
    }

    // Ground Impact Shockwave Rings (Expanding radial vapor disc)
    if (groundRingMeshRef.current) {
      if (active && (!isAirborne || groundRingScaleRef.current < 2.5)) {
        groundRingMeshRef.current.visible = true;
        groundRingScaleRef.current += delta * 4.5;
        if (groundRingScaleRef.current > 3.4) {
          groundRingScaleRef.current = 0.8;
        }
        groundRingMeshRef.current.scale.set(
          groundRingScaleRef.current,
          groundRingScaleRef.current,
          groundRingScaleRef.current
        );
        const ringMat = groundRingMeshRef.current.material as THREE.MeshBasicMaterial;
        ringMat.opacity = Math.max(0, 0.75 * (1 - (groundRingScaleRef.current - 0.8) / 2.6));
      } else {
        groundRingMeshRef.current.visible = false;
        groundRingScaleRef.current = 0.8;
      }
    }

    // Thruster Gas Plumes Animation (Both Rear and Downward Underbody Jets!)
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
          if (rearArr[i * 3 + 2] < -7.0 || Math.random() < 0.06) {
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
          if (leftArr[i * 3 + 1] < -3.0 || Math.random() < 0.08) {
            leftArr[i * 3 + 0] = -0.72 + (Math.random() - 0.5) * 0.18;
            leftArr[i * 3 + 1] = 0.18;
            leftArr[i * 3 + 2] = -1.5 + (Math.random() - 0.5) * 0.18;
          }
        }
        downPlumeLeftRef.current.geometry.attributes.position.needsUpdate = true;

        // Animate right downward plume
        const rightArr = (downPlumeRightRef.current.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
        for (let i = 0; i < downParticleCount; i++) {
          rightArr[i * 3 + 0] += rightDownData.vel[i * 3 + 0] * delta;
          rightArr[i * 3 + 1] += rightDownData.vel[i * 3 + 1] * delta;
          rightArr[i * 3 + 2] += rightDownData.vel[i * 3 + 2] * delta;
          if (rightArr[i * 3 + 1] < -3.0 || Math.random() < 0.08) {
            rightArr[i * 3 + 0] = 0.72 + (Math.random() - 0.5) * 0.18;
            rightArr[i * 3 + 1] = 0.18;
            rightArr[i * 3 + 2] = -1.5 + (Math.random() - 0.5) * 0.18;
          }
        }
        downPlumeRightRef.current.geometry.attributes.position.needsUpdate = true;

        if (thrusterGlowRef.current) thrusterGlowRef.current.intensity = 5.5;
        if (groundGlowRef.current) groundGlowRef.current.intensity = 6.5;
      } else {
        if (thrusterGlowRef.current) thrusterGlowRef.current.intensity = 0.0;
        if (groundGlowRef.current) groundGlowRef.current.intensity = 0.0;
      }
    }

    // RCS Attitude Micro-Puffs
    if (rcsPuffRef.current) {
      const isRcsActive = Boolean(
        isStuntKey ||
        (isAirborne && (input.rollLeft || input.rollRight || input.pitchUp || input.pitchDown || input.yawLeft || input.yawRight))
      );
      rcsPuffRef.current.visible = isRcsActive;
      if (isRcsActive) {
        const rcsArr = (rcsPuffRef.current.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
        for (let i = 0; i < rcsParticleCount; i++) {
          rcsArr[i * 3 + 0] += rcsVel[i * 3 + 0] * delta;
          rcsArr[i * 3 + 1] += rcsVel[i * 3 + 1] * delta;
          rcsArr[i * 3 + 2] += rcsVel[i * 3 + 2] * delta;
          if (Math.abs(rcsArr[i * 3 + 0]) > 2.5 || Math.random() < 0.12) {
            rcsArr[i * 3 + 0] = (Math.random() > 0.5 ? 0.95 : -0.95);
            rcsArr[i * 3 + 1] = 0.45;
            rcsArr[i * 3 + 2] = (Math.random() > 0.5 ? 1.6 : -1.8);
          }
        }
        rcsPuffRef.current.geometry.attributes.position.needsUpdate = true;
      }
    }

    // Animate Tracking Crash Fire, Smoke & Sparks
    const isBurning = Boolean(isFireActive || isCrashing || damageLevel >= 2);
    if (crashFireRef.current && crashSmokeRef.current && crashSparksRef.current) {
      crashFireRef.current.visible = isBurning;
      crashSmokeRef.current.visible = Boolean(isBurning || damageLevel >= 1);
      crashSparksRef.current.visible = Boolean(isCrashing || (isBurning && !isAirborne));

      if (isBurning || damageLevel >= 1) {
        // Animate fire
        if (isBurning) {
          const fireArr = (crashFireRef.current.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
          for (let i = 0; i < crashFireCount; i++) {
            fireArr[i * 3 + 0] += crashFireVel[i * 3 + 0] * delta;
            fireArr[i * 3 + 1] += crashFireVel[i * 3 + 1] * delta;
            fireArr[i * 3 + 2] += crashFireVel[i * 3 + 2] * delta;

            if (fireArr[i * 3 + 1] > 2.8 || fireArr[i * 3 + 2] < -4.5 || Math.random() < 0.08) {
              fireArr[i * 3 + 0] = (Math.random() - 0.5) * 1.3;
              fireArr[i * 3 + 1] = 0.35 + Math.random() * 0.3;
              fireArr[i * 3 + 2] = (Math.random() - 0.5) * 1.8;
            }
          }
          crashFireRef.current.geometry.attributes.position.needsUpdate = true;
        }

        // Animate smoke
        const smokeArr = (crashSmokeRef.current.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
        for (let i = 0; i < crashSmokeCount; i++) {
          smokeArr[i * 3 + 0] += crashSmokeVel[i * 3 + 0] * delta;
          smokeArr[i * 3 + 1] += crashSmokeVel[i * 3 + 1] * delta;
          smokeArr[i * 3 + 2] += crashSmokeVel[i * 3 + 2] * delta;

          if (smokeArr[i * 3 + 1] > 6.5 || smokeArr[i * 3 + 2] < -9.0 || Math.random() < 0.05) {
            smokeArr[i * 3 + 0] = (Math.random() - 0.5) * 1.4;
            smokeArr[i * 3 + 1] = 0.45 + Math.random() * 0.4;
            smokeArr[i * 3 + 2] = -0.3 + (Math.random() - 0.5) * 1.8;
          }
        }
        crashSmokeRef.current.geometry.attributes.position.needsUpdate = true;

        // Animate sparks
        if (isCrashing || !isAirborne) {
          const sparksArr = (crashSparksRef.current.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
          for (let i = 0; i < crashSparksCount; i++) {
            sparksArr[i * 3 + 0] += crashSparksVel[i * 3 + 0] * delta;
            sparksArr[i * 3 + 1] += crashSparksVel[i * 3 + 1] * delta;
            sparksArr[i * 3 + 2] += crashSparksVel[i * 3 + 2] * delta;

            if (sparksArr[i * 3 + 1] < -0.2 || sparksArr[i * 3 + 2] < -5.5 || Math.random() < 0.12) {
              sparksArr[i * 3 + 0] = (Math.random() - 0.5) * 1.6;
              sparksArr[i * 3 + 1] = 0.05 + Math.random() * 0.15;
              sparksArr[i * 3 + 2] = (Math.random() - 0.5) * 1.8;
            }
          }
          crashSparksRef.current.geometry.attributes.position.needsUpdate = true;
        }

        if (fireLightRef.current) {
          fireLightRef.current.intensity = isBurning ? 8.5 + Math.sin(clock.getElapsedTime() * 38) * 4.0 : 0;
        }
      } else {
        if (fireLightRef.current) fireLightRef.current.intensity = 0.0;
      }
    }

    // Dynamic Visual Crash Damage on Body Paint
    if (bodyPaintMaterial) {
      if (damageLevel >= 3) {
        bodyPaintMaterial.color.set('#1c1917'); // Charred blackened wreck
        bodyPaintMaterial.roughness = 0.95;
        bodyPaintMaterial.metalness = 0.1;
      } else if (damageLevel >= 2) {
        bodyPaintMaterial.color.set('#78716c'); // Scorched, scratched carbon
        bodyPaintMaterial.roughness = 0.65;
        bodyPaintMaterial.metalness = 0.4;
      } else if (damageLevel >= 1) {
        bodyPaintMaterial.color.set('#d6d3d1'); // Scratched paint
        bodyPaintMaterial.roughness = 0.4;
      } else {
        bodyPaintMaterial.color.set('#f8fafc'); // Pristine white
        bodyPaintMaterial.roughness = 0.16;
        bodyPaintMaterial.metalness = 0.8;
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

      {/* ELON EASTER EGG: 17" OLED Center Screen with "DON'T PANIC!" */}
      <mesh position={[0, 0.58, 0.36]} rotation={[-0.28, 0, 0]}>
        <planeGeometry args={[0.38, 0.22]} />
        <primitive object={dontPanicMaterial} attach="material" />
      </mesh>

      {/* ELON EASTER EGG: Co-pilot "Starman" Spacesuit Helmet in Passenger Seat */}
      <group position={[0.34, 0.58, -0.05]}>
        {/* White Spacesuit Helmet */}
        <mesh castShadow>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#ffffff" metalness={0.95} roughness={0.08} />
        </mesh>
        {/* Glossy Obsidian Visor */}
        <mesh position={[0, 0.02, 0.06]}>
          <sphereGeometry args={[0.085, 16, 16]} />
          <meshStandardMaterial color="#05070c" metalness={0.98} roughness={0.02} />
        </mesh>
      </group>

      {/* ELON EASTER EGG: Undercarriage Plaque "MADE ON EARTH BY HUMANS" */}
      <mesh position={[0, 0.145, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.9, 0.35]} />
        <primitive object={madeOnEarthMaterial} attach="material" />
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

      {/* ----------------- ACTIVE ELEVATED REAR WING (OCT 15 SPEC) ----------------- */}
      <mesh position={[-0.65, 0.72, -1.82]} material={carbonMaterial} castShadow>
        <boxGeometry args={[0.06, 0.32, 0.18]} />
      </mesh>
      <mesh position={[0.65, 0.72, -1.82]} material={carbonMaterial} castShadow>
        <boxGeometry args={[0.06, 0.32, 0.18]} />
      </mesh>

      <mesh position={[0, 0.88, -1.85]} rotation={[0.08, 0, 0]} material={carbonMaterial} castShadow>
        <boxGeometry args={[1.96, 0.04, 0.42]} />
      </mesh>

      <mesh position={[-0.98, 0.88, -1.85]} material={carbonMaterial} castShadow>
        <boxGeometry args={[0.04, 0.22, 0.44]} />
      </mesh>
      <mesh position={[0.98, 0.88, -1.85]} material={carbonMaterial} castShadow>
        <boxGeometry args={[0.04, 0.22, 0.44]} />
      </mesh>

      {/* ----------------- 4 HORIZONTAL SPACEX REAR THRUSTERS ----------------- */}
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

      {/* Rear Supersonic Mach Shock Cones */}
      <group ref={rearConesGroupRef} visible={false}>
        {[-0.45, -0.15, 0.15, 0.45].map((xOff, idx) => (
          <group key={`rear-flame-${idx}`} position={[xOff, 0.32, -2.2]}>
            {/* Supersonic Shock Diamond Core */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} material={flameCoreMaterial}>
              <coneGeometry args={[0.11, 0.95, 16]} />
            </mesh>
            <mesh position={[0, 0, -0.32]} material={shockDiamondMaterial}>
              <octahedronGeometry args={[0.06]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Rear Thruster Plume Particles */}
      <points ref={rearPlumeRef} geometry={rearPlumeGeo} visible={false}>
        <pointsMaterial
          size={0.48}
          map={particleTexture}
          color="#e0f2fe"
          transparent
          opacity={0.88}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Rear Point Light */}
      <pointLight ref={thrusterGlowRef} position={[0, 0.32, -2.4]} color="#7dd3fc" intensity={0} distance={12} />

      {/* ----------------- 2 UNDERBODY DOWNWARD THRUSTERS (STANDING FLIPS & JUMPS) ----------------- */}
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

      {/* Underbody Supersonic Downward Shock Cones */}
      <group ref={downConesGroupRef} visible={false}>
        {[-0.72, 0.72].map((xOff, idx) => (
          <group key={`down-cone-${idx}`} position={[xOff, 0.08, -1.5]}>
            <mesh rotation={[Math.PI, 0, 0]} material={flameCoreMaterial}>
              <coneGeometry args={[0.13, 0.75, 16]} />
            </mesh>
            <mesh position={[0, -0.22, 0]} material={shockDiamondMaterial}>
              <octahedronGeometry args={[0.065]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Expanding Ground Impact Shockwave Ring (blasts asphalt during launch & hover!) */}
      <mesh
        ref={groundRingMeshRef}
        position={[0, -0.38, -1.5]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={groundRingMaterial}
        visible={false}
      >
        <ringGeometry args={[0.55, 0.85, 32]} />
      </mesh>

      {/* Underbody Downward Plumes shooting straight into the ground */}
      <points ref={downPlumeLeftRef} geometry={leftDownData.geo} visible={false}>
        <pointsMaterial
          size={0.52}
          map={particleTexture}
          color="#bae6fd"
          transparent
          opacity={0.92}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      <points ref={downPlumeRightRef} geometry={rightDownData.geo} visible={false}>
        <pointsMaterial
          size={0.52}
          map={particleTexture}
          color="#bae6fd"
          transparent
          opacity={0.92}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Corner RCS Attitude Puffs */}
      <points ref={rcsPuffRef} geometry={rcsPos} visible={false}>
        <pointsMaterial
          size={0.36}
          map={particleTexture}
          color="#ffffff"
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Ground blast illumination point light */}
      <pointLight ref={groundGlowRef} position={[0, -0.1, -1.5]} color="#38bdf8" intensity={0} distance={14} />

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

      {/* ----------------- TRACKING CRASH FIRE, SMOKE & SPARKS ----------------- */}
      <points ref={crashFireRef} geometry={crashFirePos} visible={false}>
        <pointsMaterial
          size={1.5}
          map={fireTexture}
          color="#ff5722"
          transparent
          opacity={0.92}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      <points ref={crashSmokeRef} geometry={crashSmokePos} visible={false}>
        <pointsMaterial
          size={2.5}
          map={smokeTexture}
          color="#18181b"
          transparent
          opacity={0.65}
          depthWrite={false}
        />
      </points>

      <points ref={crashSparksRef} geometry={crashSparksPos} visible={false}>
        <pointsMaterial
          size={0.45}
          map={particleTexture}
          color="#fde047"
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Illuminating Fire Light that tracks the car */}
      <pointLight ref={fireLightRef} position={[0, 0.8, 0]} color="#f97316" intensity={0} distance={18} />
    </group>
  );
};
