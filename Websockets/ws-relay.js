const WebSocket = require('ws');
const prompt = require('prompt');
const { success, error, warn, info, log, indent } = require('cli-msg');
const atob = require('atob');
const fs = require('fs').promises;
const path = require('path');
let argv = require('minimist')(process.argv);

// ---------- TEAMS LOGO DIRECTORY ----------
const TEAMS_DIR = path.join(__dirname, '../Images', 'teams');

// ---------- HELPER FUNCTIONS ----------
async function ensureDir(dir) {
    try {
        await fs.mkdir(dir, { recursive: true });
    } catch (err) {
        if (err.code !== 'EEXIST') throw err;
    }
}

/**
 * Handles a 'logo:save' message:
 * - decodes the base64 file data
 * - writes it to Images/teams/<teamId>.<ext>
 * - replies to the sender with 'logo:saved'
 */
async function handleLogoSave(senderConnectionId, data, connections) {
    if (!connections[senderConnectionId]) return;

    const { teamId, fileName, fileData } = data;
    if (!teamId || !fileData) {
        warn.wb(`Missing teamId or fileData from ${senderConnectionId}`);
        return;
    }

    // Determine file extension
    const ext = path.extname(fileName || '').toLowerCase() || '.png';
    const safeTeamId = teamId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const newFileName = `${safeTeamId}${ext}`;
    const filePath = path.join(TEAMS_DIR, newFileName);

    try {
        await ensureDir(TEAMS_DIR);
        const buffer = Buffer.from(fileData, 'base64');
        await fs.writeFile(filePath, buffer);
        const savedPath = `Images/teams/${newFileName}`;
        success.wb(`Logo saved: ${savedPath}`);

        // Reply to the sender
        const response = JSON.stringify({
            event: 'logo:saved',
            data: {
                teamId: teamId,
                savedPath: savedPath
            }
        });
        connections[senderConnectionId].connection.send(response);
    } catch (err) {
        error.wb(`Failed to save logo: ${err.message}`);
    }
}

// ---------- PROMPT & WEBSOCKET SETUP ----------
let promptsPassed = false;

function addPromptOverrideProperty(key, val) {
    if (!prompt.override) {
        prompt.override = {};
    }
    prompt.override[key] = val;
}

if (argv.hasOwnProperty('port')) {
    addPromptOverrideProperty('port', argv.port);
}

// Timeout for programmatic usage
if (argv.timeout) {
    let timeoutMs = parseInt(argv.timeout, 10);
    if (timeoutMs > 0) {
        setTimeout(() => {
            if (!promptsPassed) {
                console.error(`\n\nPrompts not completed within timeout limit (${timeoutMs}ms). Exiting`);
                process.exit(100);
            }
        }, timeoutMs);
    }
}

prompt.get([
    {
        description: "Port number for this websocket server",
        pattern: /^\d+$/,
        message: 'Must be a number',
        name: 'port',
        required: true,
        default: "49322",
    }
], function (e, r) {
    promptsPassed = true;

    const wss = new WebSocket.Server({ port: r.port });
    let connections = {};
    info.wb("Opened WebSocket server on port " + r.port);

    // Ensure the teams directory exists on startup
    ensureDir(TEAMS_DIR).then(() => {
        success.wb(`Images/teams folder ready: ${TEAMS_DIR}`);
    }).catch(err => {
        error.wb(`Could not create Images/teams folder: ${err.message}`);
    });

    wss.on('connection', function connection(ws) {
        let id = (+ new Date()).toString();
        success.wb("Received connection: " + id);
        connections[id] = {
            connection: ws,
            registeredFunctions: []
        };

        ws.send(JSON.stringify({
            event: "wsRelay:info",
            data: "Connected!"
        }));

        ws.on('message', function incoming(message) {
            sendRelayMessage(id, message);
        });

        ws.on('close', function close() {
            delete connections[id];
        });
    });

    function sendRelayMessage(senderConnectionId, message) {
        let json;
        try {
            json = JSON.parse(message);
        } catch (e) {
            error.wb("Invalid JSON from " + senderConnectionId);
            return;
        }

        let channelEvent = (json['event'] || '').split(':');

        // -------- NEW: Intercept logo saving ----------
        if (channelEvent[0] === 'logo' && channelEvent[1] === 'save') {
            // Handle server‑side saving, do NOT relay
            handleLogoSave(senderConnectionId, json.data || {}, connections);
            return;
        }

        // Original relay logic
        if (channelEvent[0] === 'wsRelay') {
            if (channelEvent[1] === 'register') {
                if (connections[senderConnectionId].registeredFunctions.indexOf(json['data']) < 0) {
                    connections[senderConnectionId].registeredFunctions.push(json['data']);
                    info.wb(senderConnectionId + "> Registered to receive: " + json['data']);
                } else {
                    warn.wb(senderConnectionId + "> Attempted to register an already registered function: " + json['data']);
                }
            } else if (channelEvent[1] === 'unregister') {
                let idx = connections[senderConnectionId].registeredFunctions.indexOf(json['data']);
                if (idx > -1) {
                    connections[senderConnectionId].registeredFunctions.splice(idx, 1);
                    info.wb(senderConnectionId + "> Unregistered: " + json['data']);
                } else {
                    warn.wb(senderConnectionId + "> Attempted to unregister a non-registered function: " + json['data']);
                }
            }
            return;
        }

        // Relay to other connections
        for (let k in connections) {
            if (senderConnectionId === k) continue;
            if (!connections.hasOwnProperty(k)) continue;
            if (connections[k].registeredFunctions.indexOf(json['event']) > -1) {
                setTimeout(() => {
                    try {
                        connections[k].connection.send(message.toString());
                    } catch (e) {
                        // Ignore closed connections
                    }
                }, 0);
            }
        }
    }
});