"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Upload, Music, X, CheckCircle, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface UploadFile {
  file: File
  title: string
  artist: string
  status: "pending" | "uploading" | "success" | "error"
  progress: number
  error?: string
}

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete: (files: { file: File; title: string; artist: string }[]) => void
}

export function UploadDialog({ open, onOpenChange, onUploadComplete }: UploadDialogProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith("audio/"))

    addFiles(droppedFiles)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter((file) => file.type.startsWith("audio/"))
      addFiles(selectedFiles)
    }
  }

  const addFiles = (newFiles: File[]) => {
    const uploadFiles: UploadFile[] = newFiles.map((file) => ({
      file,
      title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
      artist: "Unknown Artist",
      status: "pending",
      progress: 0,
    }))

    setFiles((prev) => [...prev, ...uploadFiles])
  }

  const updateFile = (index: number, updates: Partial<UploadFile>) => {
    setFiles((prev) => prev.map((file, i) => (i === index ? { ...file, ...updates } : file)))
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUploadAll = async () => {
    const pendingFiles = files.filter((f) => f.status === "pending")
    const filesToUpload = pendingFiles.map((f) => ({
      file: f.file,
      title: f.title,
      artist: f.artist,
    }))

    // Mark all as uploading
    pendingFiles.forEach((file, originalIndex) => {
      const actualIndex = files.findIndex((f) => f === file)
      updateFile(actualIndex, { status: "uploading", progress: 0 })
    })

    // Pass to parent component for actual upload
    onUploadComplete(filesToUpload)
  }

  const handleClose = () => {
    setFiles([])
    onOpenChange(false)
  }

  const canUpload = files.some((f) => f.status === "pending")
  const hasUploading = files.some((f) => f.status === "uploading")

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Upload Music</DialogTitle>
          <DialogDescription>
            Drag and drop your music files or click to browse. Supported formats: MP3, WAV, FLAC, M4A
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/25 hover:border-primary/50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Drop your music files here</p>
            <p className="text-sm text-muted-foreground mb-4">or</p>
            <Button variant="outline" asChild>
              <label className="cursor-pointer">
                Browse Files
                <input type="file" multiple accept="audio/*" className="hidden" onChange={handleFileSelect} />
              </label>
            </Button>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="flex-1 overflow-auto">
              <div className="space-y-3">
                {files.map((file, index) => (
                  <Card key={index} className="bg-card">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 gradient-accent rounded-lg flex items-center justify-center flex-shrink-0">
                          <Music className="w-6 h-6 text-white" />
                        </div>

                        <div className="flex-1 min-w-0 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor={`title-${index}`} className="text-xs">
                                Title
                              </Label>
                              <Input
                                id={`title-${index}`}
                                value={file.title}
                                onChange={(e) => updateFile(index, { title: e.target.value })}
                                disabled={file.status !== "pending"}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`artist-${index}`} className="text-xs">
                                Artist
                              </Label>
                              <Input
                                id={`artist-${index}`}
                                value={file.artist}
                                onChange={(e) => updateFile(index, { artist: e.target.value })}
                                disabled={file.status !== "pending"}
                                className="h-8"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              {file.status === "uploading" && (
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span>Uploading...</span>
                                    <span>{file.progress}%</span>
                                  </div>
                                  <Progress value={file.progress} className="h-2" />
                                </div>
                              )}

                              {file.status === "success" && (
                                <div className="flex items-center gap-2 text-green-600">
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="text-sm">Upload successful</span>
                                </div>
                              )}

                              {file.status === "error" && (
                                <div className="flex items-center gap-2 text-red-600">
                                  <AlertCircle className="w-4 h-4" />
                                  <span className="text-sm">{file.error}</span>
                                </div>
                              )}

                              {file.status === "pending" && (
                                <p className="text-sm text-muted-foreground">
                                  {(file.file.size / 1024 / 1024).toFixed(1)} MB
                                </p>
                              )}
                            </div>

                            {file.status === "pending" && (
                              <Button variant="ghost" size="icon" onClick={() => removeFile(index)} className="w-8 h-8">
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {files.length > 0 && (
          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {files.length} file{files.length !== 1 ? "s" : ""} selected
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} disabled={hasUploading}>
                Cancel
              </Button>
              <Button
                onClick={handleUploadAll}
                disabled={!canUpload || hasUploading}
                className="gradient-primary text-white"
              >
                {hasUploading ? "Uploading..." : `Upload ${files.filter((f) => f.status === "pending").length} Files`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
