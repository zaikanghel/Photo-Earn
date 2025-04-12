import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { connectToDatabase } from "@/lib/mongodb"
import { User, Photo } from "@/lib/models"
import mongoose from "mongoose"
import { createNotification } from "@/app/api/notifications/route"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { rejectionReason } = await req.json()

    await connectToDatabase()

    const admin = await User.findOne({ email: session.user.email })

    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const photoId = params.id

    if (!mongoose.Types.ObjectId.isValid(photoId)) {
      return NextResponse.json({ message: "Invalid photo ID" }, { status: 400 })
    }

    const photo = await Photo.findById(photoId)

    if (!photo) {
      return NextResponse.json({ message: "Photo not found" }, { status: 404 })
    }

    if (photo.status !== "pending") {
      return NextResponse.json({ message: "Photo has already been reviewed" }, { status: 400 })
    }

    // Update photo status
    photo.status = "rejected"
    photo.reviewedAt = new Date()
    photo.reviewedBy = admin._id
    photo.rejectionReason = rejectionReason
    await photo.save()

    // Create notification
    await createNotification(
      photo.userId.toString(),
      "Photo Rejected",
      `Your photo "${photo.title}" was rejected. Reason: ${rejectionReason}`,
      "photo_rejected",
      photo._id.toString(),
      "Photo",
    )

    return NextResponse.json({
      message: "Photo rejected successfully",
    })
  } catch (error) {
    console.error("Photo rejection error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
