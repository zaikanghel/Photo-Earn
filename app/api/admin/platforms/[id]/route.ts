import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { connectToDatabase } from "@/lib/mongodb"
import { User, Platform } from "@/lib/models"
import mongoose from "mongoose"
import { z } from "zod"
import { createAdminNotification } from "@/app/api/admin/notifications/route"

const platformUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  fee: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
  instructions: z.string().optional(),
})

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
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

    const platformId = params.id

    if (!mongoose.Types.ObjectId.isValid(platformId)) {
      return NextResponse.json({ message: "Invalid platform ID" }, { status: 400 })
    }

    const body = await req.json()

    // Validate input
    const result = platformUpdateSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ message: "Invalid input data", errors: result.error.errors }, { status: 400 })
    }

    const updateData = {
      ...result.data,
      updatedAt: new Date(),
    }

    const updatedPlatform = await Platform.findByIdAndUpdate(
      platformId,
      { $set: updateData },
      { new: true, runValidators: true },
    )

    if (!updatedPlatform) {
      return NextResponse.json({ message: "Platform not found" }, { status: 404 })
    }

    // Create admin notification
    await createAdminNotification(
      "Payment Platform Updated",
      `The payment platform "${updatedPlatform.name}" has been updated.`,
      "system",
      updatedPlatform._id,
      "Platform",
    )

    return NextResponse.json({
      message: "Platform updated successfully",
      platform: updatedPlatform,
    })
  } catch (error) {
    console.error("Update platform error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
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

    const platformId = params.id

    if (!mongoose.Types.ObjectId.isValid(platformId)) {
      return NextResponse.json({ message: "Invalid platform ID" }, { status: 400 })
    }

    const platform = await Platform.findById(platformId)

    if (!platform) {
      return NextResponse.json({ message: "Platform not found" }, { status: 404 })
    }

    // Check if platform is in use
    // This would require checking if there are any withdrawals using this platform
    // For now, we'll just delete it

    const platformName = platform.name
    await Platform.findByIdAndDelete(platformId)

    // Create admin notification
    await createAdminNotification(
      "Payment Platform Deleted",
      `The payment platform "${platformName}" has been deleted from the system.`,
      "system",
      null,
      null,
    )

    return NextResponse.json({
      message: "Platform deleted successfully",
    })
  } catch (error) {
    console.error("Delete platform error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
