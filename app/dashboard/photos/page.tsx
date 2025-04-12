import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { connectToDatabase } from "@/lib/mongodb"
import { User, Photo } from "@/lib/models"
import { Upload } from "lucide-react"
import { UserPhotoList } from "@/components/user-photo-list"

export default async function PhotosPage() {
  const session = await getServerSession()

  if (!session?.user) {
    redirect("/login")
  }

  await connectToDatabase()

  const user = await User.findOne({ email: session.user.email })

  if (!user) {
    redirect("/login")
  }

  const pendingPhotos = await Photo.find({
    userId: user._id,
    status: "pending",
  }).sort({ createdAt: -1 })

  const approvedPhotos = await Photo.find({
    userId: user._id,
    status: "approved",
  }).sort({ createdAt: -1 })

  const rejectedPhotos = await Photo.find({
    userId: user._id,
    status: "rejected",
  }).sort({ createdAt: -1 })

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Photos</h1>
          <Link href="/dashboard/upload">
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload New Photo
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Pending ({pendingPhotos.length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approvedPhotos.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejectedPhotos.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <UserPhotoList photos={JSON.parse(JSON.stringify(pendingPhotos))} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Approved Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <UserPhotoList photos={JSON.parse(JSON.stringify(approvedPhotos))} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rejected" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Rejected Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <UserPhotoList photos={JSON.parse(JSON.stringify(rejectedPhotos))} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
