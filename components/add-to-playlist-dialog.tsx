"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { List, Check } from "lucide-react"

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

interface AddToPlaylistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  song: Song | null
  playlists: Playlist[]
  onAddToPlaylist: (playlistId: number, song: Song, position?: "start" | "end" | number) => void
}

export function AddToPlaylistDialog({
  open,
  onOpenChange,
  song,
  playlists,
  onAddToPlaylist,
}: AddToPlaylistDialogProps) {
  const [selectedPlaylist, setSelectedPlaylist] = useState<number | null>(null)
  const [positionType, setPositionType] = useState<"start" | "end" | "specific">("end")
  const [specificPosition, setSpecificPosition] = useState<string>("1")
  const [step, setStep] = useState<"select-playlist" | "select-position">("select-playlist")

  useEffect(() => {
    if (!open) {
      setSelectedPlaylist(null)
      setPositionType("end")
      setSpecificPosition("1")
      setStep("select-playlist")
    }
  }, [open])

  const handlePlaylistSelect = (playlistId: number) => {
    setSelectedPlaylist(playlistId)
    setStep("select-position")
  }

  const handleAddToPlaylist = () => {
    if (!song || !selectedPlaylist) return

    let position: "start" | "end" | number
    if (positionType === "start") {
      position = "start"
    } else if (positionType === "end") {
      position = "end"
    } else {
      const pos = Number.parseInt(specificPosition)
      position = isNaN(pos) || pos < 1 ? 1 : pos
    }

    onAddToPlaylist(selectedPlaylist, song, position)

    // Close dialog
    onOpenChange(false)
  }

  const handleBack = () => {
    setStep("select-playlist")
    setSelectedPlaylist(null)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  const isInPlaylist = (playlistId: number) => {
    if (!song) return false
    const playlist = playlists.find((p) => p.id === playlistId)
    return playlist?.songs.some((s) => s.id === song.id) || false
  }

  const selectedPlaylistData = playlists.find((p) => p.id === selectedPlaylist)
  const maxPosition = selectedPlaylistData ? selectedPlaylistData.songs.length + 1 : 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-800 border-slate-600 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-slate-100">
            {step === "select-playlist" ? "Add to Playlist" : "Select Position"}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {step === "select-playlist"
              ? song
                ? `Add "${song.title}" to a playlist`
                : "Select a song first"
              : "Choose where to add the song in the playlist"}
          </DialogDescription>
        </DialogHeader>

        {step === "select-playlist" && (
          <ScrollArea className="max-h-60">
            <div className="space-y-2 p-1">
              {playlists.map((playlist) => {
                const inPlaylist = isInPlaylist(playlist.id)

                return (
                  <Button
                    key={playlist.id}
                    variant="ghost"
                    className="w-full justify-start p-3 h-auto hover:bg-slate-700"
                    onClick={() => !inPlaylist && handlePlaylistSelect(playlist.id)}
                    disabled={inPlaylist}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className={`w-10 h-10 ${playlist.color} rounded-lg flex items-center justify-center`}>
                        <List className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-slate-100">{playlist.name}</p>
                        <p className="text-xs text-slate-400">{playlist.songs.length} songs</p>
                      </div>
                      {inPlaylist && <Check className="w-5 h-5 text-green-500" />}
                    </div>
                  </Button>
                )
              })}
            </div>
          </ScrollArea>
        )}

        {step === "select-position" && (
          <div className="space-y-4 py-4">
            <RadioGroup value={positionType} onValueChange={(value) => setPositionType(value as any)}>
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-slate-700 cursor-pointer">
                <RadioGroupItem value="start" id="start" className="border-slate-400" />
                <Label htmlFor="start" className="flex-1 cursor-pointer text-slate-100">
                  <div>
                    <p className="font-medium">Add to Start</p>
                    <p className="text-sm text-slate-400">Add as the first song (Position 1)</p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-slate-700 cursor-pointer">
                <RadioGroupItem value="end" id="end" className="border-slate-400" />
                <Label htmlFor="end" className="flex-1 cursor-pointer text-slate-100">
                  <div>
                    <p className="font-medium">Add to End</p>
                    <p className="text-sm text-slate-400">Add as the last song (Position {maxPosition})</p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-slate-700">
                <RadioGroupItem value="specific" id="specific" className="border-slate-400" />
                <Label htmlFor="specific" className="flex-1 cursor-pointer text-slate-100">
                  <div className="space-y-2">
                    <p className="font-medium">Add to Specific Position</p>
                    <Input
                      type="number"
                      min="1"
                      max={maxPosition}
                      value={specificPosition}
                      onChange={(e) => {
                        setPositionType("specific")
                        setSpecificPosition(e.target.value)
                      }}
                      placeholder="Enter position"
                      className="bg-slate-700 border-slate-600 text-slate-100"
                      disabled={positionType !== "specific"}
                    />
                    <p className="text-sm text-slate-400">Enter a number between 1 and {maxPosition}</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          {step === "select-position" && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="border-slate-600 text-slate-100 hover:bg-slate-700 bg-transparent"
            >
              Back
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleCancel}
            className="border-slate-600 text-slate-100 hover:bg-slate-700 bg-transparent"
          >
            Cancel
          </Button>
          {step === "select-position" && (
            <Button onClick={handleAddToPlaylist} className="gradient-primary text-white">
              Add Song
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
