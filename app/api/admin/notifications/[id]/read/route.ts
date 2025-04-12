import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { connectToDatabase } from "@/lib/mongodb"
import { User, AdminNotification } from "@/lib/models"
import mongoose from "mongoose"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const user = await User.findOne({ email: session.user.email })

    if (!user || user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const notificationId = params.id

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return NextResponse.json({ message: "Invalid notification ID" }, { status: 400 })
    }

    // Find the notification
    const notification = await AdminNotification.findById(notificationId)

    if (!notification) {
      return NextResponse.json({ message: "Notification not found" }, { status: 404 })
    }

    // Mark as read
    notification.isRead = true
    await notification.save()

    return NextResponse.json({
      message: "Notification marked as read",
    })
  } catch (error) {
    console.error("Mark admin notification as read error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
