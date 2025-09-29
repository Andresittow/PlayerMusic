# app/models.py
from pydantic import BaseModel
from typing import Optional, List

class SongMeta(BaseModel):
    id: int
    title: str
    filename: str
    artist: Optional[str] = None
    duration: Optional[int] = None  # seconds, optional

class SongCreate(BaseModel):
    title: str
    filename: str
    artist: Optional[str] = None
    duration: Optional[int] = None

class Song(BaseModel):
    id: int
    title: str
    filename: str
    artist: Optional[str] = None
    duration: Optional[int] = None

class PlaylistResponse(BaseModel):
    message: str
    playlist_length: int

class QueueResponse(BaseModel):
    message: str
    queue_size: int

class StatusResponse(BaseModel):
    message: str
    playlist_length: int
    recent_count: int
    upcoming: int
