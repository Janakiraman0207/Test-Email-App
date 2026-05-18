import json
import asyncio
from typing import List, Dict, Tuple
from fastapi import WebSocket
from fastapi.encoders import jsonable_encoder
import redis.asyncio as redis
from django.db import transaction
from django.utils import timezone
from asgiref.sync import sync_to_async
from django.contrib.auth import get_user_model
from django_backend.models import UserProfile, UserChatSettings

User = get_user_model()
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[tuple[int, WebSocket]]] = {}
        self.user_connection_counts: Dict[int, int] = {} 
        self.user_sockets: Dict[int, List[WebSocket]] = {} 
        self.active_room_users: Dict[int, set] = {}


    async def connect(self, websocket: WebSocket, room_id: int, user_id: int):
        await websocket.accept()

        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append((user_id, websocket))

        if user_id not in self.user_sockets:
            self.user_sockets[user_id] = []
        self.user_sockets[user_id].append(websocket)
        
        if room_id not in self.active_room_users:
            self.active_room_users[room_id] = set()
        self.active_room_users[room_id].add(user_id)

        current_count = self.user_connection_counts.get(user_id, 0)
        self.user_connection_counts[user_id] = current_count + 1
        
        if current_count == 0:
            print(f"Syncing Status: User {user_id} is now ONLINE in DB")
            await self.update_user_presence(user_id, True)

            settings, _ = await sync_to_async(UserChatSettings.objects.get_or_create)(user_id=user_id)
            if settings.show_last_seen:
                await self.broadcast_to_all({
                    "type": "USER_STATUS",
                    "user_id": user_id,
                    "status": "online",
                    "timestamp": str(timezone.now())
                })
 
    async def disconnect(self, websocket: WebSocket, room_id: int, user_id: int):
        if room_id in self.active_connections:
            self.active_connections[room_id] = [
                conn for conn in self.active_connections[room_id] if conn[1] != websocket
            ]
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

        if user_id in self.user_sockets:
            if websocket in self.user_sockets[user_id]:
                self.user_sockets[user_id].remove(websocket)
            if not self.user_sockets[user_id]:
                del self.user_sockets[user_id]

        is_still_in_room = any(conn[0] == user_id for conn in self.active_connections.get(room_id, []))
        if not is_still_in_room and room_id in self.active_room_users:
            self.active_room_users[room_id].discard(user_id)
            if not self.active_room_users[room_id]:
                del self.active_room_users[room_id]

        if user_id in self.user_connection_counts:
            self.user_connection_counts[user_id] -= 1
            if self.user_connection_counts[user_id] <= 0:
                del self.user_connection_counts[user_id]
                await self.update_user_presence(user_id, False)

                settings, _ = await sync_to_async(UserChatSettings.objects.get_or_create)(user_id=user_id)
                if settings.show_last_seen:
                    await self.broadcast_to_all({
                        "type": "USER_STATUS",
                        "user_id": user_id,
                        "status": "offline",
                        "last_seen": str(timezone.now())
                    })
                    
    @sync_to_async
    def update_user_presence(self, user_id: int, is_online: bool):
        try:
            with transaction.atomic():
                updated_count = UserProfile.objects.filter(user_id=user_id).update(
                    is_online=is_online,
                    last_seen=timezone.now()
                )
        
                if updated_count == 0 and is_online:
                    UserProfile.objects.get_or_create(user_id=user_id, defaults={'is_online': True})
                    
            print(f"DB Hard-Saved: User {user_id} status is {is_online}")        
            
        except Exception as e:
            print(f"Error updating presence for {user_id}: {e}")
        
    async def broadcast(self, message: dict, room_id: int):
        if room_id not in self.active_connections:
            return
        
        for recipient_user_id, connection in self.active_connections[room_id]:
            try:
                settings, _ = await sync_to_async(UserChatSettings.objects.get_or_create)(
                    user_id=recipient_user_id
                )
                
                personalized_message = message.copy()
                msg_type = str(message.get("type", "")).upper()
            
                if msg_type in ["NEW_MESSAGE", "MESSAGE_NEW"]:
                    personalized_message["play_sound"] = settings.chat_sounds_enabled
                    
                await connection.send_json(jsonable_encoder(personalized_message))
                
            except Exception as e:
                print(f" WebSocket Send Error to user {recipient_user_id}: {e}")               

    async def broadcast_to_user(self, user_id: int, message: dict):
        
        if user_id in self.user_sockets:
            for connection in self.user_sockets[user_id][:]:
                try:
                    await connection.send_json(jsonable_encoder(message))
                except Exception:
                    pass
    
    async def broadcast_to_all(self, message: dict):
        
        safe_message = jsonable_encoder(message)
        for room_id, connections in list(self.active_connections.items()):
            for _, connection in connections:  
                try:
                    await connection.send_json(safe_message)
                except Exception:
                    pass

    async def send_personal_message(self, user_id: int, message: dict):
        if user_id in self.user_sockets:
            for connection in self.user_sockets[user_id][:]:
                try:
                    await connection.send_json(message)
                except:
                    pass
                
    def get_online_users(self) -> List[int]:
        
        return list(self.user_connection_counts.keys())
    
    async def start_redis_listener(self):
        
        print(" Redis Listener Started...")
        r = redis.from_url("redis://localhost:6379/0", decode_responses=True)
        pubsub = r.pubsub()
        
        try:
            await pubsub.subscribe("status_updates")
            async for message in pubsub.listen():
                if message["type"] == "message":
                    try:
                        data = json.loads(message["data"])
                        await self.broadcast_to_all(data)
                    except Exception as e:
                        print(f" Error broadcasting redis message: {e}")
        finally:
            await pubsub.unsubscribe("status_updates")
            await r.close()

manager = ConnectionManager()
    