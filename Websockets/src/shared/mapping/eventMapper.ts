import {
  RlBallHit,
  RlClockUpdatedSeconds,
  RlGoalScored,
  RlMatchEnded,
  RlMessage,
  RlPlayer,
  RlPlayerRef,
  RlStatfeedEvent,
  RlTeam,
  RlUpdateState,
  RlVector
} from "../rlTypes";
import { SosMessage } from "../sosTypes";

const zeroLocation = {
  X: 0,
  Y: 0,
  Z: 0,
  pitch: 0,
  roll: 0,
  yaw: 0
};

export function mapRlEventToSosMessages(message: RlMessage): SosMessage[] {
  const data = normalizeData(message.Data);

  switch (message.Event) {
    case "MatchCreated":
      return [simple("game:match_created", data)];
    case "MatchInitialized":
      return [simple("game:initialized", data)];
    case "CountdownBegin":
      return [
        simple("game:pre_countdown_begin", data),
        simple("game:post_countdown_begin", data)
      ];
    case "UpdateState":
      return [mapUpdateState(data as RlUpdateState)];
    case "BallHit":
      return [mapBallHit(data as RlBallHit)];
    case "ClockUpdatedSeconds":
      return [mapClockUpdatedSeconds(data as RlClockUpdatedSeconds)];
    case "StatfeedEvent":
      return [mapStatfeedEvent(data as RlStatfeedEvent)];
    case "GoalScored":
      return [mapGoalScored(data as RlGoalScored)];
    case "GoalReplayStart":
    case "ReplayStart":
      return [simple("game:replay_start", data)];
    case "GoalReplayWillEnd":
    case "ReplayWillEnd":
      return [simple("game:replay_will_end", data)];
    case "GoalReplayEnd":
    case "ReplayEnd":
      return [simple("game:replay_end", data)];
    case "MatchEnded":
      return [mapMatchEnded(data as RlMatchEnded)];
    case "PodiumStart":
      return [simple("game:podium_start", data)];
    case "MatchDestroyed":
      return [simple("game:match_destroyed", data)];
    default:
      return [simple(message.Event, data)];
  }
}

