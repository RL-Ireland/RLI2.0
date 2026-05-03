const WsSubscribers2 = {
    __subscribers: {},
    websocket: undefined,
    webSocketConnected: false,
    registerQueue: [],
    init: function (port, debug, debugFilters) {
        port = port || 49322;
        debug = debug || false;
        if (debug) {
            if (debugFilters !== undefined) {
                console.warn("WebSocket Debug Mode enabled with filtering. Only events not in the filter list will be dumped");
            } else {
                console.warn("WebSocket Debug Mode enabled without filters applied. All events will be dumped to console");
                console.warn("To use filters, pass in an array of 'channel:event' strings to the second parameter of the init function");
            }
        }
        WsSubscribers2.webSocket = new WebSocket("ws://localhost:" + port);
        WsSubscribers2.webSocket.onmessage = function (event) {
            let jEvent = JSON.parse(event.data);

            if (!jEvent.hasOwnProperty('event')) {
                return;
            }
            let eventSplit = jEvent.event.split(':');
            let channel = eventSplit[0];
            let event_event = eventSplit[1];
            if (debug) {
                if (!debugFilters) {
                    console.log(channel, event_event, jEvent);
                } else if (debugFilters && debugFilters.indexOf(jEvent.event) < 0) {
                    console.log(channel, event_event, jEvent);
                }
            }
            WsSubscribers2.triggerSubscribers(channel, event_event, jEvent.data);
        };
        WsSubscribers2.webSocket.onopen = function () {
            WsSubscribers2.triggerSubscribers("ws", "open");
            WsSubscribers2.webSocketConnected = true;
            WsSubscribers2.registerQueue.forEach((r) => {
                WsSubscribers2.send("wsRelay", "register", r);
            });
            WsSubscribers2.registerQueue = [];
        };
        WsSubscribers2.webSocket.onerror = function () {
            WsSubscribers2.triggerSubscribers("ws", "error");
            WsSubscribers2.webSocketConnected = false;
        };
        WsSubscribers2.webSocket.onclose = function () {
            WsSubscribers2.triggerSubscribers("ws", "close");
            WsSubscribers2.webSocketConnected = false;
        };
    },
    /**
     * Add callbacks for when certain events are thrown
     * Execution is guaranteed to be in First In First Out order
     * @param channels
     * @param events
     * @param callback
     */
    subscribe: function (channels, events, callback) {
        if (typeof channels === "string") {
            let channel = channels;
            channels = [];
            channels.push(channel);
        }
        if (typeof events === "string") {
            let event = events;
            events = [];
            events.push(event);
        }
        channels.forEach(function (c) {
            events.forEach(function (e) {
                if (!WsSubscribers2.__subscribers.hasOwnProperty(c)) {
                    WsSubscribers2.__subscribers[c] = {};
                }
                if (!WsSubscribers2.__subscribers[c].hasOwnProperty(e)) {
                    WsSubscribers2.__subscribers[c][e] = [];
                    if (WsSubscribers2.webSocketConnected) {
                        WsSubscribers2.send("wsRelay", "register", `${c}:${e}`);
                    } else {
                        WsSubscribers2.registerQueue.push(`${c}:${e}`);
                    }
                }
                WsSubscribers2.__subscribers[c][e].push(callback);
            });
        });
    },
    clearEventCallbacks: function (channel, event) {
        if (WsSubscribers2.__subscribers.hasOwnProperty(channel) && WsSubscribers2.__subscribers[channel].hasOwnProperty(event)) {
            WsSubscribers2.__subscribers[channel] = {};
        }
    },
    triggerSubscribers: function (channel, event, data) {
        if (WsSubscribers2.__subscribers.hasOwnProperty(channel) && WsSubscribers2.__subscribers[channel].hasOwnProperty(event)) {
            WsSubscribers2.__subscribers[channel][event].forEach(function (callback) {
                if (callback instanceof Function) {
                    callback(data);
                }
            });
        }
    },
    send: function (channel, event, data) {
        if (typeof channel !== 'string') {
            console.error("Channel must be a string");
            return;
        }
        if (typeof event !== 'string') {
            console.error("Event must be a string");
            return;
        }
        if (channel === 'local') {
            this.triggerSubscribers(channel, event, data);
        } else {
            let cEvent = channel + ":" + event;
            WsSubscribers2.webSocket.send(JSON.stringify({
                'event': cEvent,
                'data': data
            }));
        }
    }
};