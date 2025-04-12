import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { connectToDatabase } from "@/lib/mongodb"
import { User, Invitation } from "@/lib/models"

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

    // Get all users who were invited by this user
    const invitedUsers = await User.find({ invitedBy: user._id })

    // Get all invitations created by the user
    const invitations = await Invitation.find({ createdBy: user._id }).sort({
      createdAt: -1,
    })

    // Get statistics about used invitations
    const usedInvitations = await Invitation.find({
      createdBy: user._id,
      isUsed: true,
    })

    // Count users who were directly invited (using the user's invitation code)
    const directInvites = invitedUsers.length

    return NextResponse.json({
      invitations,
      stats: {
        total: directInvites + invitations.length,
        used: directInvites + usedInvitations.length,
        directInvites: directInvites,
      },
      userCode: user.invitationCode || null,
    })
  } catch (error) {
    console.error("Get invitations error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
