"use client"

import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Info } from "lucide-react"

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
}

interface WithdrawalListProps {
  withdrawals: Withdrawal[]
}

export function WithdrawalList({ withdrawals }: WithdrawalListProps) {
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
                <div className="font-medium">${withdrawal.amount.toFixed(2)}</div>
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
              {withdrawal.fee !== undefined && withdrawal.fee > 0 && (
                <div className="text-sm">
                  <span className="font-medium">Fee:</span> ${withdrawal.fee.toFixed(2)}
                </div>
              )}
              {withdrawal.finalAmount !== undefined && (
                <div className="text-sm">
                  <span className="font-medium">You'll receive:</span> ${withdrawal.finalAmount.toFixed(2)}
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
              {withdrawal.processedAt && (
                <div className="text-sm">
                  <span className="font-medium">Processed:</span>{" "}
                  {new Date(withdrawal.processedAt).toLocaleDateString()}
                </div>
              )}
              {withdrawal.rejectionReason && (
                <div className="text-sm">
                  <span className="font-medium">Reason:</span> {withdrawal.rejectionReason}
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
    <div className="hidden md:block overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Request Amount</TableHead>
            <TableHead>Fee</TableHead>
            <TableHead>Final Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {withdrawals.map((withdrawal) => (
            <TableRow key={withdrawal._id}>
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
              </TableCell>
              <TableCell>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Info className="h-4 w-4" />
                      <span className="sr-only">Details</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Withdrawal Details</DialogTitle>
                      <DialogDescription>
                        Withdrawal request from {new Date(withdrawal.createdAt).toLocaleString()}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="font-medium">Request Amount:</div>
                        <div>${withdrawal.amount.toFixed(2)}</div>

                        {withdrawal.fee !== undefined && withdrawal.fee > 0 && (
                          <>
                            <div className="font-medium">Fee:</div>
                            <div>${withdrawal.fee.toFixed(2)}</div>
                          </>
                        )}

                        {withdrawal.finalAmount !== undefined && (
                          <>
                            <div className="font-medium">Final Amount:</div>
                            <div>${withdrawal.finalAmount.toFixed(2)}</div>
                          </>
                        )}

                        <div className="font-medium">Method:</div>
                        <div>{withdrawal.method === "paypal" ? "PayPal" : "GCash"}</div>

                        <div className="font-medium">Account:</div>
                        <div>{withdrawal.accountDetails}</div>

                        <div className="font-medium">Status:</div>
                        <div>
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

                        <div className="font-medium">Requested:</div>
                        <div>{new Date(withdrawal.createdAt).toLocaleString()}</div>

                        {withdrawal.processedAt && (
                          <>
                            <div className="font-medium">Processed:</div>
                            <div>{new Date(withdrawal.processedAt).toLocaleString()}</div>
                          </>
                        )}
                      </div>

                      {withdrawal.rejectionReason && (
                        <div>
                          <div className="font-medium mb-1">Rejection Reason:</div>
                          <div className="p-3 bg-muted rounded-md">{withdrawal.rejectionReason}</div>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </TableCell>
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
    </>
  )
}
