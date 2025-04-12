import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { connectToDatabase } from "@/lib/mongodb"
import { User, Photo } from "@/lib/models"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PhotoApprovalList } from "@/components/photo-approval-list"

export default async function AdminPhotosPage() {
  const session = await getServerSession()

  if (!session?.user) {
    redirect("/login")
  }

  await connectToDatabase()

  const user = await User.findOne({ email: session.user.email })

  if (!user || user.role !== "admin") {
    redirect("/dashboard")
  }

  const pendingPhotos = await Photo.find({ status: "pending" })
    .sort({ createdAt: 1 })
    .populate("userId", "name email")
    .limit(50)

  const recentlyApprovedPhotos = await Photo.find({ status: "approved" })
    .sort({ reviewedAt: -1 })
    .populate("userId", "name email")
    .limit(20)

  const recentlyRejectedPhotos = await Photo.find({ status: "rejected" })
    .sort({ reviewedAt: -1 })
    .populate("userId", "name email")
    .limit(20)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Photo Approvals</h1>

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Recently Approved</TabsTrigger>
            <TabsTrigger value="rejected">Recently Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Photos ({pendingPhotos.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <PhotoApprovalList photos={JSON.parse(JSON.stringify(pendingPhotos))} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Recently Approved Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <PhotoApprovalList photos={JSON.parse(JSON.stringify(recentlyApprovedPhotos))} readOnly />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rejected" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Recently Rejected Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <PhotoApprovalList photos={JSON.parse(JSON.stringify(recentlyRejectedPhotos))} readOnly />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
