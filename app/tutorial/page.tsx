import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Upload, DollarSign, UserPlus, ArrowRight } from "lucide-react"

export default function TutorialPage() {
  const steps = [
    {
      title: "Take and Upload Photos",
      description:
        "Take photos with your device camera and upload them to the game. Make sure they follow our quality guidelines for the best chance of approval.",
      icon: Camera,
      color: "text-blue-500 bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Wait for Approval",
      description:
        "Our team will review your photos. This usually takes 1-2 business days. You'll get a notification once your photo is reviewed.",
      icon: Upload,
      color: "text-green-500 bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Collect Your Earnings",
      description:
        "Each approved photo earns you $0.01. You can withdraw your earnings once you reach the minimum balance of $1. We support PayPal and GCash with minimal fees.",
      icon: DollarSign,
      color: "text-amber-500 bg-amber-100 dark:bg-amber-900/20",
    },
    {
      title: "Share Your Code",
      description:
        "Every player gets a unique invitation code. Share it with friends and earn 25% commission on their earnings forever!",
      icon: UserPlus,
      color: "text-purple-500 bg-purple-100 dark:bg-purple-900/20",
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-3xl font-bold">How PhotoEarn Works</h1>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        <div className="space-y-6">
          {steps.map((step, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-start gap-4">
                <div className={`p-2 rounded-lg ${step.color}`}>
                  <step.icon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>
                    Step {index + 1}: {step.title}
                  </CardTitle>
                  <CardDescription className="mt-1.5 text-base">{step.description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-100 dark:border-blue-800">
          <CardHeader>
            <CardTitle>Ready to Start Playing?</CardTitle>
            <CardDescription>Start uploading your photos or invite friends to earn together!</CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col sm:flex-row gap-4">
            <Link href="/dashboard/upload" className="w-full">
              <Button className="w-full">
                Upload Your First Photo <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard/invitations" className="w-full">
              <Button variant="outline" className="w-full">
                Invite Friends <UserPlus className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  )
}
