import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { connectToDatabase } from "@/lib/mongodb"
import { User } from "@/lib/models"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserList } from "@/components/user-list"

export default async function AdminUsersPage() {
  const session = await getServerSession()

  if (!session?.user) {
    redirect("/login")
  }

  await connectToDatabase()

  const admin = await User.findOne({ email: session.user.email })

  if (!admin || admin.role !== "admin") {
    redirect("/dashboard")
  }

  const users = await User.find().sort({ createdAt: -1 })

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">User Management</h1>

        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            <UserList users={JSON.parse(JSON.stringify(users))} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
