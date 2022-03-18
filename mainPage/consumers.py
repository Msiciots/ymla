from channels.generic.websocket import WebsocketConsumer,JsonWebsocketConsumer
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import async_to_sync

import json

import random


class WSConsumer(AsyncWebsocketConsumer):
# class WSConsumer(JsonWebsocketConsumer):
    async def connect(self):
        key = int(random.getrandbits(24))
        print('inside EventConsumer connect()',str(key))

        # async_to_sync(self.channel_layer.group_add)(
            # # str(key),
            # '1234',
            # self.channel_name
        # )
        await self.channel_layer.group_add(
            str(key),
            # '1234',
            self.channel_name
        )
        
        await self.accept()
        await self.send(json.dumps({'key':key}))
        # await self.send_json({
            # 'key':key,
        # })

    
    async def log_message(self, data):
        # print('inside EventConsumer events_alarm()')
        # print(event['content'])
        await self.send(json.dumps({'log':data['log']}))
