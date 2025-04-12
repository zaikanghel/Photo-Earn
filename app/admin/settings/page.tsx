"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Save } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Settings {
  minWithdrawalAmount: number
  paypalFee: number
  gcashFee: number
}

export default function AdminSettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<Settings>({
    minWithdrawalAmount: 1,
    paypalFee: 0,
    gcashFee: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/settings")

      if (!response.ok) {
        throw new Error("Failed to fetch settings")
      }

      const data = await response.json()
      setSettings({
        minWithdrawalAmount: data.minWithdrawalAmount || 5,
        paypalFee: data.paypalFee || 0,
        gcashFee: data.gcashFee || 0,
      })
    } catch (error) {
      console.error("Error fetching settings:", error)
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setIsSaving(true)
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error("Failed to save settings")
      }

      toast({
        title: "Success",
        description: "Settings saved successfully",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (key: keyof Settings, value: string) => {
    const numValue = Number.parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0) {
      setSettings((prev) => ({ ...prev, [key]: numValue }))
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Admin Settings</h1>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="withdrawal">
            <TabsList>
              <TabsTrigger value="withdrawal">Withdrawal Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="withdrawal" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Withdrawal Settings</CardTitle>
                  <CardDescription>Configure withdrawal limits and fees</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="minWithdrawalAmount">Minimum Withdrawal Amount ($)</Label>
                    <Input
                      id="minWithdrawalAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={settings.minWithdrawalAmount}
                      onChange={(e) => handleChange("minWithdrawalAmount", e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Users must have at least this amount to request a withdrawal
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paypalFee">PayPal Fee (%)</Label>
                    <Input
                      id="paypalFee"
                      type="number"
                      min="0"
                      step="0.1"
                      value={settings.paypalFee}
                      onChange={(e) => handleChange("paypalFee", e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Fee percentage for PayPal withdrawals (0 for no fee)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gcashFee">GCash Fee (%)</Label>
                    <Input
                      id="gcashFee"
                      type="number"
                      min="0"
                      step="0.1"
                      value={settings.gcashFee}
                      onChange={(e) => handleChange("gcashFee", e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">Fee percentage for GCash withdrawals (0 for no fee)</p>
                  </div>

                  <Button onClick={saveSettings} disabled={isSaving} className="w-full">
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  )
}
