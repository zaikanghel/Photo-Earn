import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { connectToDatabase } from "@/lib/mongodb"
import { User, Notification } from "@/lib/models"

export async function GET(req: Request) {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const user = await User.findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Get the latest 20 notifications for the user
    const notifications = await Notification.find({ userId: user._id }).sort({ createdAt: -1 }).limit(20)

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error("Get notifications error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// Helper function to create notifications
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string,
  relatedId?: string,
  relatedModel?: string,
) {
  try {
    await connectToDatabase()

    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      relatedId,
      relatedModel,
    })

    return notification
  } catch (error) {
    console.error("Create notification error:", error)
    throw error
  }
}
