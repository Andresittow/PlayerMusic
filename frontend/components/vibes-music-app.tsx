"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Heart,
  Search,
  Plus,
  Music,
  Users,
  List,
  Upload,
  User,
  MoreHorizontal,
  Edit,
  Trash2,
  ListPlus,
  AlertCircle,
  Wifi,
  WifiOff,
} from "lucide-react"
import { PlaylistDialog } from "@/components/playlist-dialog"
import { AddToPlaylistDialog } from "@/components/add-to-playlist-dialog"
import { UploadDialog } from "@/components/upload-dialog"
import { musicAPI, type Song as APISong } from "@/lib/music-api"
import { DoublyLinkedList, type Song as DLLSong } from "@/lib/doubly-linked-list"

interface Song {
  id: number
  title: string
  artist: string
  filename: string
  duration?: number
  is_favorite?: boolean
}

interface Playlist {
  id: number
  name: string
  songs: Song[]
  color: string
}

export function VibesMusicApp() {
  const [songs, setSongs] = useState<Song[]>([])
  const [songsList, setSongsList] = useState<DoublyLinkedList>(new DoublyLinkedList())
  const [playlists, setPlaylists] = useState<Playlist[]>([
    { id: 1, name: "Playlist 1", songs: [], color: "bg-blue-500" },
    { id: 2, name: "Playlist 2", songs: [], color: "bg-green-500" },
    { id: 3, name: "Playlist 3", songs: [], color: "bg-teal-500" },
    { id: 4, name: "Favorites", songs: [], color: "bg-emerald-500" },
  ])
  const [currentView, setCurrentView] = useState<"home" | "library" | "playlist">("home")
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)
  const [currentSong, setCurrentSong] = useState<Song | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState([75])
  const [searchQuery, setSearchQuery] = useState("")
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [likedSongs, setLikedSongs] = useState<Song[]>([])

  // Backend connection state
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dialog states
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false)
  const [editingPlaylist, setEditingPlaylist] = useState<{ id: number; name: string; color: string } | null>(null)
  const [addToPlaylistDialogOpen, setAddToPlaylistDialogOpen] = useState(false)
  const [selectedSongForPlaylist, setSelectedSongForPlaylist] = useState<Song | null>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

  // Audio element for playback
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)

  const convertToDLLSong = (song: Song): DLLSong => ({
    id: song.id.toString(),
    title: song.title,
    artist: song.artist,
    album: "Unknown Album", // Default value
    duration: song.duration || 0,
    cover: "/abstract-soundscape.png",
    url: song.filename,
    liked: song.is_favorite || false,
  })

  useEffect(() => {
    if (songs.length > 0) {
      const newList = new DoublyLinkedList()
      const dllSongs = songs.map(convertToDLLSong)
      newList.fromArray(dllSongs)
      setSongsList(newList)
      console.log("[v0] Doubly linked list updated with", songs.length, "songs")
    }
  }, [songs])

  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Test backend connection
        const connected = await musicAPI.testConnection()
        setIsConnected(connected)

        if (connected) {
          // Load songs from backend
          const backendSongs = await musicAPI.getSongs()
          const formattedSongs: Song[] = backendSongs.map((song: APISong) => ({
            id: song.id,
            title: song.title,
            artist: song.artist || "Unknown Artist",
            filename: song.filename,
            duration: song.duration,
            is_favorite: false,
          }))
          setSongs(formattedSongs)
        } else {
          // Use mock data if backend is not available
          const mockSongs: Song[] = [
            { id: 1, title: "Midnight Dreams", artist: "Luna Eclipse", filename: "midnight.mp3", duration: 240 },
            { id: 2, title: "Neon Lights", artist: "Cyber Wave", filename: "neon.mp3", duration: 195 },
            { id: 3, title: "Ocean Breeze", artist: "Coastal Vibes", filename: "ocean.mp3", duration: 280 },
            { id: 4, title: "Electric Soul", artist: "Voltage", filename: "electric.mp3", duration: 220 },
          ]
          setSongs(mockSongs)
          setError("Backend not connected. Using demo data.")
        }
      } catch (err) {
        console.error("Failed to initialize app:", err)
        setError("Failed to connect to backend. Please check if the server is running.")
        setIsConnected(false)
      } finally {
        setIsLoading(false)
      }
    }

    initializeApp()
  }, [])

  useEffect(() => {
    const audio = new Audio()
    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration)
    })
    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime)
    })
    setAudioElement(audio)

    return () => {
      audio.pause()
      audio.src = ""
    }
  }, []) // Keep empty dependency array to avoid recreating audio element

  useEffect(() => {
    if (!audioElement) return

    const handleSongEnded = () => {
      console.log("[v0] Song ended event triggered")
      console.log("[v0] Current song:", currentSong?.title)
      console.log("[v0] Songs list size:", songsList.size)
      setIsPlaying(false)

      if (songsList.size > 1) {
        console.log("[v0] Attempting to play next song...")
        const nextDLLSong = songsList.next()
        if (nextDLLSong) {
          const nextSong = songs.find((s) => s.id.toString() === nextDLLSong.id)
          if (nextSong) {
            console.log("[v0] Auto-playing next song:", nextSong.title)
            handleSongSelect(nextSong)
          } else {
            console.warn("[v0] Next song not found in songs array")
          }
        } else {
          console.warn("[v0] No next song available in doubly linked list")
        }
      } else {
        console.log("[v0] Only one song or empty list, not auto-playing")
      }
    }

    audioElement.addEventListener("ended", handleSongEnded)

    return () => {
      audioElement.removeEventListener("ended", handleSongEnded)
    }
  }, [audioElement, currentSong, songsList, songs]) // Include all dependencies used in the event handler

  const handlePlayPause = async () => {
    if (!audioElement || !currentSong) return

    if (isPlaying) {
      audioElement.pause()
    } else {
      if (isConnected) {
        audioElement.src = musicAPI.getMediaUrl(currentSong.filename)
      }
      try {
        await audioElement.play()
      } catch (error) {
        console.error("Play failed:", error)
      }
    }
    setIsPlaying(!isPlaying)
  }

  const handleSongSelect = async (song: Song) => {
    console.log("[v0] Song selected:", song.title)
    setCurrentSong(song)

    const dllSong = convertToDLLSong(song)
    songsList.setCurrentById(dllSong.id)
    console.log("[v0] Current song set in doubly linked list:", songsList.getCurrentSong()?.title)

    if (audioElement) {
      audioElement.pause()
      if (isConnected) {
        audioElement.src = musicAPI.getMediaUrl(song.filename)
        console.log("[v0] Audio source set:", audioElement.src)
      }
      setCurrentTime(0)

      try {
        await audioElement.play()
        setIsPlaying(true)
        console.log("[v0] Song started playing automatically")
      } catch (error) {
        console.error("[v0] Auto-play failed:", error)
        setIsPlaying(false)
      }
    }

    // Add to backend playlist if connected
    if (isConnected) {
      try {
        await musicAPI.addToPlaylist(song.id)
        console.log("[v0] Song added to backend playlist")
      } catch (error) {
        console.error("[v0] Failed to add to backend playlist:", error)
      }
    }
  }

  const handlePlaylistClick = (playlist: Playlist) => {
    setSelectedPlaylist(playlist)
    setCurrentView("playlist")
  }

  const handleCreatePlaylist = (name: string, color: string) => {
    const newPlaylist: Playlist = {
      id: Date.now(),
      name,
      songs: [],
      color,
    }
    setPlaylists((prev) => [...prev, newPlaylist])
  }

  const handleEditPlaylist = (id: number, name: string, color: string) => {
    setPlaylists((prev) => prev.map((playlist) => (playlist.id === id ? { ...playlist, name, color } : playlist)))
    if (selectedPlaylist?.id === id) {
      setSelectedPlaylist((prev) => (prev ? { ...prev, name, color } : null))
    }
    setEditingPlaylist(null)
  }

  const handleDeletePlaylist = (id: number) => {
    setPlaylists((prev) => prev.filter((playlist) => playlist.id !== id))
    if (selectedPlaylist?.id === id) {
      setSelectedPlaylist(null)
      setCurrentView("home")
    }
  }

  const handleAddToPlaylist = (playlistId: number, song: Song, position?: "start" | "end" | number) => {
    setPlaylists((prev) =>
      prev.map((playlist) => {
        if (playlist.id !== playlistId) return playlist

        // Check if song already exists
        if (playlist.songs.some((s) => s.id === song.id)) {
          return playlist
        }

        let newSongs = [...playlist.songs]

        if (position === "start") {
          // Add to beginning using prepend logic
          newSongs = [song, ...playlist.songs]
          console.log("[v0] Added song to start of playlist:", song.title)
        } else if (position === "end" || position === undefined) {
          // Add to end using append logic
          newSongs = [...playlist.songs, song]
          console.log("[v0] Added song to end of playlist:", song.title)
        } else if (typeof position === "number") {
          // Add to specific position using insertAt logic
          const index = Math.max(0, Math.min(position - 1, playlist.songs.length))
          newSongs = [...playlist.songs.slice(0, index), song, ...playlist.songs.slice(index)]
          console.log("[v0] Added song to position", position, "in playlist:", song.title)
        }

        return { ...playlist, songs: newSongs }
      }),
    )
  }

  const handleRemoveFromPlaylist = (playlistId: number, songId: number) => {
    setPlaylists((prev) =>
      prev.map((playlist) =>
        playlist.id === playlistId
          ? { ...playlist, songs: playlist.songs.filter((song) => song.id !== songId) }
          : playlist,
      ),
    )
    if (selectedPlaylist?.id === playlistId) {
      setSelectedPlaylist((prev) => (prev ? { ...prev, songs: prev.songs.filter((song) => song.id !== songId) } : null))
    }
  }

  const handleUploadComplete = async (uploadedFiles: { file: File; title: string; artist: string }[]) => {
    if (!isConnected) {
      setError("Cannot upload files: Backend not connected")
      return
    }

    const newSongs: Song[] = []

    for (const { file, title, artist } of uploadedFiles) {
      try {
        const uploadedSong = await musicAPI.uploadSong(title, file, artist)
        const formattedSong: Song = {
          id: uploadedSong.id,
          title: uploadedSong.title,
          artist: uploadedSong.artist || artist,
          filename: uploadedSong.filename,
          duration: uploadedSong.duration,
          is_favorite: false,
        }
        newSongs.push(formattedSong)
      } catch (error) {
        console.error("Upload failed for", title, error)
        setError(`Failed to upload "${title}". Please try again.`)
      }
    }

    if (newSongs.length > 0) {
      setSongs((prev) => [...prev, ...newSongs])
      setUploadDialogOpen(false)
      setError(null)

      if (newSongs.length === 1) {
        console.log("[v0] Auto-playing uploaded song:", newSongs[0].title)
        await handleSongSelect(newSongs[0])
      }
    }
  }

  const openAddToPlaylistDialog = (song: Song) => {
    setSelectedSongForPlaylist(song)
    setAddToPlaylistDialogOpen(true)
  }

  const handleToggleFavorite = async (song: Song) => {
    console.log("[v0] Toggling favorite for:", song.title)

    const updatedSong = { ...song, is_favorite: !song.is_favorite }

    setSongs((prev) => prev.map((s) => (s.id === song.id ? updatedSong : s)))

    if (updatedSong.is_favorite) {
      setLikedSongs((prev) => {
        if (!prev.some((s) => s.id === song.id)) {
          return [...prev, updatedSong]
        }
        return prev
      })
      const favoritesPlaylist = playlists.find((p) => p.name === "Favorites")
      if (favoritesPlaylist) {
        handleAddToPlaylist(favoritesPlaylist.id, updatedSong)
      }
    } else {
      setLikedSongs((prev) => prev.filter((s) => s.id !== song.id))
      const favoritesPlaylist = playlists.find((p) => p.name === "Favorites")
      if (favoritesPlaylist) {
        handleRemoveFromPlaylist(favoritesPlaylist.id, song.id)
      }
    }

    setPlaylists((prev) =>
      prev.map((playlist) => ({
        ...playlist,
        songs: playlist.songs.map((s) => (s.id === song.id ? updatedSong : s)),
      })),
    )

    if (currentSong?.id === song.id) {
      setCurrentSong(updatedSong)
    }
  }

  const handleNavigateToSongs = () => {
    console.log("[v0] Navigating to Songs view")
    setCurrentView("library") // For now, redirect to library - could be expanded to show artists grouped view
    setSearchQuery("") // Clear search to show all songs
  }

  const testConnectionManually = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const connected = await musicAPI.testConnection()
      setIsConnected(connected)
      if (!connected) {
        setError("Backend not connected. Using demo data.")
      }
    } catch (err) {
      console.error("Failed to test connection:", err)
      setError("Failed to connect to backend. Please check if the server is running.")
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkipNext = async () => {
    console.log("[v0] Skip next requested - using doubly linked list")
    console.log("[v0] Current songs list size:", songsList.size)

    if (songsList.isEmpty()) {
      console.log("[v0] Songs list is empty")
      return
    }

    const nextDLLSong = songsList.next()
    console.log("[v0] Next DLL song:", nextDLLSong?.title)

    if (nextDLLSong) {
      const nextSong = songs.find((s) => s.id.toString() === nextDLLSong.id)
      if (nextSong) {
        console.log("[v0] Playing next song from doubly linked list:", nextSong.title)
        await handleSongSelect(nextSong)
      } else {
        console.warn("[v0] Next song not found in songs array")
        console.log(
          "[v0] Available song IDs:",
          songs.map((s) => s.id.toString()),
        )
        console.log("[v0] Looking for ID:", nextDLLSong.id)
      }
    } else {
      console.warn("[v0] No next song available in doubly linked list")
    }
  }

  const handleSkipPrev = async () => {
    console.log("[v0] Skip previous requested - using doubly linked list")
    console.log("[v0] Current songs list size:", songsList.size)

    if (songsList.isEmpty()) {
      console.log("[v0] Songs list is empty")
      return
    }

    const prevDLLSong = songsList.previous()
    console.log("[v0] Previous DLL song:", prevDLLSong?.title)

    if (prevDLLSong) {
      const prevSong = songs.find((s) => s.id.toString() === prevDLLSong.id)
      if (prevSong) {
        console.log("[v0] Playing previous song from doubly linked list:", prevSong.title)
        await handleSongSelect(prevSong)
      } else {
        console.warn("[v0] Previous song not found in songs array")
        console.log(
          "[v0] Available song IDs:",
          songs.map((s) => s.id.toString()),
        )
        console.log("[v0] Looking for ID:", prevDLLSong.id)
      }
    } else {
      console.warn("[v0] No previous song available in doubly linked list")
    }
  }

  const handleSeek = (value: number[]) => {
    if (audioElement && duration > 0) {
      audioElement.currentTime = (value[0] / 100) * duration
    }
  }

  const handleVolumeChange = (value: number[]) => {
    if (audioElement) {
      audioElement.volume = value[0] / 100
    }
    setVolume(value)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const filteredSongs = songs.filter(
    (song) =>
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleArtistsView = () => {
    console.log("[v0] Navigating to Artists view")
    setCurrentView("library") // For now, redirect to library - could be expanded to show artists grouped view
    setSearchQuery("") // Clear search to show all songs
  }

  const handleDeleteSong = (songId: number) => {
    console.log("[v0] Deleting song with ID:", songId)

    // Eliminar de la lista doblemente enlazada
    songsList.remove(songId.toString())

    // Eliminar del array de canciones
    setSongs((prev) => prev.filter((song) => song.id !== songId))

    // Eliminar de todas las playlists
    setPlaylists((prev) =>
      prev.map((playlist) => ({
        ...playlist,
        songs: playlist.songs.filter((song) => song.id !== songId),
      })),
    )

    // Eliminar de canciones gustadas
    setLikedSongs((prev) => prev.filter((song) => song.id !== songId))

    // Si es la canción actual, detener reproducción
    if (currentSong?.id === songId) {
      if (audioElement) {
        audioElement.pause()
        audioElement.src = ""
      }
      setCurrentSong(null)
      setIsPlaying(false)
    }
  }

  if (isLoading) {
    return (
      <div className="h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <Music className="w-6 h-6 text-white animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Loading VibesMusic</h2>
          <p className="text-slate-400">Connecting to your music library...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <Music className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">VibesMusic</h1>
            <p className="text-sm text-slate-400">Your music, your vibes</p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {isConnected ? (
              <div className="flex items-center gap-1 text-green-400">
                <Wifi className="w-4 h-4" />
                <span className="text-xs">Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-400">
                <WifiOff className="w-4 h-4" />
                <span className="text-xs">Offline</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search your vibes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-80 bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-400"
            />
          </div>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-100">
            <User className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {error && (
        <Alert className="mx-4 mt-4 bg-slate-800 border-slate-600" variant={isConnected ? "default" : "destructive"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between text-slate-100">
            <span>{error}</span>
            {!isConnected && (
              <Button
                size="sm"
                variant="outline"
                onClick={testConnectionManually}
                disabled={isLoading}
                className="ml-4 bg-transparent border-slate-600 text-slate-100 hover:bg-slate-700"
              >
                {isLoading ? "Testing..." : "Test Connection"}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-800 border-r border-slate-700 p-4 flex flex-col">
          {/* Navigation */}
          <nav className="space-y-2 mb-6">
            <Button
              variant={currentView === "home" ? "secondary" : "ghost"}
              className={`w-full justify-start ${
                currentView === "home"
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "text-slate-100 hover:bg-slate-700"
              }`}
              onClick={() => setCurrentView("home")}
            >
              Home
            </Button>
            <Button
              variant={currentView === "library" ? "secondary" : "ghost"}
              className={`w-full justify-start ${
                currentView === "library"
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "text-slate-100 hover:bg-slate-700"
              }`}
              onClick={() => setCurrentView("library")}
            >
              My Library
            </Button>
          </nav>

          {/* Browse Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Browse</h3>
            <div className="space-y-2">
              <Button
                variant={currentView === "library" ? "secondary" : "ghost"}
                className={`w-full justify-start ${
                  currentView === "library"
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "text-slate-100 hover:bg-slate-700"
                }`}
                onClick={handleNavigateToSongs}
              >
                <Music className="w-4 h-4 mr-3" />
                Songs
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-slate-100 hover:bg-slate-700"
                onClick={handleArtistsView}
              >
                <Users className="w-4 h-4 mr-3" />
                Artists
              </Button>
            </div>
          </div>

          {/* Playlists Section */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Playlists</h3>
              <Button
                size="icon"
                variant="ghost"
                className="w-6 h-6 text-slate-400 hover:text-slate-100"
                onClick={() => setPlaylistDialogOpen(true)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {playlists.map((playlist) => (
                <div key={playlist.id} className="group relative">
                  <Button
                    variant="ghost"
                    className={`w-full justify-start p-2 h-auto ${
                      selectedPlaylist?.id === playlist.id
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "text-slate-100 hover:bg-slate-700"
                    }`}
                    onClick={() => handlePlaylistClick(playlist)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${playlist.color} rounded-lg flex items-center justify-center`}>
                        <List className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{playlist.name}</p>
                        <p className="text-xs text-slate-400">{playlist.songs.length} songs</p>
                      </div>
                    </div>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-100"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-800 border-slate-600">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingPlaylist({ id: playlist.id, name: playlist.name, color: playlist.color })
                          setPlaylistDialogOpen(true)
                        }}
                        className="text-slate-100 hover:bg-slate-700"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-600" />
                      <DropdownMenuItem
                        onClick={() => handleDeletePlaylist(playlist.id)}
                        className="text-red-400 hover:bg-slate-700 focus:text-red-400"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {currentView === "home" && (
            <div className="p-6">
              {/* Hero Section */}
              <div className="gradient-hero rounded-2xl p-8 mb-8 text-white">
                <div className="max-w-2xl">
                  <h2 className="text-4xl font-bold mb-4 text-balance">Welcome to VibesMusic</h2>
                  <h3 className="text-xl mb-4 text-pretty">Discover Your Sound</h3>
                  <p className="text-lg mb-6 text-pretty opacity-90">
                    Upload your favorite tracks, create custom playlists, and enjoy your music with a beautiful
                    interface designed for music lovers.
                  </p>
                  <div className="flex gap-4">
                    <Button
                      size="lg"
                      className="bg-white text-blue-600 hover:bg-gray-100"
                      onClick={() => setUploadDialogOpen(true)}
                      disabled={!isConnected}
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      Upload Music
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-white text-white hover:bg-white hover:text-blue-600 bg-transparent"
                    >
                      Learn More
                    </Button>
                  </div>
                </div>
              </div>

              {/* Your Playlists */}
              <section className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Your Playlists</h2>
                  <Button className="gradient-primary text-white" onClick={() => setPlaylistDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Playlist
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {playlists.map((playlist) => (
                    <Card
                      key={playlist.id}
                      className="bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer group border-slate-600"
                      onClick={() => handlePlaylistClick(playlist)}
                    >
                      <CardContent className="p-4 relative">
                        <div
                          className={`w-full aspect-square ${playlist.color} rounded-lg mb-3 flex items-center justify-center`}
                        >
                          <List className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="font-semibold mb-1 text-slate-100">{playlist.name}</h3>
                        <p className="text-sm text-slate-400">{playlist.songs.length} songs</p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-600">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingPlaylist({ id: playlist.id, name: playlist.name, color: playlist.color })
                                setPlaylistDialogOpen(true)
                              }}
                              className="text-slate-100 hover:bg-slate-700"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-600" />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeletePlaylist(playlist.id)
                              }}
                              className="text-red-400 hover:bg-slate-700 focus:text-red-400"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            </div>
          )}

          {currentView === "library" && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">My Library</h2>
                <Button
                  className="gradient-primary text-white"
                  onClick={() => setUploadDialogOpen(true)}
                  disabled={!isConnected}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Music
                </Button>
              </div>
              <div className="space-y-2">
                {filteredSongs.map((song) => (
                  <Card
                    key={song.id}
                    className="bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer group border-slate-600"
                    onClick={() => handleSongSelect(song)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 gradient-accent rounded-lg flex items-center justify-center flex-shrink-0">
                            <Music className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold truncate text-slate-100">{song.title}</h3>
                            <p className="text-sm text-slate-400 truncate">{song.artist}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-400">
                            {song.duration ? formatTime(song.duration) : "0:00"}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleFavorite(song)
                            }}
                            className="text-slate-400 hover:text-red-400"
                          >
                            <Heart className={`w-4 h-4 ${song.is_favorite ? "fill-red-500 text-red-500" : ""}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              openAddToPlaylistDialog(song)
                            }}
                            className="text-slate-400 hover:text-slate-100"
                          >
                            <ListPlus className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteSong(song.id)
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {currentView === "playlist" && selectedPlaylist && (
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-16 h-16 ${selectedPlaylist.color} rounded-xl flex items-center justify-center`}>
                  <List className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedPlaylist.name}</h2>
                  <p className="text-slate-400">{selectedPlaylist.songs.length} songs</p>
                </div>
              </div>
              <div className="space-y-2">
                {selectedPlaylist.songs.length === 0 ? (
                  <div className="text-center py-12">
                    <Music className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-400">No songs in this playlist yet</p>
                  </div>
                ) : (
                  selectedPlaylist.songs.map((song) => (
                    <Card
                      key={song.id}
                      className="bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer group border-slate-600"
                      onClick={() => handleSongSelect(song)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 gradient-accent rounded-lg flex items-center justify-center flex-shrink-0">
                              <Music className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold truncate text-slate-100">{song.title}</h3>
                              <p className="text-sm text-slate-400 truncate">{song.artist}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-400">
                              {song.duration ? formatTime(song.duration) : "0:00"}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleToggleFavorite(song)
                              }}
                              className="text-slate-400 hover:text-red-400"
                            >
                              <Heart className={`w-4 h-4 ${song.is_favorite ? "fill-red-500 text-red-500" : ""}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveFromPlaylist(selectedPlaylist.id, song.id)
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Recently Uploaded Songs Section */}
          {songs.length > 0 && (
            <section className="mb-8 px-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Recently Added</h2>
                <Button
                  variant="outline"
                  onClick={handleNavigateToSongs}
                  className="border-slate-600 text-slate-100 hover:bg-slate-700 bg-transparent"
                >
                  View All Songs
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {songs
                  .slice(-6)
                  .reverse()
                  .map((song) => (
                    <Card
                      key={song.id}
                      className="bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer group border-slate-600"
                      onClick={() => handleSongSelect(song)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 gradient-accent rounded-lg flex items-center justify-center flex-shrink-0">
                            <Music className="w-6 h-6 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold truncate text-slate-100">{song.title}</h3>
                            <p className="text-sm text-slate-400 truncate">{song.artist}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleFavorite(song)
                            }}
                            className="flex-shrink-0 text-slate-400 hover:text-red-400"
                          >
                            <Heart className={`w-4 h-4 ${song.is_favorite ? "fill-red-500 text-red-500" : ""}`} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Music Player */}
      <footer className="bg-slate-800 border-t border-slate-700 p-4">
        <div className="flex items-center justify-between">
          {/* Current Song Info */}
          <div className="flex items-center gap-4 min-w-0 flex-1">
            {currentSong ? (
              <>
                <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
                  <Music className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold truncate text-slate-100">{currentSong.title}</h4>
                  <p className="text-sm text-slate-400 truncate">{currentSong.artist}</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Music className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-100">No song selected</h4>
                  <p className="text-sm text-slate-400">Choose a track to play</p>
                </div>
              </>
            )}
          </div>

          {/* Player Controls */}
          <div className="flex flex-col items-center gap-2 flex-1 max-w-md">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkipPrev}
                className="text-slate-400 hover:text-slate-100"
              >
                <SkipBack className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                className="w-12 h-12 gradient-primary text-white"
                onClick={handlePlayPause}
                disabled={!currentSong}
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkipNext}
                className="text-slate-400 hover:text-slate-100"
              >
                <SkipForward className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex items-center gap-2 w-full">
              <span className="text-xs text-slate-400 w-10 text-right">{formatTime(currentTime)}</span>
              <Slider
                value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
                max={100}
                step={1}
                className="flex-1"
                onValueChange={handleSeek}
                disabled={!currentSong || duration === 0}
              />
              <span className="text-xs text-slate-400 w-10">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => currentSong && handleToggleFavorite(currentSong)}
              disabled={!currentSong}
              className="text-slate-400 hover:text-red-400"
            >
              <Heart className={`w-5 h-5 ${currentSong?.is_favorite ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => currentSong && openAddToPlaylistDialog(currentSong)}
              disabled={!currentSong}
              className="text-slate-400 hover:text-slate-100"
            >
              <ListPlus className="w-5 h-5" />
            </Button>
            <Volume2 className="w-5 h-5 text-slate-400" />
            <Slider value={volume} onValueChange={handleVolumeChange} max={100} step={1} className="w-24" />
          </div>
        </div>
      </footer>

      <PlaylistDialog
        open={playlistDialogOpen}
        onOpenChange={(open) => {
          setPlaylistDialogOpen(open)
          if (!open) setEditingPlaylist(null)
        }}
        onCreatePlaylist={handleCreatePlaylist}
        editingPlaylist={editingPlaylist}
        onEditPlaylist={handleEditPlaylist}
      />

      <AddToPlaylistDialog
        open={addToPlaylistDialogOpen}
        onOpenChange={setAddToPlaylistDialogOpen}
        song={selectedSongForPlaylist}
        playlists={playlists}
        onAddToPlaylist={handleAddToPlaylist}
      />

      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  )
}
