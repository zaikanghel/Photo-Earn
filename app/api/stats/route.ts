import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    await connectToDatabase()

    // These would be actual DB queries in production
    // For demo purposes, we'll return approximate numbers that look good
    const totalUsers = 1000 + Math.floor(Math.random() * 500)
    const totalPhotos = 5000 + Math.floor(Math.random() * 1000)
    const totalEarnings = 10000 + Math.floor(Math.random() * 5000)

    return NextResponse.json({
      totalUsers,
      totalPhotos,
      totalEarnings,
    })
  } catch (error) {
    console.error("Get stats error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
