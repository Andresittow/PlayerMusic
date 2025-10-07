# app/main.py
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from typing import List, Optional
import shutil

from models import Song, SongCreate
from storage import DatabaseManager

MEDIA_DIR = Path("media")
MEDIA_DIR.mkdir(exist_ok=True)

app = FastAPI(title="Vibes Music API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/media", StaticFiles(directory=str(MEDIA_DIR)), name="media")

db_manager = DatabaseManager()

@app.on_event("startup")
async def startup_event():
    db_manager.init_db()
    print("✅ Database initialized successfully")

@app.get("/")
async def root():
    return {"message": "Vibes Music API is running"}

@app.get("/songs", response_model=List[Song])
async def get_songs():
    """Get all songs from database"""
    try:
        return db_manager.get_all_songs()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload", response_model=Song)
async def upload_song(
    title: str = Form(...),
    artist: Optional[str] = Form(None),
    file: UploadFile = File(...)
):
    """Upload a new song"""
    try:
        if not file.content_type or not file.content_type.startswith("audio/"):
            raise HTTPException(status_code=400, detail="File must be an audio file")

        filename = f"{title.replace(' ', '_')}_{file.filename}"
        file_path = MEDIA_DIR / filename

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        song_data = SongCreate(title=title, filename=filename, artist=artist)
        song = db_manager.add_song(song_data)

        print(f"✅ Song uploaded: {song.title}")
        return song

    except Exception as e:
        if "file_path" in locals() and file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/status")
async def status():
    return {
        "message": "Server running",
        "playlist_length": 0,
        "recent_count": len(db_manager.get_all_songs()),
        "upcoming": 0
    }

@app.get("/playlist")
async def get_playlist():
    return db_manager.get_all_songs()

@app.post("/playlist/add")
async def add_to_playlist(song_data: dict):
    return {"message": "Playlist feature simulated", "playlist_length": 0}

@app.post("/playlist/next")
async def play_next():
    return {"message": "Next song simulated", "song_id": None}

@app.post("/playlist/prev")
async def play_prev():
    return {"message": "Previous song simulated", "song_id": None}

@app.post("/queue/enqueue")
async def enqueue_song(song_data: dict):
    return {"message": "Queue feature simulated", "queue_size": 0}

@app.post("/queue/dequeue")
async def dequeue_song():
    return {"message": "Queue dequeue simulated", "song_id": None}

