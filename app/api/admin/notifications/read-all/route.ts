import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { connectToDatabase } from "@/lib/mongodb"
import { User, AdminNotification } from "@/lib/models"

export async function POST(req: Request) {
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

    // Mark all unread notifications as read
    await AdminNotification.updateMany({ isRead: false }, { $set: { isRead: true } })

    return NextResponse.json({
      message: "All notifications marked as read",
    })
  } catch (error) {
    console.error("Mark all admin notifications as read error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