function normalizeData(data: unknown): unknown {
  if (typeof data !== "string") {
    return data;
  }

  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

function simple(event: string, data: unknown): SosMessage {
  return { event, data };
}

function mapUpdateState(data: RlUpdateState): SosMessage {
  const players: Record<string, unknown> = {};
  const game = read(data, "Game", "game") || {};
  const rlPlayers = read(data, "Players", "players") || [];

  for (const player of rlPlayers) {
    const id = makeSosPlayerId(player);
    players[id] = mapPlayer(player, id);
  }

  return {
    event: "game:update_state",
    data: {
      event: "gamestate",
      game: {
        arena: read(game, "Arena", "arena") || "",
        time_milliseconds: read(game, "TimeSeconds", "time_seconds", "time") ?? 0,
        time_seconds: read(game, "TimeSeconds", "time_seconds", "time") ?? 0,
        teams: mapTeams(read(game, "Teams", "teams") || []),
        ball: {
          location: read(read(game, "Ball", "ball") || {}, "Location", "location") || { X: 0, Y: 0, Z: 0 },
          speed: read(read(game, "Ball", "ball") || {}, "Speed", "speed") ?? 0,
          team: read(read(game, "Ball", "ball") || {}, "TeamNum", "team", "team_num") ?? 0
        },
        hasTarget: Boolean(read(game, "bHasTarget", "hasTarget")),
        target: makeOptionalSosPlayerId(read(game, "Target", "target")),
        hasWinner: Boolean(read(game, "bHasWinner", "hasWinner")),
        winner: read(game, "Winner", "winner") || "",
        isOT: Boolean(read(game, "bOvertime", "isOT")),
        isReplay: Boolean(read(game, "bReplay", "isReplay"))
      },
      players,
      hasGame: true,
      match_guid: read(data, "MatchGuid", "match_guid")
    }
  };
}

function mapPlayer(player: RlPlayer, id: string): unknown {
  return {
    id,
    primary_id: read(player, "PrimaryId", "primary_id") || "",
    name: read(player, "Name", "name") || "",
    team: read(player, "TeamNum", "team", "team_num") ?? 0,
    boost: read(player, "Boost", "boost") ?? 0,
    speed: read(player, "Speed", "speed") ?? 0,
    isBoosting: Boolean(read(player, "bBoosting", "isBoosting")),
    isPowersliding: Boolean(read(player, "bPowersliding", "isPowersliding")),
    isSonic: Boolean(read(player, "bSupersonic", "isSonic")),
    onGround: Boolean(read(player, "bOnGround", "onGround")),
    onWall: Boolean(read(player, "bOnWall", "onWall")),
    hasCar: read(player, "bHasCar", "hasCar") !== false,
    shortcut: read(player, "Shortcut", "shortcut") ?? 0,
    attacker: makeOptionalSosPlayerId(read(player, "Attacker", "attacker")),
    isDead: Boolean(read(player, "bDemolished", "isDead")),
    location: normalizeCarLocation(read(player, "Location", "location")),
    score: read(player, "Score", "score") ?? 0,
    assists: read(player, "Assists", "assists") ?? 0,
    demos: read(player, "Demos", "demos") ?? 0,
    goals: read(player, "Goals", "goals") ?? 0,
    saves: read(player, "Saves", "saves") ?? 0,
    shots: read(player, "Shots", "shots") ?? 0,
    touches: read(player, "Touches", "touches") ?? 0,
    cartouches: read(player, "CarTouches", "cartouches") ?? 0
  };
}

function mapTeam(team: RlTeam): unknown {
  return {
    color_primary: read(team, "ColorPrimary", "color_primary") || "",
    color_secondary: read(team, "ColorSecondary", "color_secondary") || "",
    name: read(team, "Name", "name") || "",
    score: read(team, "Score", "score") ?? 0
  };
}

function mapTeams(teams: RlTeam[]): unknown[] {
  const defaults: RlTeam[] = [
    {
      Name: "BLUE",
      TeamNum: 0,
      Score: 0,
      ColorPrimary: "1873FF",
      ColorSecondary: "E5E5E5"
    },
    {
      Name: "ORANGE",
      TeamNum: 1,
      Score: 0,
      ColorPrimary: "C26418",
      ColorSecondary: "E5E5E5"
    }
  ];

  const byTeamNum = new Map<number, RlTeam>();
  for (const team of teams) {
    byTeamNum.set(read(team, "TeamNum", "team_num") ?? byTeamNum.size, team);
  }

  return defaults.map((fallback, index) => mapTeam({ ...fallback, ...(byTeamNum.get(index) || {}) }));
}

function mapBallHit(data: RlBallHit): SosMessage {
  const player = data.Players && data.Players.length > 0 ? data.Players[0] : undefined;

  return {
    event: "game:ball_hit",
    data: {
      ball: {
        location: data.Ball?.Location || { X: 0, Y: 0, Z: 0 },
        pre_hit_speed: data.Ball?.PreHitSpeed ?? 0,
        post_hit_speed: data.Ball?.PostHitSpeed ?? 0
      },
      player: player
        ? {
            name: player.Name || "",
            id: makeSosPlayerId(player)
          }
        : {
            name: "",
            id: ""
          },
      match_guid: data.MatchGuid
    }
  };
}

function mapClockUpdatedSeconds(data: RlClockUpdatedSeconds): SosMessage {
  return {
    event: "game:clock_updated_seconds",
    data: {
      match_guid: data.MatchGuid,
      isOT: data.bOvertime,
      time_seconds: data.TimeSeconds,
    },
  };
}

function mapGoalScored(data: RlGoalScored): SosMessage {
  return {
    event: "game:goal_scored",
    data: {
      scorer: data.Scorer
        ? {
            id: makeSosPlayerId(data.Scorer),
            name: data.Scorer.Name || "",
            teamnum: data.Scorer.TeamNum ?? 0
          }
        : { id: "", name: "", teamnum: 0 },
      assister: data.Assister
        ? {
            id: makeSosPlayerId(data.Assister),
            name: data.Assister.Name || ""
          }
        : { id: "", name: "" },
      goaltime: data.GoalTime ?? 0,
      goalspeed: data.GoalSpeed ?? 0,
      ball_last_touch: {
        player: data.BallLastTouch?.Player ? makeSosPlayerId(data.BallLastTouch.Player) : "",
        speed: data.BallLastTouch?.Speed ?? 0
      },
      impact_location: normalizeVector(data.ImpactLocation),
      match_guid: data.MatchGuid
    }
  };
}

function mapStatfeedEvent(data: RlStatfeedEvent): SosMessage {
  return {
    event: "game:statfeed_event",
    data: {
      event_name: data.EventName || "",
      type: data.Type || "",
      main_target: mapTeamTarget(data.MainTarget),
      secondary_target: mapTeamTarget(data.SecondaryTarget),
      match_guid: data.MatchGuid
    }
  };
}

function mapMatchEnded(data: RlMatchEnded): SosMessage {
  return {
    event: "game:match_ended",
    data: {
      ...data,
      match_guid: data.MatchGuid,
      winner_team_num: data.WinnerTeamNum ?? 0
    }
  };
}

function mapTeamTarget(player?: RlPlayerRef): unknown {
  if (!player) {
    return { id: "", name: "", team_num: -1 };
  }

  return {
    id: makeSosPlayerId(player),
    name: player.Name || "",
    team_num: player.TeamNum ?? 0
  };
}

function normalizeVector(vector?: RlVector): RlVector {
  return {
    X: vector?.X ?? 0,
    Y: vector?.Y ?? 0,
    Z: vector?.Z ?? 0
  };
}

function normalizeCarLocation(location?: RlPlayer["Location"]): typeof zeroLocation {
  return {
    X: read(location, "X") ?? 0,
    Y: read(location, "Y") ?? 0,
    Z: read(location, "Z") ?? 0,
    pitch: read(location, "pitch") ?? 0,
    roll: read(location, "roll") ?? 0,
    yaw: read(location, "yaw") ?? 0
  };
}

export function makeSosPlayerId(player: Pick<RlPlayerRef, "Name" | "Shortcut">): string {
  const name = read<string>(player, "Name", "name") || "";
  if (!name) {
    return "";
  }

  return `${name}_${read(player, "Shortcut", "shortcut") ?? 0}`;
}

function makeOptionalSosPlayerId(player?: Pick<RlPlayerRef, "Name" | "Shortcut">): string {
  return player ? makeSosPlayerId(player) : "";
}

function read<TFallback = any>(source: unknown, ...keys: string[]): TFallback | undefined {
  if (!source || typeof source !== "object") {
    return undefined;
  }

  const record = source as Record<string, TFallback>;
  for (const key of keys) {
    if (key in record) {
      return record[key];
    }
  }

  return undefined;
}
