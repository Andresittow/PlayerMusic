# app/main.py
import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import List, Optional
from pathlib import Path
import shutil
import sqlite3
import json

# Import our custom modules
from models import Song, SongCreate, PlaylistResponse, QueueResponse, StatusResponse
from storage import DatabaseManager
from datastructs import DoublyLinkedList, Queue

MEDIA_DIR = Path("media")
MEDIA_DIR.mkdir(exist_ok=True)

app = FastAPI(title="Music Player API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/media", StaticFiles(directory=str(MEDIA_DIR)), name="media")

# Initialize components
db_manager = DatabaseManager()
playlist = DoublyLinkedList()
queue = Queue()

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    db_manager.init_db()
    print("✅ Database initialized successfully")
    print(f"✅ Media directory: {MEDIA_DIR.absolute()}")

@app.get("/")
async def root():
    return {"message": "Music Player API is running"}

@app.get("/status", response_model=StatusResponse)
async def get_status():
    """Get server status and statistics"""
    try:
        songs = db_manager.get_all_songs()
        return StatusResponse(
            message="Server is running",
            playlist_length=playlist.size(),
            recent_count=len(songs),
            upcoming=queue.size()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting status: {str(e)}")

@app.get("/songs", response_model=List[Song])
async def get_songs():
    """Get all songs from database"""
    try:
        songs = db_manager.get_all_songs()
        return songs
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching songs: {str(e)}")

@app.post("/upload", response_model=Song)
async def upload_song(
    title: str = Form(...),
    artist: Optional[str] = Form(None),
    file: UploadFile = File(...)
):
    """Upload a new song"""
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('audio/'):
            raise HTTPException(status_code=400, detail="File must be an audio file")
        
        # Generate unique filename
        file_extension = Path(file.filename or "audio.mp3").suffix
        filename = f"{title.replace(' ', '_')}_{file.filename or 'audio'}{file_extension}"
        file_path = MEDIA_DIR / filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Create song record
        song_data = SongCreate(
            title=title,
            filename=filename,
            artist=artist
        )
        
        # Save to database
        song = db_manager.add_song(song_data)
        
        print(f"✅ Song uploaded: {song.title} by {song.artist or 'Unknown'}")
        return song
        
    except Exception as e:
        # Clean up file if database save failed
        if 'file_path' in locals() and file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail=f"Error uploading song: {str(e)}")

# Playlist endpoints
@app.get("/playlist", response_model=List[Song])
async def get_playlist():
    """Get current playlist"""
    try:
        playlist_data = playlist.to_list()
        songs = []
        for song_id in playlist_data:
            song = db_manager.get_song(song_id)
            if song:
                songs.append(song)
        return songs
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting playlist: {str(e)}")

@app.post("/playlist/add", response_model=PlaylistResponse)
async def add_to_playlist(song_data: dict):
    """Add song to playlist"""
    try:
        song_id = song_data.get("song_id")
        if not song_id:
            raise HTTPException(status_code=400, detail="song_id is required")
        
        # Verify song exists
        song = db_manager.get_song(song_id)
        if not song:
            raise HTTPException(status_code=404, detail="Song not found")
        
        playlist.append(song_id)
        
        return PlaylistResponse(
            message=f"Song '{song.title}' added to playlist",
            playlist_length=playlist.size()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding to playlist: {str(e)}")

@app.post("/playlist/next")
async def play_next():
    """Move to next song in playlist"""
    try:
        if playlist.size() == 0:
            raise HTTPException(status_code=400, detail="Playlist is empty")
        
        next_song_id = playlist.next()
        if next_song_id is None:
            raise HTTPException(status_code=400, detail="No next song available")
        
        return {"message": "Moved to next song", "song_id": next_song_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error playing next: {str(e)}")

@app.post("/playlist/prev")
async def play_previous():
    """Move to previous song in playlist"""
    try:
        if playlist.size() == 0:
            raise HTTPException(status_code=400, detail="Playlist is empty")
        
        prev_song_id = playlist.prev()
        if prev_song_id is None:
            raise HTTPException(status_code=400, detail="No previous song available")
        
        return {"message": "Moved to previous song", "song_id": prev_song_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error playing previous: {str(e)}")

# Queue endpoints
@app.post("/queue/enqueue", response_model=QueueResponse)
async def enqueue_song(song_data: dict):
    """Add song to queue"""
    try:
        song_id = song_data.get("song_id")
        if not song_id:
            raise HTTPException(status_code=400, detail="song_id is required")
        
        # Verify song exists
        song = db_manager.get_song(song_id)
        if not song:
            raise HTTPException(status_code=404, detail="Song not found")
        
        queue.enqueue(song_id)
        
        return QueueResponse(
            message=f"Song '{song.title}' added to queue",
            queue_size=queue.size()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding to queue: {str(e)}")

@app.post("/queue/dequeue")
async def dequeue_song():
    """Remove and return next song from queue"""
    try:
        if queue.is_empty():
            raise HTTPException(status_code=400, detail="Queue is empty")
        
        song_id = queue.dequeue()
        return {"message": "Song dequeued", "song_id": song_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error dequeuing song: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
