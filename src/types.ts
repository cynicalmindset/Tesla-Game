export type GameState = 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export type LandingQuality = 'PERFECT' | 'CLEAN' | 'ROUGH' | 'CRASH';

export type StabilityStatus = 'OPTIMAL' | 'CAUTION' | 'CRITICAL';

export interface StuntEvent {
  id: string;
  name: string;
  points: number;
  multiplier: number;
  timestamp: number;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  completed: boolean;
  rewardPoints: number;
  type: 'SPEED' | 'ALTITUDE' | 'STUNTS' | 'TRAFFIC_LEAP' | 'RINGS' | 'DISTANCE' | 'STANDING_FLIP' | 'NEAR_MISS';
}

export interface TrafficVehicle {
  id: string;
  x: number;
  z: number;
  speed: number; // m/s
  lane: number;
  modelType: 'CYBERTRUCK' | 'SEDAN' | 'SEMI';
  color: string;
  passedOver?: boolean;
}

export interface TelemetryData {
  speed: number;              // m/s
  kmh: number;                // km/h
  altitude: number;           // meters above road
  airtime: number;            // current jump airtime in seconds
  totalAirtime: number;       // total jump airtime during run
  thrusterGas: number;        // 0 to 100% (cold-gas pressure)
  boostEnergy: number;        // 0 to 100% (electric battery capacitor boost)
  pitch: number;              // degrees (-180 to 180)
  roll: number;               // degrees (-180 to 180)
  yaw: number;                // degrees
  landingStability: StabilityStatus;
  isAirborne: boolean;
  distance: number;           // meters
  score: number;
  combo: number;
  maxSpeed: number;           // max km/h reached
  stuntHistory: StuntEvent[];
  recentStunt: StuntEvent | null;
  landingCount: number;
  cleanLandingCount: number;
  ringsCollected: number;
  flightModeActive: boolean;
  health: number;             // 0 to 100%
  trafficLeaped: number;
  nearMisses: number;
  standingFlips: number;
  currentMissionIndex: number;
  missions: Mission[];
  isMarsMode?: boolean;
  isCrashing?: boolean;
  damageLevel?: number;       // 0 (none) to 3 (heavy fire/smoke)
  isFireActive?: boolean;
}

export interface InputState {
  accelerate: boolean;
  brake: boolean;
  steerLeft: boolean;
  steerRight: boolean;
  thruster: boolean;
  pitchUp: boolean;
  pitchDown: boolean;
  rollLeft: boolean;
  rollRight: boolean;
  yawLeft: boolean;
  yawRight: boolean;
  boost: boolean;
  restart: boolean;
  instantFlip?: boolean;
  instantRoll?: boolean;
  instantSpin?: boolean;
  toggleMars?: boolean;
}

export interface TrackFeature {
  id: string;
  type: 'RAMP' | 'RING' | 'BARRIER' | 'GANTRIE' | 'GAP';
  position: [number, number, number];
  rotation?: [number, number, number];
  size?: [number, number, number];
  collected?: boolean;
}
