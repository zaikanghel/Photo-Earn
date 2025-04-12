import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { connectToDatabase } from "@/lib/mongodb"
import { User, Withdrawal } from "@/lib/models"
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

    const withdrawalId = params.id

    if (!mongoose.Types.ObjectId.isValid(withdrawalId)) {
      return NextResponse.json({ message: "Invalid withdrawal ID" }, { status: 400 })
    }

    const withdrawal = await Withdrawal.findById(withdrawalId)

    if (!withdrawal) {
      return NextResponse.json({ message: "Withdrawal not found" }, { status: 404 })
    }

    if (withdrawal.status !== "pending") {
      return NextResponse.json({ message: "Withdrawal has already been processed" }, { status: 400 })
    }

    // Update withdrawal status
    withdrawal.status = "completed"
    withdrawal.processedAt = new Date()
    withdrawal.processedBy = admin._id
    await withdrawal.save()

    // Create notification
    await createNotification(
      withdrawal.userId.toString(),
      "Withdrawal Completed",
      `Your withdrawal request for $${withdrawal.amount.toFixed(2)} has been completed.`,
      "withdrawal_completed",
      withdrawal._id.toString(),
      "Withdrawal",
    )

    return NextResponse.json({
      message: "Withdrawal marked as completed",
    })
  } catch (error) {
    console.error("Complete withdrawal error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
