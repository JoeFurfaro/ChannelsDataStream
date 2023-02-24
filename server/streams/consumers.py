import json
import time

from channels.generic.websocket import WebsocketConsumer

class StreamConsumer(WebsocketConsumer):

    def connect(self):
        self.accept()
        self.user = None

    def disconnect(self, close_code):
        pass

    def receive(self, text_data):
        try:
            data = json.loads(text_data)
            if self.user == None:
                if data["type"] == "AUTH":
                    # Authenticate user somehow using the data["user"] token
                    if type(data["user"]) == str and len(data["user"]) > 0:
                        self.user = data["user"]
                        self.send(self._dataFrame("AUTH_VALID"))
                    else:
                        self.send(self._dataFrame("AUTH_INVALID"))
                        self.close()
                else:
                    self.close()
            else:
                # User is already authenticated
                if data["type"] == "START_STREAM":
                    self.send(self._dataFrame("STREAM_STARTED", stream=data["stream"]))
                elif data["type"] == "HEARTBEAT":
                    # Heartbeat received, do something with it
                    beatTime = time.time()

        except Exception as e:
            print(e)
            self.close()

    def _dataFrame(self, type, stream=None, data={}):
        return json.dumps({"type": type, "stream": stream, "data": data})