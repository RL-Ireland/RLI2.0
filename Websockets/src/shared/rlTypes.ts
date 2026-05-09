export interface RlMessage<TData = unknown> {
  Event: string;
  Data: TData;
}

export interface RlPlayerRef {
  Name: string;
  Shortcut: number;
  TeamNum?: number;
}

export interface RlVector {
  X: number;
  Y: number;
  Z?: number;
}

export interface RlUpdateState {
  MatchGuid: string;
  Players: RlPlayer[];
  Game: RlGame;
}

export interface RlPlayer extends RlPlayerRef {
  PrimaryId?: string;
  Score?: number;
  Goals?: number;
  Shots?: number;
  Assists?: number;
  Saves?: number;
  Touches?: number;
  CarTouches?: number;
  Demos?: number;
  bHasCar?: boolean;
  Speed?: number;
  Boost?: number;
  bBoosting?: boolean;
  bOnGround?: boolean;
  bOnWall?: boolean;
  bPowersliding?: boolean;
  bDemolished?: boolean;
  bSupersonic?: boolean;
  Attacker?: RlPlayerRef;
  Location?: RlCarLocation;
}

export interface RlCarLocation extends RlVector {
  pitch?: number;
  roll?: number;
  yaw?: number;
}

export interface RlGame {
  Teams?: RlTeam[];
  TimeSeconds?: number;
  bOvertime?: boolean;
  Ball?: {
    Speed?: number;
    TeamNum?: number;
    Location?: RlVector;
  };
  bReplay?: boolean;
  bHasWinner?: boolean;
  Winner?: string;
  Arena?: string;
  bHasTarget?: boolean;
  Target?: RlPlayerRef;
}

export interface RlTeam {
  Name?: string;
  TeamNum?: number;
  Score?: number;
  ColorPrimary?: string;
  ColorSecondary?: string;
}

export interface RlBallHit {
  MatchGuid: string;
  Players?: RlPlayerRef[];
  Ball?: {
    PreHitSpeed?: number;
    PostHitSpeed?: number;
    Location?: RlVector;
  };
}

export interface RlClockUpdatedSeconds {
  MatchGuid: string;
  TimeSeconds: number;
  bOvertime: boolean;
}

export interface RlGoalScored {
  MatchGuid: string;
  GoalSpeed?: number;
  GoalTime?: number;
  ImpactLocation?: RlVector;
  Scorer?: RlPlayerRef;
  Assister?: RlPlayerRef;
  BallLastTouch?: {
    Player?: RlPlayerRef;
    Speed?: number;
  };
}

export interface RlStatfeedEvent {
  MatchGuid: string;
  EventName?: string;
  Type?: string;
  MainTarget?: RlPlayerRef;
  SecondaryTarget?: RlPlayerRef;
}

export interface RlMatchEnded {
  MatchGuid: string;
  WinnerTeamNum?: number;
}
