const sm = new StreamManager("ws://localhost:8000/ws/stream", "anotherToken");

const myStream = sm.listenTo("MyStream");