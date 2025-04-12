import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { connectToDatabase } from "@/lib/mongodb"
import { User, Settings } from "@/lib/models"

// Helper function to get a setting
async function getSetting(key: string, defaultValue: any) {
  const setting = await Settings.findOne({ key })
  return setting ? setting.value : defaultValue
}

// Helper function to set a setting
async function setSetting(key: string, value: any, description: string, userId: string) {
  await Settings.findOneAndUpdate(
    { key },
    {
      value,
      description,
      updatedAt: new Date(),
      updatedBy: userId,
    },
    { upsert: true },
  )
}

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

    // Get all settings with new default
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

export async function POST(req: Request) {
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

    const { minWithdrawalAmount, paypalFee, gcashFee } = await req.json()

    // Validate settings
    if (minWithdrawalAmount < 0 || paypalFee < 0 || gcashFee < 0) {
      return NextResponse.json({ message: "Values cannot be negative" }, { status: 400 })
    }

    // Save settings
    await setSetting("minWithdrawalAmount", minWithdrawalAmount, "Minimum amount required for withdrawal", admin._id)
    await setSetting("paypalFee", paypalFee, "Fee percentage for PayPal withdrawals", admin._id)
    await setSetting("gcashFee", gcashFee, "Fee percentage for GCash withdrawals", admin._id)

    return NextResponse.json({
      message: "Settings saved successfully",
    })
  } catch (error) {
    console.error("Save settings error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
