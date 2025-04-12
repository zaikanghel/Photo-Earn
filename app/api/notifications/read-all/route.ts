import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { connectToDatabase } from "@/lib/mongodb"
import { User, Notification } from "@/lib/models"

export async function POST(req: Request) {
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

    // Mark all unread notifications as read
    await Notification.updateMany({ userId: user._id, isRead: false }, { $set: { isRead: true } })

    return NextResponse.json({
      message: "All notifications marked as read",
    })
  } catch (error) {
    console.error("Mark all notifications as read error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
