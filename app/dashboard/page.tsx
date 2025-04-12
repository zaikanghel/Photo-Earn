import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { connectToDatabase } from "@/lib/mongodb"
import { User, Photo, Withdrawal } from "@/lib/models"
import { DollarSign, ImageIcon, Upload, UserPlus, Coins, ArrowRight } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await getServerSession()

  if (!session?.user) {
    redirect("/login")
  }

  await connectToDatabase()

  const user = await User.findOne({ email: session.user.email })

  if (!user) {
    redirect("/login")
  }

  const pendingPhotos = await Photo.countDocuments({
    userId: user._id,
    status: "pending",
  })

  const approvedPhotos = await Photo.countDocuments({
    userId: user._id,
    status: "approved",
  })

  const pendingWithdrawals = await Withdrawal.countDocuments({
    userId: user._id,
    status: "pending",
  })

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-3xl font-bold">Welcome, {user.name}!</h1>
          <div className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg">
            <Coins className="h-5 w-5" />
            <div>
              <div className="text-sm opacity-90">Your Balance</div>
              <div className="text-xl font-bold">${user.balance.toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved Photos</CardTitle>
              <div className="rounded-full bg-green-500 p-1">
                <ImageIcon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-500">{approvedPhotos}</div>
              <p className="text-xs text-green-700/70 dark:text-green-500/70">Earning $0.01 per approved photo</p>
              <Link href="/dashboard/photos" className="mt-3 inline-block">
                <Button
                  variant="link"
                  className="p-0 h-auto text-green-700 dark:text-green-500 flex items-center gap-1"
                >
                  View photos <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Photos</CardTitle>
              <div className="rounded-full bg-orange-500 p-1">
                <ImageIcon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-500">{pendingPhotos}</div>
              <p className="text-xs text-orange-700/70 dark:text-orange-500/70">Awaiting approval</p>
              {pendingPhotos > 0 && (
                <Link href="/dashboard/photos?tab=pending" className="mt-3 inline-block">
                  <Button
                    variant="link"
                    className="p-0 h-auto text-orange-700 dark:text-orange-500 flex items-center gap-1"
                  >
                    Check status <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Invitation Earnings</CardTitle>
              <div className="rounded-full bg-blue-500 p-1">
                <UserPlus className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-500">
                ${user.invitationEarnings ? user.invitationEarnings.toFixed(2) : "0.00"}
              </div>
              <p className="text-xs text-blue-700/70 dark:text-blue-500/70">25% commission on referrals</p>
              <Link href="/dashboard/invitations" className="mt-3 inline-block">
                <Button variant="link" className="p-0 h-auto text-blue-700 dark:text-blue-500 flex items-center gap-1">
                  Manage invitations <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Link href="/dashboard/upload">
                <Button className="w-full h-auto py-6 flex flex-col gap-2">
                  <Upload className="h-6 w-6" />
                  <span>Upload New Photo</span>
                </Button>
              </Link>
              <Link href="/dashboard/withdrawals/new">
                <Button
                  variant="outline"
                  className="w-full h-auto py-6 flex flex-col gap-2"
                  disabled={user.balance < 1}
                >
                  <DollarSign className="h-6 w-6" />
                  <span>Request Withdrawal</span>
                </Button>
              </Link>
              <Link href="/dashboard/invitations">
                <Button variant="outline" className="w-full h-auto py-6 flex flex-col gap-2">
                  <UserPlus className="h-6 w-6" />
                  <span>Invite Friends</span>
                </Button>
              </Link>
              <Link href="/dashboard/photos">
                <Button variant="outline" className="w-full h-auto py-6 flex flex-col gap-2">
                  <ImageIcon className="h-6 w-6" />
                  <span>View My Photos</span>
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-[calc(100%-56px)] gap-4">
              <div className="flex-1">
                <p className="text-muted-foreground">New to PhotoEarn? Check out our tutorial to learn the basics.</p>
              </div>
              <Link href="/tutorial" className="mt-auto">
                <Button variant="outline" className="w-full">
                  View Tutorial
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
