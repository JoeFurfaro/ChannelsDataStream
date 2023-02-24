import json
import time

from channels.generic.websocket import WebsocketConsumer

# MAKE SURE TABLE OF STREAMS IS EMPTIED WHEN FACTORYENGINE STARTS
class StreamConsumer(WebsocketConsumer):

    def connect(self):
        self.accept()
        self.user = None

    def disconnect(self, close_code):
        # To cleanly-stop a stream, the streamer can simply close their socket

        # Remove any streams started by this consumer from database
        # Alert listeners that the stream has ended/streamer disconnected
        # Remove channel groups created for streams this consumer created

        # ^^^ Same stuff should happen if heartbeat check fails ^^^
        pass

    def receive(self, text_data):
        try:
            data = json.loads(text_data)
            if self.user == None:
                if data["type"] == "AUTH":
                    # Authenticate user somehow using the data["user"] token (probably FE user/device JWT)
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
                    # Query database to see if a stream with this name is already live in this addon
                    # If it is not, create the stream in the database and notify the client
                    # Also start a repeating task to check if heartbeats have been missed
                    # to detect silent disconnect for this stream
                    # Also, create a channel group for listeners of this stream
                    self.send(self._dataFrame("STREAM_STARTED", addon=data["addon"], stream=data["stream"]))
                    # If it is, send STREAM_FAILED frame to let client know the name is taken
                elif data["type"] == "HEARTBEAT":
                    # Heartbeat received, store the time it was receieved somewhere eg.
                    beatTime = time.time()
                elif data["type"] == "DATA":
                    # Send the dataframe to all members of the channel group of listeners
                    pass
                elif data["type"] == "LISTEN":
                    # Add the user to the listeners channel group for the stream in data["stream"]
                    # This will allow them to receive future streamed datapoints
                     self.send(self._dataFrame("LISTENING", addon=data["addon"], stream=data["stream"]))
                elif data["type"] == "STOP_LISTENING":
                    # Remove the user from the listeners channel group for the stream in data["stream"]
                     self.send(self._dataFrame("NOT_LISTENING", addon=data["addon"], stream=data["stream"]))

        except Exception as e:
            print(e)
            self.close()

    def _dataFrame(self, type, stream=None, data={}):
        return json.dumps({"type": type, addon: None, "stream": stream, "data": data})