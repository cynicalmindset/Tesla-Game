import * as THREE from 'three';
import type { InputState, StuntEvent, TelemetryData, StabilityStatus, Mission, TrafficVehicle } from '../types';
import { soundManager } from '../audio/SoundManager';

export const INITIAL_MISSIONS: Mission[] = [
  {
    id: 'm1',
    title: 'SPEED TRIAL',
    description: 'Reach 250 km/h',
    target: 250,
    current: 0,
    completed: false,
    rewardPoints: 2000,
    type: 'SPEED',
  },
  {
    id: 'm2',
    title: 'THRUSTER FLIGHT',
    description: 'Reach 12m altitude',
    target: 12,
    current: 0,
    completed: false,
    rewardPoints: 2500,
    type: 'ALTITUDE',
  },
  {
    id: 'm3',
    title: 'TRAFFIC LEAP',
    description: 'Rocket jump over 2 cars',
    target: 2,
    current: 0,
    completed: false,
    rewardPoints: 3000,
    type: 'TRAFFIC_LEAP',
  },
  {
    id: 'm4',
    title: 'AERIAL ACROBAT',
    description: 'Land 2 aerial flips or rolls',
    target: 2,
    current: 0,
    completed: false,
    rewardPoints: 3500,
    type: 'STUNTS',
  },
  {
    id: 'm5',
    title: 'ENERGY HUNTER',
    description: 'Collect 3 floating rings',
    target: 3,
    current: 0,
    completed: false,
    rewardPoints: 4000,
    type: 'RINGS',
  },
  {
    id: 'm6',
    title: 'HYPER DISTANCE',
    description: 'Drive 3,000 meters',
    target: 3000,
    current: 0,
    completed: false,
    rewardPoints: 5000,
    type: 'DISTANCE',
  },
];

export interface CarState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  quaternion: THREE.Quaternion;
  angularVelocity: THREE.Vector3;
  steeringAngle: number;
  wheelsRotation: number;
  isAirborne: boolean;
  airtime: number;
  totalAirtime: number;
  thrusterGas: number;       // 0 to 100%
  boostEnergy: number;       // 0 to 100%
  health: number;            // 0 to 100%
  distance: number;
  score: number;
  combo: number;
  maxSpeed: number;
  landingCount: number;
  cleanLandingCount: number;
  ringsCollected: number;
  stuntsCompletedCount: number;
  trafficLeaped: number;
  nearMisses: number;
  currentMissionIndex: number;
  missions: Mission[];
  stuntHistory: StuntEvent[];
  recentStunt: StuntEvent | null;
  crashState: {
    isCrashing: boolean;
    timer: number;
  };
}

export interface TrackRamp {
  zStart: number;
  zEnd: number;
  height: number;
  xMin: number;
  xMax: number;
}

export interface TrackRing {
  id: string;
  position: THREE.Vector3;
  radius: number;
  collected: boolean;
}

export interface TrackGap {
  zStart: number;
  zEnd: number;
}

export class PhysicsEngine {
  public state: CarState;
  
  // Stunt accumulation variables (degrees)
  private accumulatedPitch: number = 0;
  private accumulatedRoll: number = 0;
  private accumulatedYaw: number = 0;

  // Track layout & features
  public ramps: TrackRamp[] = [];
  public rings: TrackRing[] = [];
  public gaps: TrackGap[] = [];
  public traffic: TrafficVehicle[] = [];

  // Track width bounds
  public readonly TRACK_HALF_WIDTH = 12.5;

  // Constants
  private readonly GRAVITY = 18.5; // m/s^2
  private readonly MAX_STEER = 0.58; // radians (~33 deg)
  private readonly BASE_TOP_SPEED = 122.2; // 440 km/h in m/s
  private readonly BOOST_TOP_SPEED = 144.4; // 520 km/h in m/s
  private readonly ACCELERATION = 26.0; // m/s^2 (0-100 km/h in 1.1s)
  private readonly BRAKE_FORCE = 32.0;

  constructor() {
    this.state = this.getInitialState();
    this.initTrackFeatures();
    this.initTraffic();
  }

