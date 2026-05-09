# RL to SOS Converter

RL to SOS Converter is a small Windows/Electron bridge for Rocket League broadcast overlays.

Repository: <https://github.com/PollieDev/sos-rl-converter>

Rocket League now exposes gameplay data through its own Stats API. Many existing overlays were built for the older SOS/BakkesMod WebSocket format. This app connects to the Rocket League Stats API, converts known events into SOS-compatible payloads, and broadcasts them over a local WebSocket server.

## What It Does

```text
Rocket League Stats API
raw TCP JSON on 127.0.0.1:49123
        |
        v
RL to SOS Converter
event mapping only
        |
        v
SOS-compatible WebSocket
plain JSON on 0.0.0.0:49122
```

The converter is intentionally lightweight. It does not keep game state, replay history, or player history. Each incoming event is parsed, mapped, and forwarded.

## Ports

These are currently hardcoded:

- Rocket League input: `127.0.0.1:49123`
- SOS-compatible WebSocket output: `0.0.0.0:49122`

Local overlays can connect to:

```text
ws://localhost:49122
```

Other devices on the same network can connect to:

```text
ws://<this PC's LAN IP>:49122
```

Windows Firewall may ask for permission before other devices can connect.

## Rocket League Setup

Rocket League must have the Stats API enabled before launching the game.

Edit:

```text
<Rocket League Install Dir>\TAGame\Config\DefaultStatsAPI.ini
```

Typical settings:

```ini
PacketSendRate=60
Port=49123
```

`PacketSendRate` must be greater than `0`. Rocket League only reads this configuration at startup, so restart the game after changing it.

## Event Mapping

Known Rocket League events are mapped into SOS event names:

| Rocket League event | SOS event |
| --- | --- |
| `MatchCreated` | `game:match_created` |
| `MatchInitialized` | `game:initialized` |
| `CountdownBegin` | `game:pre_countdown_begin`, `game:post_countdown_begin` |
| `UpdateState` | `game:update_state` |
| `BallHit` | `game:ball_hit` |
| `ClockUpdatedSeconds` | `game:clock_updated_seconds` |
| `StatfeedEvent` | `game:statfeed_event` |
| `GoalScored` | `game:goal_scored` |
| `GoalReplayStart` / `ReplayStart` | `game:replay_start` |
| `GoalReplayWillEnd` / `ReplayWillEnd` | `game:replay_will_end` |
| `GoalReplayEnd` / `ReplayEnd` | `game:replay_end` |
| `MatchEnded` | `game:match_ended` |
| `PodiumStart` | `game:podium_start` |
| `MatchDestroyed` | `game:match_destroyed` |

Unknown or Rocket-League-only events are forwarded with the original event name and original data:

```json
{
  "event": "CrossbarHit",
  "data": {
    "MatchGuid": "...",
    "BallSpeed": 870.3
  }
}
```

## Player IDs

SOS player IDs are generated as:

```text
Name_Shortcut
```

Example:

```text
Jester_7
```

Rocket League's `PrimaryId` is exposed separately as `primary_id`.

This matters because bots may report the same `PrimaryId`, such as `Unknown|0|0`. The generated SOS-style ID is more useful as the player object key.

## Observed Rocket League API Quirks

These are behaviors observed while testing against the live Rocket League Stats API:

- The API is raw TCP, not WebSocket, even though some documentation wording mentions WebSocket.
- The outer message is JSON, but `Data` may itself be a JSON-encoded string. The converter parses this automatically.
- `UpdateState.Game.Ball` may include speed/team but not ball location. When location is absent, the converter emits `{ "X": 0, "Y": 0, "Z": 0 }` for SOS compatibility.
- `MatchCreated` may arrive with an empty `MatchGuid`; `MatchInitialized` later contains the real match guid.
- Real replay events may be named `ReplayWillEnd` instead of `GoalReplayWillEnd`.
- `GoalScored` can sometimes arrive with an empty scorer and zero speed/time around replay or transition moments. Empty player names are mapped to an empty SOS id.
- `StatfeedEvent.SecondaryTarget` is often absent. In that case the converter emits the SOS-compatible empty target with `team_num: -1`.

## Development

Requirements:

- Windows
- Node.js `24.15.0` or newer
- npm `11.13.0` or newer

Install dependencies:

```powershell
npm install
```

Run tests:

```powershell
npm test
```

Start the app locally:

```powershell
npm start
```

Build Windows release artifacts:

```powershell
npm run dist
```

Release output is written to:

```text
release/
```

The build currently creates both an installer and a portable executable.

## Notes on Releases

Current builds are unsigned. Windows SmartScreen may warn users when opening downloaded `.exe` files.

## Icon Attribution

The app icon is from Flaticon and requires attribution when used under the free license:

Icon from [Flaticon](https://www.flaticon.com/).

## License

MIT. See [LICENSE](LICENSE).
