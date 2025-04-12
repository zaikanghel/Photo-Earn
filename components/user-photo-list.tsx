"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface Photo {
  _id: string
  title: string
  description: string
  tags: string[]
  imageData: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
  reviewedAt?: string
  rejectionReason?: string
}

interface UserPhotoListProps {
  photos: Photo[]
}

export function UserPhotoList({ photos }: UserPhotoListProps) {
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({})

  if (photos.length === 0) {
    return <p>No photos found.</p>
  }

  const handleImageLoad = (id: string) => {
    setLoadingImages((prev) => ({ ...prev, [id]: false }))
  }

  const handleImageError = (id: string) => {
    console.error(`Failed to load image for photo ${id}`)
    setLoadingImages((prev) => ({ ...prev, [id]: false }))
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {photos.map((photo) => (
        <Card key={photo._id} className="overflow-hidden">
          <div className="relative aspect-square w-full bg-muted">
            {loadingImages[photo._id] !== false && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            )}
            <Image
              src={photo.imageData || "/placeholder.svg"}
              alt={photo.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onLoad={() => handleImageLoad(photo._id)}
              onError={() => handleImageError(photo._id)}
              onLoadStart={() => setLoadingImages((prev) => ({ ...prev, [photo._id]: true }))}
            />
          </div>
          <CardContent className="p-4">
            <h3 className="font-medium truncate">{photo.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{photo.description}</p>

            {photo.tags && photo.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {photo.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between mt-3">
              <div className="text-sm text-muted-foreground">{new Date(photo.createdAt).toLocaleDateString()}</div>
              <Badge
                variant={
                  photo.status === "approved" ? "default" : photo.status === "rejected" ? "destructive" : "outline"
                }
              >
                {photo.status.charAt(0).toUpperCase() + photo.status.slice(1)}
              </Badge>
            </div>

            {photo.rejectionReason && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="link" size="sm" className="mt-2 p-0 h-auto text-destructive">
                    View rejection reason
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Photo Rejected</DialogTitle>
                    <DialogDescription>
                      This photo was rejected on{" "}
                      {photo.reviewedAt ? new Date(photo.reviewedAt).toLocaleDateString() : "unknown date"}
                    </DialogDescription>
                    <div className="mt-4 p-3 bg-muted rounded-md">{photo.rejectionReason}</div>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
