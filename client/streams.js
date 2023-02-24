class StreamManager {

    constructor(addon, hostURL, userToken, onready = () => { }) {
        this.addon = addon; // Should not be set in the constructor long term!
        // Should instead be automatically determined from addon dev environment.
        this.ws = null;
        this.hostURL = hostURL;
        this.userToken = userToken; // some user token to be authenticated
        this.authenticated = false;
        this.onready = onready;
        this.streams = {};

        this._initWebSocket();
    }

    startStream = (name, heartbeat = 5) => {
        // Minimum heartbeat of one beat every second
        if (heartbeat < 1) heartbeat = 1;

        if (!this._ready()) {
            console.log("Cannot start \"" + name + "\": stream manager is not ready yet.");
            return;
        }

        let stream = new Stream(this.addon, name, heartbeat, this.userToken, this.ws);
        this.streams[name] = stream;
        return stream;
    }

    _ready = () => {
        return this.ws != null && this.ws.readyState === 1 && this.authenticated;
    }

    _dataFrame = (type, stream = null, data = {}) => {
        // Build a standardized streaming packet
        return JSON.stringify({ addon: this.addon, type: type, user: this.userToken, stream: stream, data: data });
    }

    _initWebSocket = () => {
        console.log("Initializing WebSocket connection: " + this.hostURL);
        this.ws = new WebSocket(this.hostURL);
        this.authenticated = false;

        this.ws.onopen = (e) => {
            console.log("Connected to data streaming server. Authenticating...");
            this.ws.send(this._dataFrame("AUTH"));
        }

        this.ws.onmessage = (e) => {
            let data = JSON.parse(e.data);

            if (data.type === "AUTH_VALID") {
                console.log("Streaming authentication was successful! Ready to stream or listen...");
                this.authenticated = true;
                this.onready();
            } else if (data.type === "AUTH_INVALID") {
                console.log("Streaming authentication failed: invalid token. Disconnecting...");
            } else if (data.type === "STREAM_STARTED") {
                console.log("Stream \"" + data.stream + "\" started successfully");
                this.streams[data.stream].status = "STARTED";
                this.streams[data.stream].startHeartbeat();
            } else if (data.type === "STREAM_FAILED") {
                console.log("Stream \"" + data.stream + "\" failed to start: that stream name is already occupied");
                delete streams[data.stream];
            }
        }

        this.ws.onerror = (e) => {
            console.log("Failed to connect to streaming server.");
            if (this.ws.readyState === 3) {
                console.log("Trying again in 5 seconds...");
                setTimeout(this._initWebSocket, 5000);
            }
        }
    }
}

class Stream {
    _dataFrame = (type, data = {}) => {
        // Build a standardized streaming packet
        return JSON.stringify({ addon: this.addon, type: type, user: this.userToken, stream: this.name, data: data });
    }

    send = (data) => {
        if (this.status !== "STARTED") {
            console.log("Cannot send data on \"" + data.stream + "\": stream has not been started!");
            return;
        }

        this.ws.send(this._dataFrame("DATA", data));
    }

    startHeartbeat = () => {
        this.heartbeatInterval = setInterval(() => {
            this.ws.send(this._dataFrame("HEARTBEAT"));
        }, this.heartbeat * 1000);
    }

    stopHeartbeat = () => {
        if (this.heartbeatInterval != null) {
            clearInterval(this.heartbeat);
            this.heartbeatInterval = null;
        }
    }

    constructor(addon, name, heartbeat, userToken, ws) {
        this.addon = addon;
        this.name = name;
        this.heartbeat = heartbeat;
        this.status = "STARTED";
        this.userToken = userToken;
        this.ws = ws;
        this.heartbeatInterval = null;

        this.ws.send(this._dataFrame("START_STREAM"));
    }
}