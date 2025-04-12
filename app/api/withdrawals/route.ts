import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { connectToDatabase } from "@/lib/mongodb"
import { User, Withdrawal, Settings } from "@/lib/models"
import mongoose from "mongoose"

// Helper function to get a setting
async function getSetting(key: string, defaultValue: any) {
  const setting = await Settings.findOne({ key })
  return setting ? setting.value : defaultValue
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { amount, method, accountDetails, fee = 0 } = await req.json()

    await connectToDatabase()

    // Get minimum withdrawal amount from settings
    const minWithdrawalAmount = await getSetting("minWithdrawalAmount", 1)

    if (!amount || amount < minWithdrawalAmount) {
      return NextResponse.json(
        { message: `Minimum withdrawal amount is ${minWithdrawalAmount.toFixed(2)}` },
        { status: 400 },
      )
    }

    if (!method || !["paypal", "gcash"].includes(method)) {
      return NextResponse.json({ message: "Invalid payment method" }, { status: 400 })
    }

    if (!accountDetails) {
      return NextResponse.json({ message: "Account details are required" }, { status: 400 })
    }

    const user = await User.findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    if (user.balance < amount) {
      return NextResponse.json({ message: "Insufficient balance" }, { status: 400 })
    }

    // Calculate the fee if not provided
    let finalFee = fee
    if (!finalFee) {
      const paypalFeeSetting = await getSetting("paypalFee", 0)
      const gcashFeeSetting = await getSetting("gcashFee", 0)

      finalFee = method === "paypal" ? (amount * paypalFeeSetting) / 100 : (amount * gcashFeeSetting) / 100
    }

    // Calculate the final amount after fee
    const finalAmount = amount - finalFee

    // Start a session for transaction
    const dbSession = await mongoose.startSession()
    dbSession.startTransaction()

    try {
      // Deduct from user's balance
      user.balance -= amount
      await user.save({ session: dbSession })

      // Create withdrawal request
      const withdrawal = await Withdrawal.create(
        [
          {
            userId: user._id,
            amount,
            method,
            accountDetails,
            status: "pending",
            fee: finalFee,
            finalAmount,
          },
        ],
        { session: dbSession },
      )

      await dbSession.commitTransaction()

      return NextResponse.json(
        {
          message: "Withdrawal request created successfully",
          withdrawal: withdrawal[0],
        },
        { status: 201 },
      )
    } catch (error) {
      await dbSession.abortTransaction()
      throw error
    } finally {
      dbSession.endSession()
    }
  } catch (error) {
    console.error("Withdrawal request error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

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

    const withdrawals = await Withdrawal.find({ userId: user._id }).sort({ createdAt: -1 })

    return NextResponse.json({ withdrawals })
  } catch (error) {
    console.error("Get withdrawals error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
