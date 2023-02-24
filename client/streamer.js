let myStream = null;

// eg. start up a stream as soon as the manager connects
const onready = () => {
    myStream = sm.startStream("MyStream");
}

// Each client only needs one stream manager to start, write to, and listen to multiple streams.
const sm = new StreamManager("MyAddon", "ws://localhost:8000/ws/stream", "someToken", onready);