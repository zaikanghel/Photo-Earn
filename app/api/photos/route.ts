import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { connectToDatabase } from "@/lib/mongodb"
import { User, Photo } from "@/lib/models"

export async function POST(req: Request) {
  try {
    console.log("Photo upload API called")
    const session = await getServerSession()

    if (!session?.user) {
      console.log("Unauthorized: No session")
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Parse request body
    let body
    try {
      body = await req.json()
      console.log("Request body parsed successfully")
    } catch (error) {
      console.error("Error parsing request body:", error)
      return NextResponse.json({ message: "Invalid request body" }, { status: 400 })
    }

    const { title, description, tags, imageData } = body

    // Validate required fields
    if (!title || !description) {
      console.log("Missing title or description")
      return NextResponse.json({ message: "Title and description are required" }, { status: 400 })
    }

    // Validate image data
    if (!imageData || typeof imageData !== "string") {
      console.log("Invalid image data")
      return NextResponse.json({ message: "Image data is required and must be a string" }, { status: 400 })
    }

    console.log("Connecting to database...")
    await connectToDatabase()
    console.log("Connected to database")

    const user = await User.findOne({ email: session.user.email })

    if (!user) {
      console.log("User not found")
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    console.log("Creating photo document...")
    // Create the photo document
    const photo = new Photo({
      userId: user._id,
      title,
      description,
      tags: tags || [],
      imageData,
      status: "pending",
      createdAt: new Date(),
    })

    await photo.save()
    console.log("Photo saved successfully with ID:", photo._id)

    // Return success response without the full image data to reduce response size
    return NextResponse.json(
      {
        message: "Photo uploaded successfully",
        photo: {
          id: photo._id,
          title: photo.title,
          status: photo.status,
          createdAt: photo.createdAt,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Photo upload error:", error)
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(req.url)
    const status = url.searchParams.get("status")

    await connectToDatabase()

    const user = await User.findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    const query: any = { userId: user._id }

    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query.status = status
    }

    const photos = await Photo.find(query).sort({ createdAt: -1 })

    return NextResponse.json({ photos })
  } catch (error) {
    console.error("Get photos error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
