import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { connectToDatabase } from "@/lib/mongodb"
import { Settings } from "@/lib/models"

// Helper function to get a setting
async function getSetting(key: string, defaultValue: any) {
  const setting = await Settings.findOne({ key })
  return setting ? setting.value : defaultValue
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    // Get public settings with new default
    const minWithdrawalAmount = await getSetting("minWithdrawalAmount", 1) // Changed from 5 to 1
    const paypalFee = await getSetting("paypalFee", 0)
    const gcashFee = await getSetting("gcashFee", 0)

    return NextResponse.json({
      minWithdrawalAmount,
      paypalFee,
      gcashFee,
    })
  } catch (error) {
    console.error("Get settings error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
