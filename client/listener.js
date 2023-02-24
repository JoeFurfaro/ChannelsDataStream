let myStream = null;

// eg. listen to a stream as soon as the manager connects
const onready = () => {
    sm.listenTo("MyAddon", "MyStream", (data) => {
        // Do something with each dataframe coming from the stream
        console.log(data);
    });
}

// Each client only needs one stream manager to start, write to, and listen to multiple streams
const sm = new StreamManager("MyAddon", "ws://localhost:8000/ws/stream", "someToken", onready);