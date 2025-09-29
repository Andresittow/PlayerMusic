# app/storage.py
import os
import sqlite3
from typing import List, Optional
from models import SongMeta, Song, SongCreate
from datastructs import DoublyLinkedList

DB_PATH = os.path.join(os.path.dirname(__file__), "songs.db")
MEDIA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "media")

os.makedirs(MEDIA_DIR, exist_ok=True)

class DatabaseManager:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        
    def get_connection(self):
        """Get database connection with proper configuration"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Enable dict-like access
        return conn
    
    def init_db(self):
        """Initialize database with songs table"""
        try:
            with self.get_connection() as conn:
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS songs (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        title TEXT NOT NULL,
                        filename TEXT NOT NULL UNIQUE,
                        artist TEXT,
                        duration INTEGER
                    )
                """)
                conn.commit()
                print("✅ Database tables created successfully")
        except Exception as e:
            print(f"❌ Error initializing database: {e}")
            raise
    
    def add_song(self, song_data: SongCreate) -> Song:
        """Add a new song to the database"""
        try:
            with self.get_connection() as conn:
                cursor = conn.execute(
                    "INSERT INTO songs (title, filename, artist, duration) VALUES (?, ?, ?, ?)",
                    (song_data.title, song_data.filename, song_data.artist, song_data.duration)
                )
                song_id = cursor.lastrowid
                conn.commit()
                
                return Song(
                    id=song_id,
                    title=song_data.title,
                    filename=song_data.filename,
                    artist=song_data.artist,
                    duration=song_data.duration
                )
        except sqlite3.IntegrityError:
            raise ValueError(f"Song with filename '{song_data.filename}' already exists")
        except Exception as e:
            print(f"❌ Error adding song: {e}")
            raise
    
    def get_song(self, song_id: int) -> Optional[Song]:
        """Get a song by ID"""
        try:
            with self.get_connection() as conn:
                row = conn.execute("SELECT * FROM songs WHERE id = ?", (song_id,)).fetchone()
                if row:
                    return Song(
                        id=row["id"],
                        title=row["title"],
                        filename=row["filename"],
                        artist=row["artist"],
                        duration=row["duration"]
                    )
                return None
        except Exception as e:
            print(f"❌ Error getting song: {e}")
            raise
    
    def get_all_songs(self) -> List[Song]:
        """Get all songs from database"""
        try:
            with self.get_connection() as conn:
                rows = conn.execute("SELECT * FROM songs ORDER BY title").fetchall()
                return [
                    Song(
                        id=row["id"],
                        title=row["title"],
                        filename=row["filename"],
                        artist=row["artist"],
                        duration=row["duration"]
                    )
                    for row in rows
                ]
        except Exception as e:
            print(f"❌ Error getting all songs: {e}")
            raise
    
    def delete_song(self, song_id: int) -> bool:
        """Delete a song from database"""
        try:
            with self.get_connection() as conn:
                cursor = conn.execute("DELETE FROM songs WHERE id = ?", (song_id,))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            print(f"❌ Error deleting song: {e}")
            raise

# In-memory playlist (DoublyLinkedList of SongMeta.id)
PLAYLIST = DoublyLinkedList()

# Initialize the database
db_manager = DatabaseManager()
db_manager.init_db()
