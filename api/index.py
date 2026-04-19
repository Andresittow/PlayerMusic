from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="Vibes Music API (Demo Mode)")

# No CORS needed in same-origin Vercel, but keeping for local dev flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Song(BaseModel):
    id: int
    title: str
    filename: str
    artist: Optional[str] = None
    duration: Optional[int] = None

# Mock Data - Stateless demo
DEMO_SONGS = [
    {
        "id": 1,
        "title": "Acoustic Breeze",
        "artist": "Bensound",
        "filename": "https://www.bensound.com/bensound-music/bensound-acousticbreeze.mp3",
        "duration": 150
    },
    {
        "id": 2,
        "title": "Corporate Elevator",
        "artist": "Royalty Free",
        "filename": "https://www.bensound.com/bensound-music/bensound-corporate.mp3",
        "duration": 180
    },
    {
        "id": 3,
        "title": "Epic Journey",
        "artist": "Cinematic",
        "filename": "https://www.bensound.com/bensound-music/bensound-epic.mp3",
        "duration": 210
    }
]

@app.get("/api/status")
async def status():
    return {
        "status": "online",
        "mode": "demo",
        "message": "PlayerMusic API is running on Vercel"
    }

@app.get("/api/songs", response_model=List[Song])
async def get_songs():
    return DEMO_SONGS

@app.get("/api/playlist", response_model=List[Song])
async def get_playlist():
    return DEMO_SONGS

@app.post("/api/playlist/add")
async def add_to_playlist():
    return {"message": "Playlist is read-only in demo mode", "playlist_length": len(DEMO_SONGS)}

@app.post("/api/upload")
async def upload_song():
    raise HTTPException(status_code=403, detail="Upload disabled in demo mode")

# For local testing
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
