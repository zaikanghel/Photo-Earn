import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { connectToDatabase } from "@/lib/mongodb"
import { User, Platform } from "@/lib/models"
import { z } from "zod"
import { createAdminNotification } from "@/app/api/admin/notifications/route"

const platformSchema = z.object({
  name: z.string().min(2),
  code: z
    .string()
    .min(2)
    .regex(/^[a-z0-9_]+$/),
  description: z.string().optional(),
  fee: z.number().min(0),
  isActive: z.boolean().default(true),
  instructions: z.string().optional(),
})

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

    const platforms = await Platform.find().sort({ name: 1 })

    return NextResponse.json({ platforms })
  } catch (error) {
    console.error("Get platforms error:", error)
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

    const body = await req.json()

    // Validate input
    const result = platformSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ message: "Invalid input data", errors: result.error.errors }, { status: 400 })
    }

    const { name, code, description, fee, isActive, instructions } = result.data

    // Check if platform with this code already exists
    const existingPlatform = await Platform.findOne({ code })
    if (existingPlatform) {
      return NextResponse.json({ message: "Platform with this code already exists" }, { status: 409 })
    }

    // Create platform
    const platform = await Platform.create({
      name,
      code,
      description,
      fee,
      isActive,
      instructions,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Create admin notification
    await createAdminNotification(
      "New Payment Platform Added",
      `A new payment platform "${name}" has been added to the system.`,
      "system",
      platform._id,
      "Platform",
    )

    return NextResponse.json({
      message: "Platform created successfully",
      platform,
    })
  } catch (error) {
    console.error("Create platform error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
