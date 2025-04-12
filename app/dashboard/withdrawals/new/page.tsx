"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function NewWithdrawalPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [minWithdrawalAmount, setMinWithdrawalAmount] = useState(1)
  const [balance, setBalance] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [paypalFee, setPaypalFee] = useState(0)
  const [gcashFee, setGcashFee] = useState(0)
  const [calculatedFee, setCalculatedFee] = useState(0)
  const [finalAmount, setFinalAmount] = useState(0)
  const [withdrawalPlatforms, setWithdrawalPlatforms] = useState([
    { id: "paypal", name: "PayPal", fee: 0 },
    { id: "gcash", name: "GCash", fee: 0 },
  ])

  useEffect(() => {
    // Fetch minimum withdrawal amount and fees from settings
    const fetchSettings = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/settings")
        if (response.ok) {
          const data = await response.json()
          setMinWithdrawalAmount(data.minWithdrawalAmount || 1)
          setPaypalFee(data.paypalFee || 0)
          setGcashFee(data.gcashFee || 0)

          // Update platform fees
          setWithdrawalPlatforms([
            { id: "paypal", name: "PayPal", fee: data.paypalFee || 0 },
            { id: "gcash", name: "GCash", fee: data.gcashFee || 0 },
          ])
        }

        // Also fetch user balance
        const userResponse = await fetch("/api/users/me")
        if (userResponse.ok) {
          const userData = await userResponse.json()
          setBalance(userData.balance || 0)
        }
      } catch (error) {
        console.error("Error fetching settings:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  // Create a dynamic schema based on the current balance
  const createFormSchema = (minAmount: number, maxAmount: number) => {
    return z.object({
      amount: z.coerce
        .number()
        .min(minAmount, {
          message: `Minimum withdrawal amount is $${minAmount.toFixed(2)}`,
        })
        .max(maxAmount, {
          message: `Maximum withdrawal amount is $${maxAmount.toFixed(2)} (your current balance)`,
        }),
      method: z.enum(["paypal", "gcash"], {
        required_error: "Please select a payment method",
      }),
      accountDetails: z.string().min(1, {
        message: "Please enter your account details",
      }),
    })
  }

  // Create the form with dynamic schema
  const form = useForm<z.infer<ReturnType<typeof createFormSchema>>>({
    resolver: zodResolver(createFormSchema(minWithdrawalAmount, balance)),
    defaultValues: {
      amount: Math.min(minWithdrawalAmount, balance),
      method: "paypal",
      accountDetails: "",
    },
    mode: "onChange",
  })

  // Update form validation when minimum amount or balance changes
  useEffect(() => {
    form.reset({
      amount: Math.min(minWithdrawalAmount, balance),
      method: form.getValues("method"),
      accountDetails: form.getValues("accountDetails"),
    })
  }, [minWithdrawalAmount, balance, form])

  // Calculate fee when amount or method changes
  useEffect(() => {
    const amount = form.watch("amount") || 0
    const method = form.watch("method")

    const fee = method === "paypal" ? (amount * paypalFee) / 100 : (amount * gcashFee) / 100

    setCalculatedFee(fee)
    setFinalAmount(amount - fee)
  }, [form.watch("amount"), form.watch("method"), paypalFee, gcashFee])

  async function onSubmit(values: z.infer<ReturnType<typeof createFormSchema>>) {
    if (values.amount > balance) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough balance for this withdrawal",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/withdrawals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          fee: calculatedFee,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to create withdrawal request")
      }

      toast({
        title: "Success",
        description: "Your withdrawal request has been submitted.",
      })

      router.push("/dashboard/withdrawals")
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  // If balance is less than minimum withdrawal amount
  if (balance < minWithdrawalAmount) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">New Withdrawal</h1>

          <Card>
            <CardHeader>
              <CardTitle>Insufficient Balance</CardTitle>
              <CardDescription>Your current balance: ${balance.toFixed(2)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="warning">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You need at least ${minWithdrawalAmount.toFixed(2)} to make a withdrawal. Your current balance is $
                  {balance.toFixed(2)}.
                </AlertDescription>
              </Alert>
              <Button onClick={() => router.push("/dashboard")} className="w-full">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">New Withdrawal</h1>

        <Card>
          <CardHeader>
            <CardTitle>Withdrawal Details</CardTitle>
            <CardDescription>Your current balance: ${balance.toFixed(2)}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount ($)</FormLabel>
                      <FormControl>
                        <Input type="number" min={minWithdrawalAmount} max={balance} step={0.01} {...field} />
                      </FormControl>
                      <FormMessage />
                      <p className="text-sm text-muted-foreground">
                        Minimum withdrawal amount: ${minWithdrawalAmount.toFixed(2)}
                      </p>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="method"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Payment Method</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          {withdrawalPlatforms.map((platform) => (
                            <FormItem key={platform.id} className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value={platform.id} />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {platform.name} {platform.fee > 0 && `(${platform.fee}% fee)`}
                              </FormLabel>
                            </FormItem>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{form.watch("method") === "paypal" ? "PayPal Email" : "GCash Number"}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={form.watch("method") === "paypal" ? "your-email@example.com" : "09XXXXXXXXX"}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {calculatedFee > 0 && (
                  <div className="p-4 rounded-md bg-muted">
                    <h4 className="font-medium mb-2">Fee Calculation</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Withdrawal Amount:</span>
                        <span>${form.watch("amount")?.toFixed(2) || "0.00"}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Fee ({form.watch("method") === "paypal" ? paypalFee : gcashFee}%):</span>
                        <span>-${calculatedFee.toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-1 mt-1 font-medium flex justify-between">
                        <span>You'll receive:</span>
                        <span>${finalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard/withdrawals")}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Withdrawal Request"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
