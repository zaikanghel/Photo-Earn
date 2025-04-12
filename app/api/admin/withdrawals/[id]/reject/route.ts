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

    const { rejectionReason } = await req.json()

    if (!rejectionReason || rejectionReason.trim() === "") {
      return NextResponse.json({ message: "Rejection reason is required" }, { status: 400 })
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

    // Start a session for transaction
    const dbSession = await mongoose.startSession()
    dbSession.startTransaction()

    try {
      // Update withdrawal status
      withdrawal.status = "rejected"
      withdrawal.processedAt = new Date()
      withdrawal.processedBy = admin._id
      withdrawal.rejectionReason = rejectionReason
      await withdrawal.save({ session: dbSession })

      // Return funds to user's balance
      const user = await User.findById(withdrawal.userId)
      if (!user) {
        throw new Error("User not found")
      }

      user.balance += withdrawal.amount
      await user.save({ session: dbSession })

      // Create notification
      await createNotification(
        user._id.toString(),
        "Withdrawal Rejected",
        `Your withdrawal request for $${withdrawal.amount.toFixed(2)} was rejected. Reason: ${rejectionReason}. The funds have been returned to your balance.`,
        "withdrawal_rejected",
        withdrawal._id.toString(),
        "Withdrawal",
      )

      await dbSession.commitTransaction()
    } catch (error) {
      await dbSession.abortTransaction()
      throw error
    } finally {
      dbSession.endSession()
    }

    return NextResponse.json({
      message: "Withdrawal rejected and funds returned to user",
    })
  } catch (error) {
    console.error("Reject withdrawal error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
