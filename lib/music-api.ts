// API client for FastAPI backend
const API_BASE_URL = "/api"

export interface Song {
  id: number
  title: string
  filename: string
  artist?: string
  duration?: number
}

export interface ApiResponse<T> {
  data?: T
  message?: string
  error?: string
}

class MusicAPI {
  async testConnection(): Promise<boolean> {
    try {
      console.log(" Testing backend connection...")
      const response = await fetch(`${API_BASE_URL}/status`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      })

      if (response.ok) {
        console.log(" Backend connection successful")
        return true
      } else {
        console.error(" Backend responded with error:", response.status)
        return false
      }
    } catch (error) {
      console.error(" Backend connection failed:", error)
      return false
    }
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      // Correct endpoint construction to avoid double /api/api
      const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`
      console.log(` Making request to: ${API_BASE_URL}${path}`)

      const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log(` Request successful for ${endpoint}:`, data)
      return data
    } catch (error) {
      console.error(` API request failed for ${endpoint}:`, error)
      throw error
    }
  }

  // Song management
  async getSongs(): Promise<Song[]> {
    return this.request<Song[]>("/songs")
  }

  async uploadSong(title: string, file: File, artist?: string): Promise<Song> {
    console.log(" Starting upload:", { title, artist, fileName: file.name })

    const formData = new FormData()
    formData.append("title", title)
    formData.append("file", file)
    if (artist) {
      formData.append("artist", artist)
    }

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(" Upload failed:", response.status, errorText)
        throw new Error(`Upload failed: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      console.log(" Upload successful:", result)
      return result
    } catch (error) {
      console.error(" Upload error:", error)
      throw error
    }
  }

  // Playlist management using DoublyLinkedList
  async addToPlaylist(songId: number): Promise<{ message: string; playlist_length: number }> {
    return this.request("/playlist/add", {
      method: "POST",
      body: JSON.stringify({ song_id: songId }),
    })
  }

  async getPlaylist(): Promise<Song[]> {
    return this.request<Song[]>("/playlist")
  }

  async playNext(): Promise<{ message: string; song_id: number }> {
    return this.request("/playlist/next", { method: "POST" })
  }

  async playPrev(): Promise<{ message: string; song_id: number }> {
    return this.request("/playlist/prev", { method: "POST" })
  }

  // Queue management
  async enqueueSong(songId: number): Promise<{ message: string; queue_size: number }> {
    return this.request("/queue/enqueue", {
      method: "POST",
      body: JSON.stringify({ song_id: songId }),
    })
  }

  async dequeueSong(): Promise<{ message: string; song_id: number }> {
    return this.request("/queue/dequeue", { method: "POST" })
  }

  // Server status
  async getStatus(): Promise<{
    message: string
    playlist_length: number
    recent_count: number
    upcoming: number
  }> {
    return this.request("/status")
  }

  // Media serving
  getMediaUrl(filename: string): string {
    // If it's already a full URL (Pixabay, Bensound, etc), return it directly
    if (filename.startsWith("http")) {
      return filename
    }
    return `${API_BASE_URL}/media/${filename}`
  }
}

export const musicAPI = new MusicAPI()
