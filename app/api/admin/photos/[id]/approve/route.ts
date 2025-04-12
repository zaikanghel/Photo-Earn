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

    // Start a session for transaction
    const session2 = await mongoose.startSession()
    session2.startTransaction()

    try {
      // Update photo status
      photo.status = "approved"
      photo.reviewedAt = new Date()
      photo.reviewedBy = admin._id
      await photo.save({ session: session2 })

      // Credit user's balance - $0.01 for approved photo
      const user = await User.findById(photo.userId)
      if (!user) {
        throw new Error("User not found")
      }

      const photoEarning = 0.01 // $0.01 per approved photo
      user.balance += photoEarning

      // Check if user was invited and credit the inviter with 25% of the earnings (changed from 50%)
      if (user.invitedBy) {
        const inviter = await User.findById(user.invitedBy)
        if (inviter) {
          const inviterEarning = photoEarning * 0.25 // 25% of the photo earnings (changed from 0.5)
          inviter.balance += inviterEarning
          inviter.invitationEarnings = (inviter.invitationEarnings || 0) + inviterEarning
          await inviter.save({ session: session2 })

          // Notify the inviter about the earnings
          await createNotification(
            inviter._id.toString(),
            "Invitation Earnings",
            `You earned ${inviterEarning.toFixed(2)} from ${user.name}'s approved photo.`,
            "photo_approved",
            photo._id.toString(),
            "Photo",
          )
        }
      }

      await user.save({ session: session2 })

      // Create notification for the photo owner
      await createNotification(
        user._id.toString(),
        "Photo Approved",
        `Your photo "${photo.title}" has been approved and $0.01 has been added to your balance.`,
        "photo_approved",
        photo._id.toString(),
        "Photo",
      )

      await session2.commitTransaction()
    } catch (error) {
      await session2.abortTransaction()
      throw error
    } finally {
      session2.endSession()
    }

    return NextResponse.json({
      message: "Photo approved successfully",
    })
  } catch (error) {
    console.error("Photo approval error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
