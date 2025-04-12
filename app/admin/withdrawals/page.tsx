import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { connectToDatabase } from "@/lib/mongodb"
import { User, Withdrawal } from "@/lib/models"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminWithdrawalList } from "@/components/admin-withdrawal-list"

export default async function AdminWithdrawalsPage() {
  const session = await getServerSession()

  if (!session?.user) {
    redirect("/login")
  }

  await connectToDatabase()

  const user = await User.findOne({ email: session.user.email })

  if (!user || user.role !== "admin") {
    redirect("/dashboard")
  }

  const pendingWithdrawals = await Withdrawal.find({ status: "pending" })
    .sort({ createdAt: 1 })
    .populate("userId", "name email")

  const completedWithdrawals = await Withdrawal.find({ status: "completed" })
    .sort({ processedAt: -1 })
    .limit(20)
    .populate("userId", "name email")

  const rejectedWithdrawals = await Withdrawal.find({ status: "rejected" })
    .sort({ processedAt: -1 })
    .limit(20)
    .populate("userId", "name email")

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Withdrawal Requests</h1>

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Withdrawals ({pendingWithdrawals.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminWithdrawalList withdrawals={JSON.parse(JSON.stringify(pendingWithdrawals))} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Completed Withdrawals</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminWithdrawalList withdrawals={JSON.parse(JSON.stringify(completedWithdrawals))} readOnly />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rejected" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Rejected Withdrawals</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminWithdrawalList withdrawals={JSON.parse(JSON.stringify(rejectedWithdrawals))} readOnly />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
