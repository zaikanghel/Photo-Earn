"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
  userId: {
    _id: string
    name: string
    email: string
  }
}

interface PhotoApprovalListProps {
  photos: Photo[]
  readOnly?: boolean
}

export function PhotoApprovalList({ photos, readOnly = false }: PhotoApprovalListProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({})

  const handleApprove = async (photo: Photo) => {
    if (readOnly) return

    setIsProcessing(true)
    setSelectedPhoto(photo)

    try {
      const response = await fetch(`/api/admin/photos/${photo._id}/approve`, {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to approve photo")
      }

      toast({
        title: "Photo approved",
        description: "The photo has been approved and the user has been credited.",
      })

      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setSelectedPhoto(null)
    }
  }

  const openRejectDialog = (photo: Photo) => {
    if (readOnly) return

    setSelectedPhoto(photo)
    setRejectionReason("")
    setShowRejectDialog(true)
  }

  const handleReject = async () => {
    if (!selectedPhoto) return

    setIsProcessing(true)

    try {
      const response = await fetch(`/api/admin/photos/${selectedPhoto._id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rejectionReason,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to reject photo")
      }

      toast({
        title: "Photo rejected",
        description: "The photo has been rejected.",
      })

      setShowRejectDialog(false)
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImageLoad = (id: string) => {
    setLoadingImages((prev) => ({ ...prev, [id]: false }))
  }

  const handleImageError = (id: string) => {
    console.error(`Failed to load image for photo ${id}`)
    setLoadingImages((prev) => ({ ...prev, [id]: false }))
  }

  if (photos.length === 0) {
    return <p>No photos found.</p>
  }

  return (
    <div className="space-y-4">
      {photos.map((photo) => (
        <Card key={photo._id} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="grid md:grid-cols-2">
              <div className="relative aspect-video w-full bg-muted">
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
                  onLoad={() => handleImageLoad(photo._id)}
                  onError={() => handleImageError(photo._id)}
                  onLoadStart={() => setLoadingImages((prev) => ({ ...prev, [photo._id]: true }))}
                />
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-medium">{photo.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{photo.description}</p>
                  </div>

                  {photo.tags && photo.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {photo.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div>
                    <span className="font-medium">Submitted by:</span> {photo.userId.name} ({photo.userId.email})
                  </div>
                  <div>
                    <span className="font-medium">Date:</span> {new Date(photo.createdAt).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>{" "}
                    <span
                      className={
                        photo.status === "approved"
                          ? "text-green-600"
                          : photo.status === "rejected"
                            ? "text-red-600"
                            : ""
                      }
                    >
                      {photo.status.charAt(0).toUpperCase() + photo.status.slice(1)}
                    </span>
                  </div>

                  {photo.reviewedAt && (
                    <div>
                      <span className="font-medium">Reviewed:</span> {new Date(photo.reviewedAt).toLocaleString()}
                    </div>
                  )}

                  {photo.rejectionReason && (
                    <div>
                      <span className="font-medium">Rejection reason:</span> {photo.rejectionReason}
                    </div>
                  )}

                  {!readOnly && photo.status === "pending" && (
                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => openRejectDialog(photo)}
                        disabled={isProcessing && selectedPhoto?._id === photo._id}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => handleApprove(photo)}
                        disabled={isProcessing && selectedPhoto?._id === photo._id}
                      >
                        {isProcessing && selectedPhoto?._id === photo._id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-2 h-4 w-4" />
                        )}
                        Approve
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Photo</DialogTitle>
            <DialogDescription>Please provide a reason for rejecting this photo.</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Rejection reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isProcessing || !rejectionReason.trim()}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Reject Photo"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
