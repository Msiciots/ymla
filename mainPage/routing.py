
from django.conf.urls import url
from .consumers import WSConsumer

# from django.urls import path

ws_urlpatterns = [

        url(r'ws/connect/', WSConsumer.as_asgi())
]