  public getInitialState(): CarState {
    return {
      position: new THREE.Vector3(0, 0.45, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      quaternion: new THREE.Quaternion(),
      angularVelocity: new THREE.Vector3(0, 0, 0),
      steeringAngle: 0,
      wheelsRotation: 0,
      isAirborne: false,
      airtime: 0,
      totalAirtime: 0,
      thrusterGas: 100,
      boostEnergy: 100,
      health: 100,
      distance: 0,
      score: 0,
      combo: 1,
      maxSpeed: 0,
      landingCount: 0,
      cleanLandingCount: 0,
      ringsCollected: 0,
      stuntsCompletedCount: 0,
      trafficLeaped: 0,
      nearMisses: 0,
      currentMissionIndex: 0,
      missions: JSON.parse(JSON.stringify(INITIAL_MISSIONS)),
      stuntHistory: [],
      recentStunt: null,
      crashState: {
        isCrashing: false,
        timer: 0,
      },
    };
  }

  public reset() {
    this.state = this.getInitialState();
    this.accumulatedPitch = 0;
    this.accumulatedRoll = 0;
    this.accumulatedYaw = 0;
    this.initTrackFeatures();
    this.initTraffic();
  }

  private initTrackFeatures() {
    this.ramps = [];
    this.rings = [];
    this.gaps = [];

    // Procedural placement along 15,000 meters of track
    for (let z = 250; z < 15000; z += 350 + (z % 3) * 80) {
      const type = (z / 300) % 4;

      if (type < 1.5) {
        // High-speed Launch Ramp
        const rampLength = 30;
        const rampHeight = 4.5 + Math.min(z * 0.0005, 3.5);
        this.ramps.push({
          zStart: z,
          zEnd: z + rampLength,
          height: rampHeight,
          xMin: -6,
          xMax: 6,
        });

        // Floating rings after the ramp in flight trajectory
        for (let r = 1; r <= 3; r++) {
          this.rings.push({
            id: `ring-${z}-${r}`,
            position: new THREE.Vector3(
              (r - 2) * 2.5,
              rampHeight + r * 3.5,
              z + rampLength + r * 28
            ),
            radius: 4.0,
            collected: false,
          });
        }
      } else if (type < 2.5) {
        // High-Voltage Track Gap
        const gapLength = 40 + Math.min(z * 0.002, 35);
        this.gaps.push({
          zStart: z,
          zEnd: z + gapLength,
        });

        this.rings.push({
          id: `gap-ring-${z}`,
          position: new THREE.Vector3(0, 7.5, z + gapLength * 0.5),
          radius: 4.8,
          collected: false,
        });
      } else {
        // Speed ring cluster
        this.rings.push({
          id: `speed-ring-${z}`,
          position: new THREE.Vector3(
            Math.sin(z) * 5,
            4.0 + (z % 5),
            z + 50
          ),
          radius: 3.8,
          collected: false,
        });
      }
    }
  }

  // Initialize autonomous traffic vehicles
  public initTraffic() {
    this.traffic = [];
    const lanes = [-7.5, -2.5, 2.5, 7.5];
    const colors = ['#888899', '#ff3344', '#0077ff', '#ffffff', '#222222', '#ffaa00'];
    const types: ('CYBERTRUCK' | 'SEDAN' | 'SEMI')[] = ['CYBERTRUCK', 'SEDAN', 'SEDAN', 'SEMI'];

    // Place traffic cars starting from 80m ahead, spaced out naturally
    for (let z = 90; z < 15000; z += 55 + (z % 4) * 20) {
      const lane = lanes[(z % lanes.length)];
      const modelType = types[(z % types.length)];
      const speed = 18 + ((z % 7) * 1.5); // 65 - 100 km/h

      this.traffic.push({
        id: `traffic-${z}`,
        x: lane + (Math.sin(z) * 0.5),
        z,
        speed,
        lane,
        modelType,
        color: colors[(z % colors.length)],
        passedOver: false,
      });
    }
  }

  // Get current road height at (x, z)
  public getRoadHeight(x: number, z: number): { height: number; isGap: boolean; rampNormal?: THREE.Vector3 } {
    if (Math.abs(x) > this.TRACK_HALF_WIDTH) {
      return { height: -0.2, isGap: false };
    }

    for (const gap of this.gaps) {
      if (z >= gap.zStart && z <= gap.zEnd) {
        return { height: -25.0, isGap: true };
      }
    }

    for (const ramp of this.ramps) {
      if (z >= ramp.zStart && z <= ramp.zEnd && x >= ramp.xMin && x <= ramp.xMax) {
        const progress = (z - ramp.zStart) / (ramp.zEnd - ramp.zStart);
        const h = Math.sin(progress * Math.PI * 0.5) * ramp.height;
        return {
          height: h,
          isGap: false,
          rampNormal: new THREE.Vector3(0, Math.cos(progress * 0.35), -Math.sin(progress * 0.35)).normalize(),
        };
      }
    }

    return { height: 0, isGap: false };
  }

  public update(dt: number, input: InputState): TelemetryData {
    const delta = Math.min(dt, 0.05);

    // Car orientation vectors
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.state.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.state.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.state.quaternion);

    // Road query
    const roadInfo = this.getRoadHeight(this.state.position.x, this.state.position.z);
    const carBaseHeight = 0.42;
    const targetGroundY = roadInfo.height + carBaseHeight;
    const altitude = Math.max(0, this.state.position.y - targetGroundY);

    const wasAirborne = this.state.isAirborne;
    this.state.isAirborne = altitude > 0.35 || roadInfo.isGap;

    const forwardSpeed = this.state.velocity.dot(forward);
    const lateralSpeed = this.state.velocity.dot(right);
    const verticalSpeed = this.state.velocity.y;

    // Handle Boost
    const isBoosting = input.boost && this.state.boostEnergy > 5;
    if (isBoosting) {
      this.state.boostEnergy = Math.max(0, this.state.boostEnergy - 30 * delta);
    } else {
      this.state.boostEnergy = Math.min(100, this.state.boostEnergy + 10 * delta);
    }

    const currentTopSpeed = isBoosting ? this.BOOST_TOP_SPEED : this.BASE_TOP_SPEED;

    // ----------------------------------------------------
    // GROUND DYNAMICS
    // ----------------------------------------------------
    if (!this.state.isAirborne) {
      this.state.airtime = 0;
      this.state.thrusterGas = Math.min(100, this.state.thrusterGas + 18.0 * delta);

      // Steering
      const steerInput = (input.steerLeft ? 1 : 0) - (input.steerRight ? 1 : 0);
      const steerSpeedFactor = Math.max(0.2, 1 - (forwardSpeed / this.BASE_TOP_SPEED) * 0.65);
      const targetSteer = steerInput * this.MAX_STEER * steerSpeedFactor;
      this.state.steeringAngle = THREE.MathUtils.lerp(this.state.steeringAngle, targetSteer, 12 * delta);

      // Yaw rotation on ground
      if (Math.abs(forwardSpeed) > 0.5) {
        const turnRadius = 2.8 / Math.tan(Math.max(0.01, Math.abs(this.state.steeringAngle)));
        const yawRate = (forwardSpeed / turnRadius) * Math.sign(this.state.steeringAngle);
        const deltaQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yawRate * delta);
        this.state.quaternion.multiply(deltaQuat);
      }

      // Acceleration / Braking
      let accelForce = 0;
      if (input.accelerate) {
        const powerRatio = Math.max(0.15, 1 - (forwardSpeed / currentTopSpeed));
        accelForce = this.ACCELERATION * (isBoosting ? 1.55 : 1.0) * powerRatio;
      } else if (input.brake) {
        if (forwardSpeed > 1.0) {
          accelForce = -this.BRAKE_FORCE;
        } else {
          accelForce = -this.ACCELERATION * 0.45;
        }
      } else {
        accelForce = -forwardSpeed * 0.35 - Math.sign(forwardSpeed) * 0.8;
      }

      this.state.velocity.addScaledVector(forward, accelForce * delta);

      const grip = 0.88;
      const lateralFriction = -lateralSpeed * (1 - grip) * 25.0;
      this.state.velocity.addScaledVector(right, lateralFriction * delta);

      this.state.position.y = THREE.MathUtils.lerp(this.state.position.y, targetGroundY, 22 * delta);
      this.state.velocity.y = 0;

      const targetQuat = new THREE.Quaternion();
      const roadNormal = roadInfo.rampNormal || new THREE.Vector3(0, 1, 0);
      const currentForwardProjected = forward.clone().projectOnPlane(roadNormal).normalize();
      const currentRightProjected = new THREE.Vector3().crossVectors(roadNormal, currentForwardProjected).normalize();
      const rotMatrix = new THREE.Matrix4().makeBasis(currentRightProjected, roadNormal, currentForwardProjected);
      targetQuat.setFromRotationMatrix(rotMatrix);

      this.state.quaternion.slerp(targetQuat, 18 * delta);
      this.state.angularVelocity.set(0, 0, 0);
      this.state.wheelsRotation += (forwardSpeed * delta) / 0.35;

      if (Math.abs(this.state.position.x) > this.TRACK_HALF_WIDTH - 0.8) {
        const sign = Math.sign(this.state.position.x);
        this.state.position.x = sign * (this.TRACK_HALF_WIDTH - 0.8);
        this.state.velocity.x *= -0.4;
        soundManager.playLandingImpact(10, false);
      }
    } 
    // ----------------------------------------------------
    // AIRBORNE DYNAMICS (FLIGHT MODE)
    // ----------------------------------------------------
    else {
      this.state.airtime += delta;
      this.state.totalAirtime += delta;
      this.state.thrusterGas = Math.min(100, this.state.thrusterGas + 4.0 * delta);

      this.state.velocity.y -= this.GRAVITY * delta;
      this.state.velocity.x *= (1 - 0.08 * delta);
      this.state.velocity.z *= (1 - 0.02 * delta);

      const torque = new THREE.Vector3();
      const RCS_TORQUE = 4.2;

      let pitchInput = 0;
      if (input.pitchUp) pitchInput += 1;
      if (input.pitchDown) pitchInput -= 1;
      if (pitchInput !== 0) {
        torque.x = pitchInput * RCS_TORQUE;
        soundManager.playRcsBurst();
      }

      let rollInput = 0;
      if (input.rollLeft) rollInput -= 1;
      if (input.rollRight) rollInput += 1;
      if (rollInput !== 0) {
        torque.z = rollInput * RCS_TORQUE * 1.25;
        soundManager.playRcsBurst();
      }

      let yawInput = 0;
      if (input.yawLeft) yawInput += 1;
      if (input.yawRight) yawInput -= 1;
      if (yawInput !== 0) {
        torque.y = yawInput * RCS_TORQUE * 0.9;
        soundManager.playRcsBurst();
      }

      this.state.angularVelocity.x += torque.x * delta;
      this.state.angularVelocity.y += torque.y * delta;
      this.state.angularVelocity.z += torque.z * delta;

      // Instant Stunt Triggers (Oct 15 Cold-Gas Stunts)
      if (input.instantFlip) {
        this.state.angularVelocity.x = 9.2;
        soundManager.playRcsBurst();
      }
      if (input.instantRoll) {
        this.state.angularVelocity.z = 10.2;
        soundManager.playRcsBurst();
      }
      if (input.instantSpin) {
        this.state.angularVelocity.y = 9.2;
        soundManager.playRcsBurst();
      }

      const angularDamp = 0.97;
      this.state.angularVelocity.multiplyScalar(Math.pow(angularDamp, delta * 60));

      const deltaRotation = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          this.state.angularVelocity.x * delta,
          this.state.angularVelocity.y * delta,
          this.state.angularVelocity.z * delta,
          'XYZ'
        )
      );
      this.state.quaternion.multiply(deltaRotation);

      const pitchDeltaDeg = THREE.MathUtils.radToDeg(this.state.angularVelocity.x * delta);
      const rollDeltaDeg = THREE.MathUtils.radToDeg(this.state.angularVelocity.z * delta);
      const yawDeltaDeg = THREE.MathUtils.radToDeg(this.state.angularVelocity.y * delta);

      this.accumulatedPitch += pitchDeltaDeg;
      this.accumulatedRoll += rollDeltaDeg;
      this.accumulatedYaw += yawDeltaDeg;

      this.checkStunts();

      // Underbody Ground-Cushion Reverse Thruster
      // As the car descends near the roadbed, underbody thrusters fire reverse-bursts to soften touchdown
      if (this.state.velocity.y < -2.0 && altitude < 1.6) {
        this.state.velocity.y *= 0.88;
        const currentYaw = new THREE.Euler().setFromQuaternion(this.state.quaternion, 'YXZ').y;
        const levelQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), currentYaw);
        this.state.quaternion.slerp(levelQuat, 6.0 * delta);
      }
    }

    // ----------------------------------------------------
    // ROCKET COLD-GAS THRUSTERS (SPACEBAR / INSTANT STUNT)
    // ----------------------------------------------------
    const isThrusterActive = Boolean(
      (input.thruster || input.instantFlip || input.instantRoll || input.instantSpin) &&
      this.state.thrusterGas > 5
    );
    if (isThrusterActive) {
      this.state.thrusterGas = Math.max(0, this.state.thrusterGas - 22.0 * delta);

      const liftForce = this.GRAVITY * 1.65;
      const forwardThrust = this.ACCELERATION * (forwardSpeed < 5 ? 0.35 : 0.95);

      this.state.velocity.y += liftForce * delta;
      this.state.velocity.addScaledVector(forward, forwardThrust * delta);

      // Standing Jump / Launch from Road
      if (!wasAirborne && this.state.position.y <= targetGroundY + 0.15) {
        // Underbody downward thrusters blast the asphalt (Oct 15 Reveal stunt)
        this.state.velocity.y = forwardSpeed < 5 ? 16.5 : 15.0;
        this.state.isAirborne = true;

        if (input.instantFlip || input.pitchUp) {
          this.state.angularVelocity.x = 9.2;
        } else if (input.instantRoll) {
          this.state.angularVelocity.z = 10.2;
        } else if (input.instantSpin) {
          this.state.angularVelocity.y = 9.2;
        }

        soundManager.playLandingImpact(18, true);
      }
    }

    // ----------------------------------------------------
    // LANDING DETECTION & EVALUATION
    // ----------------------------------------------------
    if (wasAirborne && !this.state.isAirborne && !roadInfo.isGap) {
      this.handleLanding(verticalSpeed, up, forward);
    }

    // Update car position
    this.state.position.addScaledVector(this.state.velocity, delta);

    if (this.state.position.y < targetGroundY && !roadInfo.isGap) {
      this.state.position.y = targetGroundY;
      this.state.velocity.y = Math.max(0, this.state.velocity.y);
    }

    if (roadInfo.isGap && this.state.position.y < -15.0) {
      this.triggerCrash(true);
    }

    this.state.distance = Math.max(this.state.distance, this.state.position.z);

    // Update autonomous traffic cars and check collisions / flyovers
    this.updateTraffic(delta);

    // Collect floating rings
    this.checkRingCollisions();

    // Telemetry stats
    const speedMs = this.state.velocity.length();
    const speedKmh = Math.round(speedMs * 3.6);
    this.state.maxSpeed = Math.max(this.state.maxSpeed, speedKmh);

    // Update active mission progress
    this.updateMissions(speedKmh, altitude);

    const euler = new THREE.Euler().setFromQuaternion(this.state.quaternion, 'YXZ');
    const pitchDeg = Math.round(THREE.MathUtils.radToDeg(euler.x));
    const rollDeg = Math.round(THREE.MathUtils.radToDeg(euler.z));
    const yawDeg = Math.round(THREE.MathUtils.radToDeg(euler.y));

    const upDot = up.dot(new THREE.Vector3(0, 1, 0));
    let landingStability: StabilityStatus = 'OPTIMAL';
    if (upDot < 0.65 || Math.abs(pitchDeg) > 35 || Math.abs(rollDeg) > 35) {
      landingStability = 'CRITICAL';
    } else if (upDot < 0.88 || Math.abs(pitchDeg) > 18 || Math.abs(rollDeg) > 18) {
      landingStability = 'CAUTION';
    }

    soundManager.updateTelemetrySounds(
      speedKmh,
      isThrusterActive,
      this.state.isAirborne,
      Math.abs(lateralSpeed) > 6.0,
      isBoosting
    );

    if (forwardSpeed > 10) {
      this.state.score += Math.round((forwardSpeed * 0.15) * (this.state.isAirborne ? 1.5 : 1.0) * this.state.combo);
    }

    return {
      speed: speedMs,
      kmh: speedKmh,
      altitude: Math.round(altitude * 10) / 10,
      airtime: Math.round(this.state.airtime * 10) / 10,
      totalAirtime: Math.round(this.state.totalAirtime * 10) / 10,
      thrusterGas: Math.round(this.state.thrusterGas),
      boostEnergy: Math.round(this.state.boostEnergy),
      pitch: pitchDeg,
      roll: rollDeg,
      yaw: yawDeg,
      landingStability,
      isAirborne: this.state.isAirborne,
      distance: Math.round(this.state.distance),
      score: this.state.score,
      combo: this.state.combo,
      maxSpeed: this.state.maxSpeed,
      stuntHistory: this.state.stuntHistory,
      recentStunt: this.state.recentStunt,
      landingCount: this.state.landingCount,
      cleanLandingCount: this.state.cleanLandingCount,
      ringsCollected: this.state.ringsCollected,
      flightModeActive: this.state.isAirborne,
      health: Math.round(this.state.health),
      trafficLeaped: this.state.trafficLeaped,
      nearMisses: this.state.nearMisses,
      currentMissionIndex: this.state.currentMissionIndex,
      missions: this.state.missions,
    };
  }

  // Update AI Traffic positions & evaluate interactions
  private updateTraffic(delta: number) {
    const playerPos = this.state.position;

    for (const car of this.traffic) {
      car.z += car.speed * delta;

      // Check distance to player
      const dx = Math.abs(playerPos.x - car.x);
      const dz = Math.abs(playerPos.z - car.z);

      // 1. Rocket Jump / Flyover Check:
      // Player is airborne, directly above car, and has not yet scored for this car
      if (
        this.state.isAirborne &&
        playerPos.y > 2.0 &&
        dx < 2.5 &&
        dz < 3.2 &&
        !car.passedOver
      ) {
        car.passedOver = true;
        this.state.trafficLeaped += 1;
        this.awardStunt('TRAFFIC LEAP +500', 500);
        soundManager.playRingPickup();
      }

      // 2. Near Miss Check:
      // Player passes close horizontally on the road at high speed without hitting
      if (
        !this.state.isAirborne &&
        dx > 1.8 &&
        dx < 3.4 &&
        dz < 2.0 &&
        this.state.velocity.z > car.speed + 15
      ) {
        if (!car.passedOver) {
          car.passedOver = true;
          this.state.nearMisses += 1;
          this.awardStunt('NEAR MISS +300', 300);
        }
      }

      // 3. Ground Collision with Traffic:
      if (!this.state.isAirborne && dx < 1.7 && dz < 3.0) {
        // Impact
        this.state.velocity.z = Math.min(this.state.velocity.z, car.speed * 0.4);
        this.state.velocity.x += (playerPos.x - car.x) * 4.0;
        this.state.health = Math.max(0, this.state.health - 20);
        this.state.combo = 1;
        soundManager.playLandingImpact(20, false);
      }
    }
  }

  // Update Mission Progression
  private updateMissions(speedKmh: number, altitude: number) {
    const currentMission = this.state.missions[this.state.currentMissionIndex];
    if (!currentMission || currentMission.completed) return;

    let progressUpdated = false;

    switch (currentMission.type) {
      case 'SPEED':
        currentMission.current = Math.min(currentMission.target, speedKmh);
        if (speedKmh >= currentMission.target) {
          currentMission.completed = true;
          progressUpdated = true;
        }
        break;

      case 'ALTITUDE':
        currentMission.current = Math.min(currentMission.target, Math.round(altitude));
        if (altitude >= currentMission.target) {
          currentMission.completed = true;
          progressUpdated = true;
        }
        break;

      case 'TRAFFIC_LEAP':
        currentMission.current = Math.min(currentMission.target, this.state.trafficLeaped);
        if (this.state.trafficLeaped >= currentMission.target) {
          currentMission.completed = true;
          progressUpdated = true;
        }
        break;

      case 'STUNTS':
        currentMission.current = Math.min(currentMission.target, this.state.stuntsCompletedCount);
        if (this.state.stuntsCompletedCount >= currentMission.target) {
          currentMission.completed = true;
          progressUpdated = true;
        }
        break;

      case 'RINGS':
        currentMission.current = Math.min(currentMission.target, this.state.ringsCollected);
        if (this.state.ringsCollected >= currentMission.target) {
          currentMission.completed = true;
          progressUpdated = true;
        }
        break;

      case 'DISTANCE':
        currentMission.current = Math.min(currentMission.target, Math.round(this.state.distance));
        if (this.state.distance >= currentMission.target) {
          currentMission.completed = true;
          progressUpdated = true;
        }
        break;
    }

    if (progressUpdated) {
      // Award mission completion!
      this.state.score += currentMission.rewardPoints;
      this.awardStunt(`MISSION COMPLETE: ${currentMission.title}!`, currentMission.rewardPoints);
      soundManager.playRingPickup();

      if (this.state.currentMissionIndex < this.state.missions.length - 1) {
        this.state.currentMissionIndex += 1;
      }
    }
  }

  private checkStunts() {
    if (this.accumulatedPitch >= 300) {
      this.state.stuntsCompletedCount += 1;
      this.awardStunt('BACKFLIP', 1200);
      this.accumulatedPitch -= 360;
    } else if (this.accumulatedPitch <= -300) {
      this.state.stuntsCompletedCount += 1;
      this.awardStunt('FRONTFLIP', 1200);
      this.accumulatedPitch += 360;
    }

    if (this.accumulatedRoll >= 300) {
      this.state.stuntsCompletedCount += 1;
      this.awardStunt('BARREL ROLL RIGHT', 1000);
      this.accumulatedRoll -= 360;
    } else if (this.accumulatedRoll <= -300) {
      this.state.stuntsCompletedCount += 1;
      this.awardStunt('BARREL ROLL LEFT', 1000);
      this.accumulatedRoll += 360;
    }

    if (Math.abs(this.accumulatedYaw) >= 300) {
      this.state.stuntsCompletedCount += 1;
      this.awardStunt('FLAT SPIN 360°', 900);
      this.accumulatedYaw = 0;
    }
  }

  private awardStunt(name: string, basePoints: number) {
    const points = basePoints * this.state.combo;
    this.state.score += points;
    this.state.combo = Math.min(10, this.state.combo + 1);

    const stuntEvent: StuntEvent = {
      id: Math.random().toString(36).substring(7),
      name,
      points,
      multiplier: this.state.combo,
      timestamp: Date.now(),
    };

    this.state.recentStunt = stuntEvent;
    this.state.stuntHistory.unshift(stuntEvent);
    if (this.state.stuntHistory.length > 8) {
      this.state.stuntHistory.pop();
    }

    soundManager.playStuntChime(this.state.combo);
  }

  private handleLanding(verticalVelocity: number, up: THREE.Vector3, forward: THREE.Vector3) {
    this.state.landingCount += 1;
    const upDot = up.dot(new THREE.Vector3(0, 1, 0));
    const forwardHoriz = new THREE.Vector3(forward.x, 0, forward.z).normalize();
    const headingAlignment = forward.dot(forwardHoriz);

    this.accumulatedPitch = 0;
    this.accumulatedRoll = 0;
    this.accumulatedYaw = 0;

    if (upDot > 0.92 && headingAlignment > 0.85) {
      this.state.cleanLandingCount += 1;
      this.awardStunt('PERFECT TOUCHDOWN!', 1500);
      this.state.boostEnergy = Math.min(100, this.state.boostEnergy + 25);
      soundManager.playLandingImpact(verticalVelocity, true);
    } else if (upDot > 0.75) {
      this.state.cleanLandingCount += 1;
      this.awardStunt('CLEAN LANDING', 600);
      soundManager.playLandingImpact(verticalVelocity, true);
    } else if (upDot > 0.45) {
      this.state.combo = 1;
      this.state.velocity.multiplyScalar(0.7);
      soundManager.playLandingImpact(verticalVelocity, false);
    } else {
      this.triggerCrash(false);
    }
  }

  private triggerCrash(fatal: boolean) {
    this.state.combo = 1;
    this.state.velocity.multiplyScalar(0.35);
    this.state.health = Math.max(0, this.state.health - (fatal ? 100 : 35));
    soundManager.playCrash();

    if (fatal || this.state.health <= 0) {
      this.state.crashState.isCrashing = true;
      this.state.crashState.timer = 2.0;
    } else {
      const currentYaw = new THREE.Euler().setFromQuaternion(this.state.quaternion, 'YXZ').y;
      this.state.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), currentYaw);
      this.state.position.y = 0.5;
    }
  }

  private checkRingCollisions() {
    for (const ring of this.rings) {
      if (ring.collected) continue;

      const dist = this.state.position.distanceTo(ring.position);
      if (dist < ring.radius + 1.2) {
        ring.collected = true;
        this.state.ringsCollected += 1;
        this.state.boostEnergy = Math.min(100, this.state.boostEnergy + 30);
        this.state.thrusterGas = Math.min(100, this.state.thrusterGas + 25);
        this.awardStunt('ENERGY RING +500', 500);
        soundManager.playRingPickup();
      }
    }
  }
}
