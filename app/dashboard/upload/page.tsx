"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Camera, Upload, X, Loader2, AlertCircle } from "lucide-react"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const formSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  tags: z.string().optional(),
})

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export default function UploadPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      tags: "",
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null)

    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]

      // Check if file is an image
      if (!selectedFile.type.startsWith("image/")) {
        setUploadError("Invalid file type. Please select an image file.")
        return
      }

      // Check file size (max 5MB)
      if (selectedFile.size > MAX_FILE_SIZE) {
        setUploadError("File too large. Please select an image under 5MB.")
        return
      }

      setFile(selectedFile)

      // Create object URL for preview
      const objectUrl = URL.createObjectURL(selectedFile)
      setPreview(objectUrl)
    }
  }

  const clearFile = () => {
    if (preview) {
      URL.revokeObjectURL(preview)
    }
    setFile(null)
    setPreview(null)
    setUploadError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!file || !session?.user?.id) {
      setUploadError("Please select a file to upload.")
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      // Convert image to base64
      const base64Image = await convertToBase64(file)

      // Process tags
      const tagArray = values.tags
        ? values.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0)
        : []

      // Prepare the payload
      const payload = {
        title: values.title,
        description: values.description,
        tags: tagArray,
        imageData: base64Image,
      }

      console.log("Sending photo upload request...")

      // Save to database
      const response = await fetch("/api/photos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      console.log("Upload response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to save photo")
      }

      const data = await response.json()
      console.log("Upload success:", data)

      toast({
        title: "Success",
        description: "Your photo has been uploaded and is pending review.",
      })

      // Clean up the object URL
      if (preview) {
        URL.revokeObjectURL(preview)
      }

      router.push("/dashboard/photos")
      router.refresh()
    } catch (error) {
      console.error("Upload error:", error)
      setUploadError(error instanceof Error ? error.message : "Something went wrong with the upload. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  // Function to convert file to base64
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Upload Photo</h1>

        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {uploadError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Upload Error</AlertTitle>
                    <AlertDescription>{uploadError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="photo">Select Photo</Label>
                  <Input
                    ref={fileInputRef}
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  <p className="text-sm text-muted-foreground">
                    Upload an original photo taken with your camera. Maximum size: 5MB.
                  </p>
                </div>

                {preview && (
                  <div className="relative">
                    <div className="relative aspect-video w-full overflow-hidden rounded-md border">
                      <Image src={preview || "/placeholder.svg"} alt="Preview" fill className="object-contain" />
                    </div>
                    <Button variant="outline" size="icon" className="absolute right-2 top-2" onClick={clearFile}>
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </div>
                )}

                {!preview && (
                  <div className="flex h-48 flex-col items-center justify-center rounded-md border border-dashed">
                    <div className="flex flex-col items-center justify-center space-y-2 text-center">
                      <Camera className="h-8 w-8 text-muted-foreground" />
                      <div className="text-sm text-muted-foreground">No photo selected</div>
                    </div>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter a title for your photo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe your photo" className="resize-none" rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags (comma separated)</FormLabel>
                      <FormControl>
                        <Input placeholder="nature, landscape, sunset" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard/photos")}
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!file || isUploading}>
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Photo
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
