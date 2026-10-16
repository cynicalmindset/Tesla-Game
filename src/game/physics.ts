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
    title: 'OCTOBER 15 REVEAL',
    description: 'Execute standing vertical 360 flip',
    target: 1,
    current: 0,
    completed: false,
    rewardPoints: 3500,
    type: 'STANDING_FLIP',
  },
  {
    id: 'm4',
    title: 'TRAFFIC LEAP',
    description: 'Rocket jump over 2 cars',
    target: 2,
    current: 0,
    completed: false,
    rewardPoints: 3000,
    type: 'TRAFFIC_LEAP',
  },
  {
    id: 'm5',
    title: 'AERIAL ACROBAT',
    description: 'Land 2 aerial flips or rolls',
    target: 2,
    current: 0,
    completed: false,
    rewardPoints: 3500,
    type: 'STUNTS',
  },
  {
    id: 'm6',
    title: 'ENERGY HUNTER',
    description: 'Collect 3 floating rings',
    target: 3,
    current: 0,
    completed: false,
    rewardPoints: 4000,
    type: 'RINGS',
  },
  {
    id: 'm7',
    title: 'HIGHWAY NEAR-MISS',
    description: 'Slip past 3 cars at high speed',
    target: 3,
    current: 0,
    completed: false,
    rewardPoints: 3500,
    type: 'NEAR_MISS',
  },
  {
    id: 'm8',
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
  standingFlips: number;
  currentMissionIndex: number;
  missions: Mission[];
  stuntHistory: StuntEvent[];
  recentStunt: StuntEvent | null;
  crashState: {
    isCrashing: boolean;
    timer: number;
  };
  damageLevel: number;       // 0: none, 1: scratches, 2: smoke/sparks, 3: heavy fire
  isFireActive: boolean;
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

export interface ActiveStunt {
  type: 'FLIP' | 'ROLL' | 'SPIN';
  axis: 'X' | 'Y' | 'Z';
  startQuat: THREE.Quaternion;
  duration: number;
  elapsed: number;
  isStanding: boolean;
  timeout: number;
}

export class PhysicsEngine {
  public state: CarState;
  
  // Stunt accumulation variables (degrees)
  private accumulatedPitch: number = 0;
  private accumulatedRoll: number = 0;
  private accumulatedYaw: number = 0;
  private jumpStartedFromStand: boolean = false;
  public activeStunt: ActiveStunt | null = null;

  // Track layout & features
  public ramps: TrackRamp[] = [];
  public rings: TrackRing[] = [];
  public gaps: TrackGap[] = [];
  public traffic: TrafficVehicle[] = [];

  // Track width bounds
  public readonly TRACK_HALF_WIDTH = 12.5;

  // Elon Musk Easter Eggs State
  public isMarsMode: boolean = false;
  private hit420EasterEgg: boolean = false;

  // Heavy Vehicle Suspension & Aerodynamic Inertia State (~2,000kg Roadster)
  private suspensionCompression: number = 0; // vertical compression offset (meters)
  private suspensionVelocity: number = 0;    // vertical suspension rate (m/s)
  private previousGroundY: number = 0.46;    // previous ground height to transfer ramp vertical momentum

  // Constants (Calibrated for ~2,000kg Heavy Electric Roadster + SpaceX Package)
  private readonly GRAVITY = 25.5; // m/s^2 (Realistic heavy-vehicle downward acceleration)
  private readonly MARS_GRAVITY = 3.72; // m/s^2 (Exact Mars surface gravity: 3.72 m/s²)
  private readonly MAX_STEER = 0.58; // radians (~33 deg)
  private readonly BASE_TOP_SPEED = 122.2; // 440 km/h in m/s
  private readonly BOOST_TOP_SPEED = 144.4; // 520 km/h in m/s
  private readonly ACCELERATION = 26.0; // m/s^2 (0-100 km/h in 1.1s)
  private readonly BRAKE_FORCE = 62.0; // Responsive high-performance braking

  public toggleMarsMode(): boolean {
    this.isMarsMode = !this.isMarsMode;
    if (this.isMarsMode) {
      this.awardStunt('OCCUPY MARS ACTIVATED (3.72 m/s²)', 4200);
      soundManager.playStuntChime(3);
    } else {
      this.awardStunt('EARTH STARBASE RETURN', 1000);
      soundManager.playRingPickup();
    }
    return this.isMarsMode;
  }

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
      standingFlips: 0,
      currentMissionIndex: 0,
      missions: JSON.parse(JSON.stringify(INITIAL_MISSIONS)),
      stuntHistory: [],
      recentStunt: null,
      crashState: {
        isCrashing: false,
        timer: 0,
      },
      damageLevel: 0,
      isFireActive: false,
    };
  }

  public triggerStunt(type: 'FLIP' | 'ROLL' | 'SPIN') {
    if (this.activeStunt) return;

    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.state.quaternion);
    const forwardSpeed = this.state.velocity.dot(forward);
    const roadInfo = this.getRoadHeight(this.state.position.x, this.state.position.z);
    const targetGroundY = roadInfo.height + 0.46;
    const currentAltitude = Math.max(0, this.state.position.y - targetGroundY);
    const isStanding = forwardSpeed < 8.0;

    // Guaranteed authentic vertical launch impulse from underbody cold-gas thrusters:
    // Launches car into a parabolic ballistic trajectory with ample clearance for full 360 rotation
    if (currentAltitude < 3.2 || this.state.velocity.y < 8.0) {
      const launchLift = isStanding
        ? (this.isMarsMode ? 14.5 : 17.5)
        : Math.max(this.state.velocity.y + 12.0, this.isMarsMode ? 13.0 : 16.0);
      this.state.velocity.y = launchLift;
      this.state.position.y = Math.max(this.state.position.y, targetGroundY + 0.25);
    }

    this.state.isAirborne = true;
    this.jumpStartedFromStand = isStanding;
    this.state.thrusterGas = Math.max(0, this.state.thrusterGas - 15);
    soundManager.playRcsBurst();

    let axis: 'X' | 'Y' | 'Z' = 'X';
    if (type === 'FLIP') {
      axis = 'X';
    } else if (type === 'ROLL') {
      axis = 'Z';
    } else if (type === 'SPIN') {
      axis = 'Y';
    }

    const duration = isStanding ? 0.72 : 0.62;

    this.activeStunt = {
      type,
      axis,
      startQuat: this.state.quaternion.clone(),
      duration,
      elapsed: 0,
      isStanding,
      timeout: 1.5,
    };
  }

  public reset() {
    this.state = this.getInitialState();
    this.accumulatedPitch = 0;
    this.accumulatedRoll = 0;
    this.accumulatedYaw = 0;
    this.jumpStartedFromStand = false;
    this.hit420EasterEgg = false;
    this.activeStunt = null;
    this.suspensionCompression = 0;
    this.suspensionVelocity = 0;
    this.previousGroundY = 0.46;
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
    if (input.toggleMars) {
      this.toggleMarsMode();
      input.toggleMars = false;
    }

    const delta = Math.min(Math.max(dt, 0.001), 0.035);

    // Strict safety guards against NaN or Infinity (Zero-crash guarantee)
    if (
      !Number.isFinite(this.state.position.x) ||
      !Number.isFinite(this.state.position.y) ||
      !Number.isFinite(this.state.position.z)
    ) {
      this.state.position.set(0, 0.45, Math.max(0, this.state.distance));
      this.state.velocity.set(0, 0, 0);
      this.state.quaternion.identity();
      this.state.angularVelocity.set(0, 0, 0);
    }
    if (
      !Number.isFinite(this.state.velocity.x) ||
      !Number.isFinite(this.state.velocity.y) ||
      !Number.isFinite(this.state.velocity.z)
    ) {
      this.state.velocity.set(0, 0, 0);
    }

    const currentGravity = this.isMarsMode ? this.MARS_GRAVITY : this.GRAVITY;

    // Car orientation vectors
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.state.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.state.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.state.quaternion);

    // Road query
    const roadInfo = this.getRoadHeight(this.state.position.x, this.state.position.z);
    const carBaseHeight = 0.46;
    const targetGroundY = roadInfo.height + carBaseHeight;
    const altitude = Math.max(0, this.state.position.y - targetGroundY);

    // Handle Instant Stunt Triggers (<kbd>F</kbd> for 360 Flip, <kbd>X</kbd> for Roll, <kbd>C</kbd> for Spin)
    if (!this.activeStunt) {
      if (input.instantFlip) {
        this.triggerStunt('FLIP');
      } else if (input.instantRoll) {
        this.triggerStunt('ROLL');
      } else if (input.instantSpin) {
        this.triggerStunt('SPIN');
      }
    }

    const wasAirborne = this.state.isAirborne;
    this.state.isAirborne = (this.activeStunt !== null) || altitude > 0.25 || roadInfo.isGap;

    const forwardSpeed = this.state.velocity.dot(forward);
    const lateralSpeed = this.state.velocity.dot(right);
    const verticalSpeed = this.state.velocity.y;

    // Upward ramp velocity transfer for heavy vehicle launching off incline
    const groundSlopeSpeed = (targetGroundY - this.previousGroundY) / delta;
    if (!wasAirborne && this.state.isAirborne && groundSlopeSpeed > 1.2 && forwardSpeed > 8.0) {
      this.state.velocity.y = Math.min(groundSlopeSpeed, 20.0);
    }

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

      // Acceleration / Braking (Upgraded High-Performance Regenerative & Disc Brakes)
      let accelForce = 0;
      if (input.accelerate) {
        const powerRatio = Math.max(0.15, 1 - (forwardSpeed / currentTopSpeed));
        accelForce = this.ACCELERATION * (isBoosting ? 1.55 : 1.0) * powerRatio * (this.isMarsMode ? 1.25 : 1.0);
      } else if (input.brake) {
        if (forwardSpeed > 2.0) {
          accelForce = -this.BRAKE_FORCE;
        } else if (forwardSpeed < -1.0) {
          accelForce = this.BRAKE_FORCE * 0.75;
        } else {
          // Sharp complete stop without unwanted creeping
          accelForce = -forwardSpeed * 22.0 - (input.brake ? this.ACCELERATION * 0.4 : 0);
        }
      } else {
        accelForce = -forwardSpeed * 0.35 - Math.sign(forwardSpeed) * 0.8;
      }

      this.state.velocity.addScaledVector(forward, accelForce * delta);

      const grip = 0.88;
      const lateralFriction = -lateralSpeed * (1 - grip) * 25.0;
      this.state.velocity.addScaledVector(right, lateralFriction * delta);

      // Heavy vehicle suspension spring & damper dynamics (Hooke's law + critical damping)
      const springK = 220.0;
      const damperC = 28.0;
      const springAcc = -springK * this.suspensionCompression - damperC * this.suspensionVelocity;
      this.suspensionVelocity += springAcc * delta;
      this.suspensionCompression += this.suspensionVelocity * delta;
      this.suspensionCompression = THREE.MathUtils.clamp(this.suspensionCompression, -0.15, 0.05);

      const targetChassisY = targetGroundY + this.suspensionCompression;
      this.state.position.y = THREE.MathUtils.lerp(this.state.position.y, targetChassisY, 32 * delta);
      this.state.velocity.y = 0;
      this.previousGroundY = targetGroundY;

      const targetQuat = new THREE.Quaternion();
      const roadNormal = roadInfo.rampNormal || new THREE.Vector3(0, 1, 0);
      const currentForwardProjected = forward.clone().projectOnPlane(roadNormal).normalize();
      const currentRightProjected = new THREE.Vector3().crossVectors(roadNormal, currentForwardProjected).normalize();
      const rotMatrix = new THREE.Matrix4().makeBasis(currentRightProjected, roadNormal, currentForwardProjected);
      targetQuat.setFromRotationMatrix(rotMatrix);

      // Dynamic cornering body roll (chassis lean during high-speed turns)
      const bodyRollAngle = -THREE.MathUtils.clamp((this.state.steeringAngle * forwardSpeed) * 0.0012, -0.07, 0.07);
      const rollQuat = new THREE.Quaternion().setFromAxisAngle(currentForwardProjected, bodyRollAngle);
      targetQuat.multiply(rollQuat);

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

      // Heavy 2-ton Roadster Aerodynamic Downforce:
      const speedRatio = Math.min(Math.abs(forwardSpeed) / this.BASE_TOP_SPEED, 1.25);
      const aeroDownforce = (speedRatio * speedRatio) * 14.0;
      const effectiveGravity = currentGravity + (this.isMarsMode ? 0 : aeroDownforce * 0.45);

      this.state.velocity.y -= effectiveGravity * delta;
      this.state.velocity.x *= (1 - 0.08 * delta);
      this.state.velocity.z *= (1 - 0.02 * delta);

      // ----------------------------------------------------
      // AIRBORNE ROTATIONAL DYNAMICS & SPACEX RCS STUNT SIMULATION
      // ----------------------------------------------------
      if (this.activeStunt) {
        this.activeStunt.elapsed += delta;
        this.activeStunt.timeout -= delta;
        const progress = Math.min(1.0, this.activeStunt.elapsed / this.activeStunt.duration);

        // Continuous full 360-degree rotation (2 * PI radians)
        const angle = progress * Math.PI * 2;

        let localRotAxis = new THREE.Vector3(1, 0, 0);
        let rotAngle = -angle;

        if (this.activeStunt.type === 'FLIP') {
          localRotAxis.set(1, 0, 0);
          rotAngle = -angle; // Pitch nose up & back in 360 backflip
          this.state.angularVelocity.set(-(Math.PI * 2) / this.activeStunt.duration, 0, 0);
        } else if (this.activeStunt.type === 'ROLL') {
          localRotAxis.set(0, 0, 1);
          rotAngle = -angle; // Supersonic clockwise barrel roll
          this.state.angularVelocity.set(0, 0, -(Math.PI * 2) / this.activeStunt.duration);
        } else if (this.activeStunt.type === 'SPIN') {
          localRotAxis.set(0, 1, 0);
          rotAngle = angle; // Flat 360 yaw spin
          this.state.angularVelocity.set(0, (Math.PI * 2) / this.activeStunt.duration, 0);
        }

        const stuntRotQuat = new THREE.Quaternion().setFromAxisAngle(localRotAxis, rotAngle);
        this.state.quaternion.copy(this.activeStunt.startQuat).multiply(stuntRotQuat);

        // Emergency ground effect nitrogen cushion:
        // If car is inverted near pavement, underbody thruster gives a quick cushion puff
        if (altitude < 1.0 && progress > 0.2 && progress < 0.8 && this.state.velocity.y < 0) {
          this.state.velocity.y += 24.0 * delta;
          soundManager.playRcsBurst();
        }

        // Stunt Completion Check (Full 360 Complete)
        if (progress >= 1.0 || this.activeStunt.timeout <= 0) {
          // Exactly at 360 degrees: smoothly align with ground/track heading
          const currentEuler = new THREE.Euler().setFromQuaternion(this.state.quaternion, 'YXZ');
          this.state.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), currentEuler.y);
          this.state.angularVelocity.set(0, 0, 0);

          if (this.activeStunt.type === 'FLIP') {
            if (this.activeStunt.isStanding) {
              this.state.standingFlips += 1;
              this.awardStunt('OCTOBER 15 STANDING 360 FLIP', 3500);
            } else {
              this.awardStunt('SUPERSONIC 360 FLIP', 2000);
            }
            this.state.stuntsCompletedCount += 1;
          } else if (this.activeStunt.type === 'ROLL') {
            this.state.stuntsCompletedCount += 1;
            this.awardStunt('360 BARREL ROLL', 1600);
          } else if (this.activeStunt.type === 'SPIN') {
            this.state.stuntsCompletedCount += 1;
            this.awardStunt('360 FLAT SPIN', 1400);
          }

          soundManager.playStuntChime(this.state.combo);
          this.activeStunt = null;
        }
      } else {
        // Manual input controls (active when not in an automated stunt)
        const torque = new THREE.Vector3();

        let pitchInput = 0;
        if (input.pitchUp) pitchInput += 1;
        if (input.pitchDown) pitchInput -= 1;
        if (pitchInput !== 0) {
          torque.x = pitchInput * 18.0;
          soundManager.playRcsBurst();
        }

        let rollInput = 0;
        if (input.rollLeft) rollInput += 1;
        if (input.rollRight) rollInput -= 1;
        if (rollInput !== 0) {
          torque.z = rollInput * 22.0; // Responsive supersonic RCS cold-gas thruster roll rate!
          soundManager.playRcsBurst();
        }

        let yawInput = 0;
        if (input.yawLeft) yawInput += 1;
        if (input.yawRight) yawInput -= 1;
        if (yawInput !== 0) {
          torque.y = yawInput * 12.0;
          soundManager.playRcsBurst();
        }

        this.state.angularVelocity.x += torque.x * delta;
        this.state.angularVelocity.y += torque.y * delta;
        this.state.angularVelocity.z += torque.z * delta;

        // Realistic angular damping for manual controls
        const angularDamp = 0.985;
        this.state.angularVelocity.multiplyScalar(Math.pow(angularDamp, delta * 60));

        // Continuous physical rigid body quaternion rotation
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

        // Attitude alignment when nearing road surface (only when NOT actively rolling or pitching)
        if (altitude < 0.8 && rollInput === 0 && pitchInput === 0) {
          const currentYaw = new THREE.Euler().setFromQuaternion(this.state.quaternion, 'YXZ').y;
          const levelQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), currentYaw);
          this.state.quaternion.slerp(levelQuat, 5.0 * delta);
        }
      }
    }

    // ----------------------------------------------------
    // ROCKET COLD-GAS THRUSTERS (SPACEBAR / STUNT VISUALS)
    // ----------------------------------------------------
    const isThrusterActive = Boolean(
      (input.thruster || (this.activeStunt !== null && this.activeStunt.elapsed < 0.35)) &&
      this.state.thrusterGas > 5
    );
    if (isThrusterActive) {
      this.state.thrusterGas = Math.max(0, this.state.thrusterGas - 22.0 * delta);

      const liftForce = currentGravity * (this.isMarsMode ? 3.0 : 1.95);
      const forwardThrust = this.ACCELERATION * (forwardSpeed < 5 ? 0.35 : 0.95);

      if (input.thruster) {
        this.state.velocity.y += liftForce * delta;
        this.state.velocity.addScaledVector(forward, forwardThrust * delta);
      }

      // Standing Jump / Launch from Road (Spacebar)
      if (!wasAirborne && this.state.position.y <= targetGroundY + 0.15 && !this.activeStunt && input.thruster) {
        this.jumpStartedFromStand = forwardSpeed < 8.0;
        this.state.velocity.y = forwardSpeed < 5 ? (this.isMarsMode ? 22.0 : 15.5) : (this.isMarsMode ? 18.0 : 13.0);
        this.state.isAirborne = true;
        soundManager.playLandingImpact(18, true);
      }
    }

    // ----------------------------------------------------
    // LANDING DETECTION & EVALUATION
    // ----------------------------------------------------
    if (wasAirborne && !this.state.isAirborne && !roadInfo.isGap) {
      if (this.activeStunt) {
        this.activeStunt = null;
      }
      this.handleLanding(verticalSpeed, up, forward);
    }

    // Update car position
    this.state.position.addScaledVector(this.state.velocity, delta);

    // Multi-Point Anti-Clipping Ground Collision Guard (Guarantees zero sinking into road or ramps!)
    if (!roadInfo.isGap) {
      const cornerOffsets = [
        new THREE.Vector3(-0.94, -0.02, 1.3),   // FL tire
        new THREE.Vector3(0.94, -0.02, 1.3),    // FR tire
        new THREE.Vector3(-0.96, -0.02, -1.25), // RL tire
        new THREE.Vector3(0.96, -0.02, -1.25),  // RR tire
        new THREE.Vector3(0, 0.11, 2.15),       // Front Splitter
        new THREE.Vector3(0, 0.14, -2.05),      // Rear Diffuser
      ];

      let maxPenetration = 0;
      for (const offset of cornerOffsets) {
        const worldCorner = offset.clone().applyQuaternion(this.state.quaternion).add(this.state.position);
        const roadAtCorner = this.getRoadHeight(worldCorner.x, worldCorner.z);
        if (!roadAtCorner.isGap && worldCorner.y < roadAtCorner.height) {
          const pen = roadAtCorner.height - worldCorner.y;
          if (pen > maxPenetration) {
            maxPenetration = pen;
          }
        }
      }

      if (maxPenetration > 0) {
        this.state.position.y += maxPenetration;
        this.state.velocity.y = Math.max(0, this.state.velocity.y);
      }

      if (this.state.position.y < targetGroundY) {
        this.state.position.y = targetGroundY;
        this.state.velocity.y = Math.max(0, this.state.velocity.y);
      }
    }

    // Safe fall recovery (prevents fatal game crashes & infinite falling)
    if (this.state.position.y < -15.0) {
      if (this.state.health <= 25) {
        this.triggerCrash(true);
      } else {
        this.state.health -= 25;
        this.state.position.set(0, 0.45, this.state.distance + 40);
        this.state.velocity.set(0, 0, 20);
        const currentYaw = new THREE.Euler().setFromQuaternion(this.state.quaternion, 'YXZ').y;
        this.state.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), currentYaw);
        this.state.angularVelocity.set(0, 0, 0);
        this.state.isAirborne = false;
        soundManager.playLandingImpact(12, false);
      }
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

    // 420 Plaid Speed Easter Egg
    if (speedKmh >= 420 && !this.hit420EasterEgg) {
      this.hit420EasterEgg = true;
      this.awardStunt("420 MAXIMUM PLAID WARP SPEED! +4200", 4200);
      soundManager.playStuntChime(4);
    }

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

    // Compute damage level and fire tracking status
    const damageLevel = this.state.health <= 0 ? 3 : this.state.health < 35 ? 2 : this.state.health < 75 ? 1 : 0;
    const isFireActive = this.state.health < 35 || this.state.crashState.isCrashing;
    this.state.damageLevel = damageLevel;
    this.state.isFireActive = isFireActive;

    soundManager.updateTelemetrySounds(
      speedKmh,
      isThrusterActive,
      this.state.isAirborne,
      Math.abs(lateralSpeed) > 6.0,
      isBoosting,
      input.brake && forwardSpeed > 3.0 && !this.state.isAirborne,
      isFireActive
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
      standingFlips: this.state.standingFlips,
      currentMissionIndex: this.state.currentMissionIndex,
      missions: this.state.missions,
      isMarsMode: this.isMarsMode,
      isCrashing: this.state.crashState.isCrashing,
      damageLevel,
      isFireActive,
      isStuntActive: this.activeStunt !== null,
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
        if (car.modelType === 'CYBERTRUCK') {
          this.awardStunt('CYBERTRUCK STEEL BALL TEST SURVIVED! +420', 420);
        } else {
          this.awardStunt('TRAFFIC LEAP +500', 500);
        }
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
        const relativeSpeed = Math.abs(this.state.velocity.z - car.speed);
        const damage = Math.round(relativeSpeed * 0.75) + 20;
        this.state.health = Math.max(0, this.state.health - damage);
        this.state.combo = 1;

        if (this.state.health <= 0 || relativeSpeed > 40) {
          this.triggerCrash(this.state.health <= 0);
        } else {
          this.state.velocity.z = Math.min(this.state.velocity.z, car.speed * 0.4);
          this.state.velocity.x += (playerPos.x - car.x) * 6.0;
          this.state.velocity.y += 2.5;
          soundManager.playLandingImpact(20, false);
        }
      }
    }
  }

  // Update Mission Progression - Live Todo List Tracking
  private updateMissions(speedKmh: number, altitude: number) {
    for (const mission of this.state.missions) {
      if (mission.completed) continue;

      let justCompleted = false;

      switch (mission.type) {
        case 'SPEED':
          mission.current = Math.max(mission.current, Math.min(mission.target, speedKmh));
          if (speedKmh >= mission.target) justCompleted = true;
          break;

        case 'ALTITUDE':
          mission.current = Math.max(mission.current, Math.min(mission.target, Math.round(altitude)));
          if (altitude >= mission.target) justCompleted = true;
          break;

        case 'STANDING_FLIP':
          mission.current = Math.min(mission.target, this.state.standingFlips);
          if (this.state.standingFlips >= mission.target) justCompleted = true;
          break;

        case 'TRAFFIC_LEAP':
          mission.current = Math.min(mission.target, this.state.trafficLeaped);
          if (this.state.trafficLeaped >= mission.target) justCompleted = true;
          break;

        case 'STUNTS':
          mission.current = Math.min(mission.target, this.state.stuntsCompletedCount);
          if (this.state.stuntsCompletedCount >= mission.target) justCompleted = true;
          break;

        case 'RINGS':
          mission.current = Math.min(mission.target, this.state.ringsCollected);
          if (this.state.ringsCollected >= mission.target) justCompleted = true;
          break;

        case 'NEAR_MISS':
          mission.current = Math.min(mission.target, this.state.nearMisses);
          if (this.state.nearMisses >= mission.target) justCompleted = true;
          break;

        case 'DISTANCE':
          mission.current = Math.min(mission.target, Math.round(this.state.distance));
          if (this.state.distance >= mission.target) justCompleted = true;
          break;
      }

      if (justCompleted) {
        mission.completed = true;
        this.state.score += mission.rewardPoints;
        this.awardStunt(`COMPLETED: ${mission.title}`, mission.rewardPoints);
        soundManager.playStuntChime(3);
      }
    }

    // Keep active mission pointer at the first incomplete mission
    const firstIncomplete = this.state.missions.findIndex((m) => !m.completed);
    this.state.currentMissionIndex = firstIncomplete !== -1 ? firstIncomplete : this.state.missions.length - 1;
  }

  private checkStunts() {
    if (this.accumulatedPitch >= 300) {
      this.state.stuntsCompletedCount += 1;
      if (this.jumpStartedFromStand) {
        this.state.standingFlips += 1;
        this.awardStunt('OCTOBER 15 STANDING BACKFLIP', 2500);
      } else {
        this.awardStunt('BACKFLIP', 1200);
      }
      this.accumulatedPitch -= 360;
    } else if (this.accumulatedPitch <= -300) {
      this.state.stuntsCompletedCount += 1;
      if (this.jumpStartedFromStand) {
        this.state.standingFlips += 1;
        this.awardStunt('OCTOBER 15 STANDING FRONTFLIP', 2500);
      } else {
        this.awardStunt('FRONTFLIP', 1200);
      }
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
    this.jumpStartedFromStand = false;

    // Realistic heavy suspension impact compression
    const impactSpeed = Math.abs(verticalVelocity);
    this.suspensionVelocity = -Math.min(impactSpeed * 0.28, 5.5);
    this.suspensionCompression = -Math.min(impactSpeed * 0.012, 0.14);

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

  public triggerCrash(fatal: boolean = false) {
    this.state.combo = 1;
    this.state.velocity.multiplyScalar(0.4);
    this.state.health = Math.max(0, this.state.health - (fatal ? 100 : 35));
    soundManager.playCrash();

    if (fatal || this.state.health <= 0) {
      this.state.crashState.isCrashing = true;
      this.state.crashState.timer = 2.5;
      this.state.isFireActive = true;
      this.state.damageLevel = 3;
      // Realistic tumble physics with violent rotational spin
      this.state.angularVelocity.set(
        (Math.random() - 0.5) * 8.5,
        (Math.random() - 0.5) * 6.5,
        (Math.random() - 0.5) * 11.0
      );
      this.state.velocity.y += 5.5;
      this.state.isAirborne = true;
    } else {
      const currentYaw = new THREE.Euler().setFromQuaternion(this.state.quaternion, 'YXZ').y;
      this.state.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), currentYaw);
      this.state.position.y = 0.52;
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
