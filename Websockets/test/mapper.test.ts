import assert from "assert";
import { mapRlEventToSosMessages } from "../src/shared/mapping/eventMapper";
import { RlMessage } from "../src/shared/rlTypes";

const matchGuid = "2C1968F21375F624E13D68C3DE5A7713";

const updateState: RlMessage = {
  Event: "UpdateState",
  Data: {
    MatchGuid: matchGuid,
    Players: [
      {
        Name: "Player 1",
        PrimaryId: "1",
        Shortcut: 1,
        TeamNum: 0,
        Score: 0,
        Goals: 0,
        Shots: 0,
        Assists: 0,
        Saves: 0,
        Touches: 0,
        CarTouches: 0,
        Demos: 0,
        bHasCar: true,
        Speed: 0,
        Boost: 33,
        bBoosting: false,
        bOnGround: true,
        bOnWall: false,
        bPowersliding: false,
        bDemolished: false,
        bSupersonic: false
      }
    ],
    Game: {
      Teams: [
        {
          Name: "BLUE",
          TeamNum: 0,
          Score: 2,
          ColorPrimary: "1873FF",
          ColorSecondary: "E5E5E5"
        }
      ],
      TimeSeconds: 289,
      Ball: {
        Speed: 50,
        TeamNum: 0,
        Location: { X: 10, Y: 20, Z: 30 }
      },
      bOvertime: false,
      bReplay: false,
      bHasWinner: false,
      Winner: "",
      Arena: "Stadium_P",
      bHasTarget: true,
      Target: {
        Name: "Player 1",
        Shortcut: 1,
        TeamNum: 0
      }
    }
  }
};

const goalScored: RlMessage = {
  Event: "GoalScored",
  Data: {
    MatchGuid: matchGuid,
    GoalSpeed: 50,
    GoalTime: 200,
    ImpactLocation: { X: 0, Y: 0, Z: 0 },
    Scorer: { Name: "Player 1", Shortcut: 1, TeamNum: 0 },
    Assister: { Name: "Player 3", Shortcut: 3, TeamNum: 0 },
    BallLastTouch: {
      Player: { Name: "Player 1", Shortcut: 1, TeamNum: 0 },
      Speed: 0
    }
  }
};

const ballHit: RlMessage = {
  Event: "BallHit",
  Data: {
    MatchGuid: matchGuid,
    Players: [{ Name: "Player 1", Shortcut: 1, TeamNum: 0 }],
    Ball: {
      PreHitSpeed: 10,
      PostHitSpeed: 20,
      Location: { X: 10, Y: 20, Z: 30 }
    }
  }
};

const statfeed: RlMessage = {
  Event: "StatfeedEvent",
  Data: {
    MatchGuid: matchGuid,
    EventName: "Goal",
    Type: "Goal",
    MainTarget: { Name: "Player 1", Shortcut: 1, TeamNum: 0 },
    SecondaryTarget: { Name: "Player 3", Shortcut: 3, TeamNum: 0 }
  }
};

function run(): void {
  const [mappedUpdate] = mapRlEventToSosMessages(updateState);
  assert.strictEqual(mappedUpdate.event, "game:update_state");
  assert.strictEqual((mappedUpdate.data as any).event, "gamestate");
  assert.strictEqual((mappedUpdate.data as any).players["Player 1_1"].primary_id, "1");
  assert.strictEqual((mappedUpdate.data as any).game.target, "Player 1_1");
  assert.strictEqual((mappedUpdate.data as any).game.teams[0].color_primary, "1873FF");
  assert.strictEqual((mappedUpdate.data as any).game.teams[1].score, 0);

  const [mappedGoal] = mapRlEventToSosMessages(goalScored);
  assert.strictEqual(mappedGoal.event, "game:goal_scored");
  assert.strictEqual((mappedGoal.data as any).scorer.id, "Player 1_1");
  assert.strictEqual((mappedGoal.data as any).assister.id, "Player 3_3");
  assert.strictEqual((mappedGoal.data as any).ball_last_touch.player, "Player 1_1");

  const [mappedBallHit] = mapRlEventToSosMessages(ballHit);
  assert.strictEqual(mappedBallHit.event, "game:ball_hit");
  assert.strictEqual((mappedBallHit.data as any).player.id, "Player 1_1");
  assert.strictEqual((mappedBallHit.data as any).ball.post_hit_speed, 20);

  const [mappedStatfeed] = mapRlEventToSosMessages(statfeed);
  assert.strictEqual(mappedStatfeed.event, "game:statfeed_event");
  assert.strictEqual((mappedStatfeed.data as any).main_target.id, "Player 1_1");

  const [statfeedWithoutSecondary] = mapRlEventToSosMessages({
    Event: "StatfeedEvent",
    Data: {
      MatchGuid: matchGuid,
      EventName: "Goal",
      Type: "Goal",
      MainTarget: { Name: "Player 1", Shortcut: 1, TeamNum: 0 }
    }
  });
  assert.deepStrictEqual((statfeedWithoutSecondary.data as any).secondary_target, {
    id: "",
    name: "",
    team_num: -1
  });

  const [unknown] = mapRlEventToSosMessages({
    Event: "CrossbarHit",
    Data: { MatchGuid: matchGuid, BallSpeed: 870.3 }
  });
  assert.deepStrictEqual(unknown, {
    event: "CrossbarHit",
    data: { MatchGuid: matchGuid, BallSpeed: 870.3 }
  });

  const [clockUpdatedSeconds] = mapRlEventToSosMessages({
    Event: "ClockUpdatedSeconds",
    Data: {
      MatchGuid: matchGuid,
      TimeSeconds: 135,
      bOvertime: false
    }
  });
  assert.deepStrictEqual(clockUpdatedSeconds, {
    event: "game:clock_updated_seconds",
    data: {
      match_guid: matchGuid,
      isOT: false,
      time_seconds: 135
    }
  });

  const countdown = mapRlEventToSosMessages({
    Event: "CountdownBegin",
    Data: { MatchGuid: matchGuid }
  });
  assert.deepStrictEqual(
    countdown.map((message) => message.event),
    ["game:pre_countdown_begin", "game:post_countdown_begin"]
  );

  const [stringDataUpdate] = mapRlEventToSosMessages({
    Event: "UpdateState",
    Data: JSON.stringify(updateState.Data)
  });
  assert.strictEqual((stringDataUpdate.data as any).players["Player 1_1"].boost, 33);

  const [realReplayWillEnd] = mapRlEventToSosMessages({
    Event: "ReplayWillEnd",
    Data: { MatchGuid: matchGuid }
  });
  assert.strictEqual(realReplayWillEnd.event, "game:replay_will_end");

  const [emptyScorerGoal] = mapRlEventToSosMessages({
    Event: "GoalScored",
    Data: {
      MatchGuid: matchGuid,
      Scorer: { Name: "", Shortcut: 0, TeamNum: 0 }
    }
  });
  assert.strictEqual((emptyScorerGoal.data as any).scorer.id, "");
}

run();
