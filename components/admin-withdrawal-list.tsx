"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"

interface Withdrawal {
  _id: string
  amount: number
  fee?: number
  finalAmount?: number
  method: "paypal" | "gcash"
  accountDetails: string
  status: "pending" | "completed" | "rejected"
  createdAt: string
  processedAt?: string
  rejectionReason?: string
  userId: {
    _id: string
    name: string
    email: string
  }
}

interface AdminWithdrawalListProps {
  withdrawals: Withdrawal[]
  readOnly?: boolean
}

export function AdminWithdrawalList({ withdrawals, readOnly = false }: AdminWithdrawalListProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")

  const openConfirmDialog = (withdrawal: Withdrawal) => {
    if (readOnly) return

    setSelectedWithdrawal(withdrawal)
    setShowConfirmDialog(true)
  }

  const openRejectDialog = (withdrawal: Withdrawal) => {
    if (readOnly) return

    setSelectedWithdrawal(withdrawal)
    setRejectionReason("")
    setShowRejectDialog(true)
  }

  const handleComplete = async () => {
    if (!selectedWithdrawal) return

    setIsProcessing(true)

    try {
      const response = await fetch(`/api/admin/withdrawals/${selectedWithdrawal._id}/complete`, {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to complete withdrawal")
      }

      toast({
        title: "Withdrawal completed",
        description: "The withdrawal has been marked as completed.",
      })

      setShowConfirmDialog(false)
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedWithdrawal) return

    setIsProcessing(true)

    try {
      const response = await fetch(`/api/admin/withdrawals/${selectedWithdrawal._id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rejectionReason,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to reject withdrawal")
      }

      toast({
        title: "Withdrawal rejected",
        description: "The withdrawal has been rejected and funds returned to the user.",
      })

      setShowRejectDialog(false)
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (withdrawals.length === 0) {
    return <p>No withdrawal requests found.</p>
  }

  // Mobile view for small screens
  const renderMobileView = () => (
    <div className="space-y-4 md:hidden">
      {withdrawals.map((withdrawal) => (
        <Card key={withdrawal._id}>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium">{withdrawal.userId.name}</div>
                <Badge
                  variant={
                    withdrawal.status === "completed"
                      ? "default"
                      : withdrawal.status === "rejected"
                        ? "destructive"
                        : "outline"
                  }
                >
                  {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">{withdrawal.userId.email}</div>
              <div className="text-sm">
                <span className="font-medium">Request Amount:</span> ${withdrawal.amount.toFixed(2)}
              </div>
              {withdrawal.fee !== undefined && (
                <div className="text-sm">
                  <span className="font-medium">Fee:</span> ${withdrawal.fee.toFixed(2)}
                </div>
              )}
              {withdrawal.finalAmount !== undefined && (
                <div className="text-sm">
                  <span className="font-medium">Final Amount:</span> ${withdrawal.finalAmount.toFixed(2)}
                </div>
              )}
              <div className="text-sm">
                <span className="font-medium">Method:</span> {withdrawal.method === "paypal" ? "PayPal" : "GCash"}
              </div>
              <div className="text-sm">
                <span className="font-medium">Account:</span> {withdrawal.accountDetails}
              </div>
              <div className="text-sm">
                <span className="font-medium">Date:</span> {new Date(withdrawal.createdAt).toLocaleDateString()}
              </div>
              {withdrawal.rejectionReason && (
                <div className="text-sm">
                  <span className="font-medium">Rejection reason:</span> {withdrawal.rejectionReason}
                </div>
              )}
              {!readOnly && withdrawal.status === "pending" && (
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => openRejectDialog(withdrawal)}
                    disabled={isProcessing}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                  <Button className="flex-1" onClick={() => openConfirmDialog(withdrawal)} disabled={isProcessing}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Complete
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  // Desktop view for larger screens
  const renderDesktopView = () => (
    <div className="hidden md:block overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Request Amount</TableHead>
            <TableHead>Fee</TableHead>
            <TableHead>Final Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Status</TableHead>
            {!readOnly && <TableHead className="w-[150px]">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {withdrawals.map((withdrawal) => (
            <TableRow key={withdrawal._id}>
              <TableCell>
                <div className="font-medium">{withdrawal.userId.name}</div>
                <div className="text-sm text-muted-foreground">{withdrawal.userId.email}</div>
              </TableCell>
              <TableCell>{new Date(withdrawal.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>${withdrawal.amount.toFixed(2)}</TableCell>
              <TableCell>${withdrawal.fee !== undefined ? withdrawal.fee.toFixed(2) : "0.00"}</TableCell>
              <TableCell>
                $
                {withdrawal.finalAmount !== undefined
                  ? withdrawal.finalAmount.toFixed(2)
                  : withdrawal.amount.toFixed(2)}
              </TableCell>
              <TableCell>{withdrawal.method === "paypal" ? "PayPal" : "GCash"}</TableCell>
              <TableCell>
                <span className="max-w-[150px] truncate block">{withdrawal.accountDetails}</span>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    withdrawal.status === "completed"
                      ? "default"
                      : withdrawal.status === "rejected"
                        ? "destructive"
                        : "outline"
                  }
                >
                  {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                </Badge>
                {withdrawal.rejectionReason && (
                  <div className="text-xs text-muted-foreground mt-1 max-w-[150px] truncate">
                    {withdrawal.rejectionReason}
                  </div>
                )}
              </TableCell>
              {!readOnly && (
                <TableCell>
                  {withdrawal.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openRejectDialog(withdrawal)}
                        disabled={isProcessing}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                      <Button size="sm" onClick={() => openConfirmDialog(withdrawal)} disabled={isProcessing}>
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <>
      {renderMobileView()}
      {renderDesktopView()}

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Complete Withdrawal</DialogTitle>
            <DialogDescription>Confirm that you have sent the payment to the user&apos;s account.</DialogDescription>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-2">
              <div>
                <span className="font-medium">Request Amount:</span> ${selectedWithdrawal.amount.toFixed(2)}
              </div>
              {selectedWithdrawal.fee !== undefined && (
                <div>
                  <span className="font-medium">Fee:</span> ${selectedWithdrawal.fee.toFixed(2)}
                </div>
              )}
              <div>
                <span className="font-medium">Final Amount to Send:</span> $
                {selectedWithdrawal.finalAmount !== undefined
                  ? selectedWithdrawal.finalAmount.toFixed(2)
                  : selectedWithdrawal.amount.toFixed(2)}
              </div>
              <div>
                <span className="font-medium">Method:</span>{" "}
                {selectedWithdrawal.method === "paypal" ? "PayPal" : "GCash"}
              </div>
              <div>
                <span className="font-medium">Account:</span> {selectedWithdrawal.accountDetails}
              </div>
              <div>
                <span className="font-medium">User:</span> {selectedWithdrawal.userId.name} (
                {selectedWithdrawal.userId.email})
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleComplete} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Payment Sent"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reject Withdrawal</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this withdrawal. The funds will be returned to the user&apos;s
              balance.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Rejection reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isProcessing || !rejectionReason.trim()}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Reject and Return Funds"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
