"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Camera, Upload, DollarSign, UserPlus } from "lucide-react"
import { useSession } from "next-auth/react"

export function TutorialDialog() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [hasSeenTutorial, setHasSeenTutorial] = useState(true)

  useEffect(() => {
    const checkTutorialStatus = async () => {
      if (session?.user) {
        try {
          const response = await fetch("/api/users/tutorial-status")
          const data = await response.json()

          if (!data.hasSeenTutorial) {
            setHasSeenTutorial(false)
            setOpen(true)
          }
        } catch (error) {
          console.error("Error checking tutorial status:", error)
        }
      }
    }

    checkTutorialStatus()
  }, [session])

  const completeTutorial = async () => {
    try {
      await fetch("/api/users/complete-tutorial", { method: "POST" })
      setOpen(false)
    } catch (error) {
      console.error("Error completing tutorial:", error)
      setOpen(false)
    }
  }

  const steps = [
    {
      title: "Welcome to PhotoEarn!",
      description: "Learn how to earn money with your photos in just a few steps.",
      icon: Camera,
    },
    {
      title: "Upload Original Photos",
      description: "Take photos with your device and upload them. Our team will review them quickly.",
      icon: Upload,
    },
    {
      title: "Get Paid",
      description: "Earn money for each approved photo. Minimum withdrawal amount is just $1.",
      icon: DollarSign,
    },
    {
      title: "Invite Friends",
      description: "Share your invitation code and earn 25% commission on your friends' earnings!",
      icon: UserPlus,
    },
  ]

  const currentStep = steps[step - 1]

  return (
    <Dialog open={open && !hasSeenTutorial} onOpenChange={(open) => open === false && completeTutorial()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="mx-auto rounded-full bg-primary p-3 w-12 h-12 flex items-center justify-center mb-4">
            {currentStep.icon && <currentStep.icon className="h-6 w-6 text-primary-foreground" />}
          </div>
          <DialogTitle className="text-center">{currentStep.title}</DialogTitle>
          <DialogDescription className="text-center">{currentStep.description}</DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
          <div className="flex gap-1 justify-center">
            {steps.map((_, idx) => (
              <span
                key={idx}
                className={`block w-2 h-2 rounded-full ${idx + 1 === step ? "bg-primary" : "bg-muted-foreground/20"}`}
              />
            ))}
          </div>
          <div className="flex gap-2 justify-center">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
                Previous
              </Button>
            )}
            {step < steps.length ? (
              <Button onClick={() => setStep((s) => s + 1)}>Next</Button>
            ) : (
              <Button onClick={completeTutorial}>Get Started</Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
