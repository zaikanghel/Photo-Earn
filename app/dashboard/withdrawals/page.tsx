import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { connectToDatabase } from "@/lib/mongodb"
import { User, Withdrawal } from "@/lib/models"
import { DollarSign, Plus } from "lucide-react"
import { WithdrawalList } from "@/components/withdrawal-list"

export default async function WithdrawalsPage() {
  const session = await getServerSession()

  if (!session?.user) {
    redirect("/login")
  }

  await connectToDatabase()

  const user = await User.findOne({ email: session.user.email })

  if (!user) {
    redirect("/login")
  }

  const withdrawals = await Withdrawal.find({ userId: user._id }).sort({ createdAt: -1 })

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Withdrawals</h1>
          <Link href="/dashboard/withdrawals/new">
            <Button disabled={user.balance < 5}>
              <Plus className="mr-2 h-4 w-4" />
              New Withdrawal
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              <span className="text-2xl font-bold">{user.balance.toFixed(2)}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Minimum withdrawal amount: $1.00</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Withdrawal History</CardTitle>
          </CardHeader>
          <CardContent>
            <WithdrawalList withdrawals={JSON.parse(JSON.stringify(withdrawals))} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
