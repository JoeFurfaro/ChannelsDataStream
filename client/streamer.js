let myStream = null;

const onready = () => {
    myStream = sm.startStream("MyStream");
}

const sm = new StreamManager("MyAddon", "ws://localhost:8000/ws/stream", "someToken", onready);