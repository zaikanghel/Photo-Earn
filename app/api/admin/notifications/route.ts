import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { connectToDatabase } from "@/lib/mongodb"
import { User, AdminNotification } from "@/lib/models"

export async function GET(req: Request) {
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

    // Get the latest 20 notifications for admins
    const notifications = await AdminNotification.find().sort({ createdAt: -1 }).limit(20)

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error("Get admin notifications error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// Helper function to create admin notifications
export async function createAdminNotification(
  title: string,
  message: string,
  type: string,
  relatedId?: any,
  relatedModel?: string,
) {
  try {
    await connectToDatabase()

    const notification = await AdminNotification.create({
      title,
      message,
      type,
      relatedId,
      relatedModel,
    })

    return notification
  } catch (error) {
    console.error("Create admin notification error:", error)
    throw error
  }
}
