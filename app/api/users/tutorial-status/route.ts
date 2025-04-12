import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { connectToDatabase } from "@/lib/mongodb"
import { User } from "@/lib/models"

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

    return NextResponse.json({
      hasSeenTutorial: user.hasSeenTutorial || false,
    })
  } catch (error) {
    console.error("Get tutorial status error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
