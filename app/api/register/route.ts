import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { User, Invitation } from "@/lib/models"
import { hash } from "bcryptjs"
import { z } from "zod"
import { createNotification } from "@/app/api/notifications/route"
import { nanoid } from "nanoid"

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  invitationCode: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Validate input
    const result = userSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ message: "Invalid input data", errors: result.error.errors }, { status: 400 })
    }

    const { name, email, password, invitationCode } = result.data

    // Connect to database
    await connectToDatabase()

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ message: "User with this email already exists" }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await hash(password, 10)

    // Check invitation code if provided
    let invitedBy = null
    if (invitationCode) {
      // First check if this is a user's invitation code
      const inviter = await User.findOne({ invitationCode })

      if (inviter) {
        invitedBy = inviter._id
      } else {
        // If not a direct user code, check the invitations collection
        const invitation = await Invitation.findOne({ code: invitationCode, isUsed: false })

        if (!invitation) {
          return NextResponse.json({ message: "Invalid or already used invitation code" }, { status: 400 })
        }

        invitedBy = invitation.createdBy
      }
    }

    // Always generate a unique invitation code for the new user
    let userInvitationCode = nanoid(8).toUpperCase()
    let existingInvitationCode = await User.findOne({ invitationCode: userInvitationCode })

    // Ensure the code is unique
    while (existingInvitationCode) {
      userInvitationCode = nanoid(8).toUpperCase()
      existingInvitationCode = await User.findOne({ invitationCode: userInvitationCode })
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user",
      balance: 0,
      invitedBy,
      invitationCode: userInvitationCode, // Every user gets an invitation code
    })

    // If user was invited and it was from an invitation record
    if (invitedBy) {
      const invitation = await Invitation.findOne({ code: invitationCode, isUsed: false })

      if (invitation) {
        // Mark invitation as used
        invitation.isUsed = true
        invitation.usedBy = user._id
        invitation.usedAt = new Date()
        invitation.bonusEarned = true
        await invitation.save()
      }

      // Reward the inviter
      const inviter = await User.findById(invitedBy)
      if (inviter) {
        inviter.invitationCount = (inviter.invitationCount || 0) + 1

        // Reward the inviter with $0.10
        inviter.balance += 0.1
        await inviter.save()

        // Notify the inviter
        await createNotification(
          inviter._id.toString(),
          "New Invitation Used",
          `${name} has joined using your invitation code. You've earned $0.10!`,
          "invitation",
          user._id.toString(),
          "User",
        )
      }
    }

    // Return success without sensitive data
    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          invitationCode: user.invitationCode,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
