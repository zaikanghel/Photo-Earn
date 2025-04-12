import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { connectToDatabase } from "@/lib/mongodb"
import { User } from "@/lib/models"
import { hash } from "bcryptjs"
import mongoose from "mongoose"
import { z } from "zod"

const userUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(["user", "admin"]).optional(),
  balance: z.number().min(0).optional(),
  password: z.string().optional(),
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

    const userId = params.id

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ message: "Invalid user ID" }, { status: 400 })
    }

    const body = await req.json()

    // Validate input
    const result = userUpdateSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ message: "Invalid input data", errors: result.error.errors }, { status: 400 })
    }

    const updateData = result.data

    // If password is provided, hash it
    if (updateData.password) {
      updateData.password = await hash(updateData.password, 10)
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true },
    ).select("-password")

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      message: "User updated successfully",
      user: updatedUser,
    })
  } catch (error) {
    console.error("Update user error:", error)
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

    const userId = params.id

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ message: "Invalid user ID" }, { status: 400 })
    }

    // Check if trying to delete an admin
    const userToDelete = await User.findById(userId)

    if (!userToDelete) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    if (userToDelete.role === "admin") {
      return NextResponse.json({ message: "Cannot delete admin users" }, { status: 403 })
    }

    // Delete the user
    await User.findByIdAndDelete(userId)

    return NextResponse.json({
      message: "User deleted successfully",
    })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
