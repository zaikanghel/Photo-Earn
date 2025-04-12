import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { connectToDatabase } from "@/lib/mongodb"
import { User, Photo, Withdrawal, Settings } from "@/lib/models"
import {
  Users,
  ImageIcon,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  SettingsIcon,
  CreditCard,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default async function AdminDashboardPage() {
  const session = await getServerSession()

  if (!session?.user) {
    redirect("/login")
  }

  await connectToDatabase()

  const user = await User.findOne({ email: session.user.email })

  if (!user || user.role !== "admin") {
    redirect("/dashboard")
  }

  // Get counts for dashboard
  const totalUsers = await User.countDocuments()
  const pendingPhotos = await Photo.countDocuments({ status: "pending" })
  const approvedPhotos = await Photo.countDocuments({ status: "approved" })
  const rejectedPhotos = await Photo.countDocuments({ status: "rejected" })
  const pendingWithdrawals = await Withdrawal.countDocuments({ status: "pending" })
  const completedWithdrawals = await Withdrawal.countDocuments({ status: "completed" })
  const rejectedWithdrawals = await Withdrawal.countDocuments({ status: "rejected" })

  // Get recent users
  const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select("name email createdAt role")

  // Get recent photos
  const recentPhotos = await Photo.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("userId", "name email")
    .select("title status createdAt reviewedAt")

  // Get recent withdrawals
  const recentWithdrawals = await Withdrawal.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("userId", "name email")
    .select("amount method status createdAt")

  // Get system settings
  const minWithdrawalAmount = await Settings.findOne({ key: "minWithdrawalAmount" })
  const paypalFee = await Settings.findOne({ key: "paypalFee" })
  const gcashFee = await Settings.findOne({ key: "gcashFee" })

  // Calculate total withdrawal amount
  const totalWithdrawalAmount = await Withdrawal.aggregate([
    { $match: { status: "completed" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ])

  const totalPaidOut = totalWithdrawalAmount.length > 0 ? totalWithdrawalAmount[0].total : 0

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex gap-2">
            <Link href="/admin/settings">
              <Button variant="outline" size="sm">
                <SettingsIcon className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
            <Link href="/admin/platforms">
              <Button variant="outline" size="sm">
                <CreditCard className="mr-2 h-4 w-4" />
                Payment Platforms
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <div className="rounded-full bg-blue-500 p-1">
                <Users className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
              <Link href="/admin/users">
                <Button variant="link" className="p-0 h-auto mt-2 text-blue-600 dark:text-blue-400">
                  View all users
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Photos</CardTitle>
              <div className="rounded-full bg-green-500 p-1">
                <ImageIcon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingPhotos}</div>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                  {approvedPhotos} Approved
                </Badge>
                <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                  {rejectedPhotos} Rejected
                </Badge>
              </div>
              <Link href="/admin/photos">
                <Button variant="link" className="p-0 h-auto mt-2 text-green-600 dark:text-green-400">
                  Review pending photos
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Withdrawals</CardTitle>
              <div className="rounded-full bg-amber-500 p-1">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingWithdrawals}</div>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">
                  ${totalPaidOut.toFixed(2)} Paid
                </Badge>
              </div>
              <Link href="/admin/withdrawals">
                <Button variant="link" className="p-0 h-auto mt-2 text-amber-600 dark:text-amber-400">
                  Process withdrawals
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Settings</CardTitle>
              <div className="rounded-full bg-purple-500 p-1">
                <SettingsIcon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Min. Withdrawal:</span>
                  <span>${minWithdrawalAmount?.value || "1.00"}</span>
                </div>
                <div className="flex justify-between">
                  <span>PayPal Fee:</span>
                  <span>{paypalFee?.value || "0"}%</span>
                </div>
                <div className="flex justify-between">
                  <span>GCash Fee:</span>
                  <span>{gcashFee?.value || "0"}%</span>
                </div>
              </div>
              <Link href="/admin/settings">
                <Button variant="link" className="p-0 h-auto mt-2 text-purple-600 dark:text-purple-400">
                  Update settings
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Users</span>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentUsers.length > 0 ? (
                  recentUsers.map((user) => (
                    <div key={user._id.toString()} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={user.role === "admin" ? "default" : "outline"}>{user.role}</Badge>
                        <p className="text-xs text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground">No users found</p>
                )}
                <Link href="/admin/users">
                  <Button variant="outline" className="w-full mt-4">
                    View All Users
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Photos</span>
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPhotos.length > 0 ? (
                  recentPhotos.map((photo) => (
                    <div key={photo._id.toString()} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{photo.title}</p>
                        <p className="text-sm text-muted-foreground">By {photo.userId.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            photo.status === "approved"
                              ? "default"
                              : photo.status === "rejected"
                                ? "destructive"
                                : "outline"
                          }
                        >
                          {photo.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {new Date(photo.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground">No photos found</p>
                )}
                <Link href="/admin/photos">
                  <Button variant="outline" className="w-full mt-4">
                    View All Photos
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Withdrawals</span>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentWithdrawals.length > 0 ? (
                  recentWithdrawals.map((withdrawal) => (
                    <div key={withdrawal._id.toString()} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">${withdrawal.amount.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">
                          {withdrawal.userId.name} • {withdrawal.method}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            withdrawal.status === "completed"
                              ? "default"
                              : withdrawal.status === "rejected"
                                ? "destructive"
                                : "outline"
                          }
                        >
                          {withdrawal.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {new Date(withdrawal.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground">No withdrawals found</p>
                )}
                <Link href="/admin/withdrawals">
                  <Button variant="outline" className="w-full mt-4">
                    View All Withdrawals
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Link href="/admin/photos">
                <Button
                  className="w-full h-auto py-6 flex flex-col gap-2"
                  variant={pendingPhotos > 0 ? "default" : "outline"}
                >
                  <div className="relative">
                    <ImageIcon className="h-6 w-6" />
                    {pendingPhotos > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
                        {pendingPhotos}
                      </Badge>
                    )}
                  </div>
                  <span>Review Photos</span>
                </Button>
              </Link>
              <Link href="/admin/withdrawals">
                <Button
                  className="w-full h-auto py-6 flex flex-col gap-2"
                  variant={pendingWithdrawals > 0 ? "default" : "outline"}
                >
                  <div className="relative">
                    <DollarSign className="h-6 w-6" />
                    {pendingWithdrawals > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
                        {pendingWithdrawals}
                      </Badge>
                    )}
                  </div>
                  <span>Process Withdrawals</span>
                </Button>
              </Link>
              <Link href="/admin/users">
                <Button variant="outline" className="w-full h-auto py-6 flex flex-col gap-2">
                  <Users className="h-6 w-6" />
                  <span>Manage Users</span>
                </Button>
              </Link>
              <Link href="/admin/platforms">
                <Button variant="outline" className="w-full h-auto py-6 flex flex-col gap-2">
                  <CreditCard className="h-6 w-6" />
                  <span>Payment Platforms</span>
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Approved Photos</span>
                  </div>
                  <span className="font-medium">{approvedPhotos}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <XCircle className="h-4 w-4 text-red-500 mr-2" />
                    <span>Rejected Photos</span>
                  </div>
                  <span className="font-medium">{rejectedPhotos}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-amber-500 mr-2" />
                    <span>Pending Photos</span>
                  </div>
                  <span className="font-medium">{pendingPhotos}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 text-blue-500 mr-2" />
                    <span>Total Paid Out</span>
                  </div>
                  <span className="font-medium">${totalPaidOut.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
