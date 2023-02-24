from django.urls import path

from streams.consumers import *

websocket_urlpatterns = [
    path("ws/stream", StreamConsumer.as_asgi()),
]