"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PlaylistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreatePlaylist: (name: string, color: string) => void
  editingPlaylist?: { id: number; name: string; color: string } | null
  onEditPlaylist?: (id: number, name: string, color: string) => void
}

const PLAYLIST_COLORS = [
  { name: "Purple", value: "bg-purple-500" },
  { name: "Blue", value: "bg-blue-500" },
  { name: "Pink", value: "bg-pink-500" },
  { name: "Red", value: "bg-red-500" },
  { name: "Green", value: "bg-green-500" },
  { name: "Orange", value: "bg-orange-500" },
  { name: "Teal", value: "bg-teal-500" },
  { name: "Indigo", value: "bg-indigo-500" },
]

export function PlaylistDialog({
  open,
  onOpenChange,
  onCreatePlaylist,
  editingPlaylist,
  onEditPlaylist,
}: PlaylistDialogProps) {
  const [name, setName] = useState(editingPlaylist?.name || "")
  const [selectedColor, setSelectedColor] = useState(editingPlaylist?.color || "bg-purple-500")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    if (editingPlaylist && onEditPlaylist) {
      onEditPlaylist(editingPlaylist.id, name.trim(), selectedColor)
    } else {
      onCreatePlaylist(name.trim(), selectedColor)
    }

    setName("")
    setSelectedColor("bg-purple-500")
    onOpenChange(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setName("")
      setSelectedColor("bg-purple-500")
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{editingPlaylist ? "Edit Playlist" : "Create New Playlist"}</DialogTitle>
            <DialogDescription>
              {editingPlaylist ? "Update your playlist details." : "Give your playlist a name and choose a color."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Playlist Name</Label>
              <Input
                id="name"
                placeholder="My Awesome Playlist"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="grid grid-cols-4 gap-2">
                {PLAYLIST_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`w-12 h-12 ${color.value} rounded-lg border-2 transition-all ${
                      selectedColor === color.value ? "border-white scale-110" : "border-transparent"
                    }`}
                    onClick={() => setSelectedColor(color.value)}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {editingPlaylist ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
