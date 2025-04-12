"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Copy, Loader2, RefreshCw, Share2, UserPlus } from "lucide-react"
import { useSession } from "next-auth/react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Invitation {
  _id: string
  code: string
  isUsed: boolean
  createdAt: string
  usedAt?: string
  usedBy?: {
    _id: string
    name: string
    email: string
  }
}

export default function InvitationsPage() {
  const { data: session } = useSession()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [userCode, setUserCode] = useState<string | null>(null)
  const [stats, setStats] = useState({ total: 0, used: 0, directInvites: 0 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchInvitations()
  }, [])

  const fetchInvitations = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/invitations")

      if (!response.ok) {
        throw new Error("Failed to fetch invitations")
      }

      const data = await response.json()
      setInvitations(data.invitations || [])
      setStats(data.stats || { total: 0, used: 0, directInvites: 0 })
      setUserCode(data.userCode)
    } catch (error) {
      console.error("Error fetching invitations:", error)
      toast({
        title: "Error",
        description: "Failed to load invitations",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Invitation code copied to clipboard",
    })
  }

  const shareInvitation = (code: string) => {
    if (navigator.share) {
      navigator
        .share({
          title: "Join PhotoEarn",
          text: "Use my invitation code to join PhotoEarn and start earning money from your photos!",
          url: `${window.location.origin}/register?code=${code}`,
        })
        .catch(console.error)
    } else {
      copyToClipboard(`${window.location.origin}/register?code=${code}`)
    }
  }

  const renderReferralLink = () => {
    if (!userCode) return null

    const referralLink = `${window.location.origin}/register?code=${userCode}`

    return (
      <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800">
        <h3 className="font-medium mb-2 flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-blue-500" />
          Your Referral Link
        </h3>
        <div className="flex items-center gap-2 overflow-hidden bg-white dark:bg-gray-950 rounded border p-2">
          <div className="truncate text-sm font-mono">{referralLink}</div>
          <Button variant="ghost" size="sm" className="shrink-0" onClick={() => copyToClipboard(referralLink)}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm mt-2 text-blue-700 dark:text-blue-400">
          Share this link with friends and earn 25% commission on their earnings!
        </p>
        <div className="mt-3 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-white dark:bg-gray-900"
            onClick={() => shareInvitation(userCode)}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-white dark:bg-gray-900"
            onClick={() =>
              window.open(
                `https://wa.me/?text=Join%20me%20on%20PhotoEarn!%20Use%20my%20invitation%20code%20${userCode}%20to%20sign%20up:%20${referralLink}`,
                "_blank",
              )
            }
          >
            WhatsApp
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-white dark:bg-gray-900"
            onClick={() =>
              window.open(
                `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=Join%20me%20on%20PhotoEarn!%20Use%20my%20invitation%20code%20${userCode}%20to%20sign%20up.`,
                "_blank",
              )
            }
          >
            Telegram
          </Button>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Invitations</h1>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Your Invitation Code</CardTitle>
            </CardHeader>
            <CardContent>
              {userCode ? (
                <div className="flex items-center gap-2">
                  <code className="rounded bg-muted px-2 py-1 font-mono text-lg">{userCode}</code>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(userCode)}>
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy code</span>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => shareInvitation(userCode)}>
                    <Share2 className="h-4 w-4" />
                    <span className="sr-only">Share code</span>
                  </Button>
                </div>
              ) : (
                <div className="text-amber-600">No invitation code found</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Friends Invited</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.directInvites}</div>
              <p className="text-sm text-muted-foreground">Friends who joined using your code</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Commission Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.used}</div>
              <p className="text-sm text-muted-foreground">Friends actively earning</p>
              <p className="text-sm text-muted-foreground mt-2">You earn 25% commission on each referral's earnings!</p>
            </CardContent>
          </Card>
        </div>

        {renderReferralLink()}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Invitation History</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchInvitations} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : invitations.length === 0 && stats.directInvites === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No invitation history found. Share your code to start earning!
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Used By</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.directInvites > 0 && (
                      <TableRow>
                        <TableCell className="font-mono">{userCode}</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>
                          <Badge variant="default">{stats.directInvites} Direct Invites</Badge>
                        </TableCell>
                        <TableCell>Multiple Users</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(userCode || "")}>
                              <Copy className="h-4 w-4" />
                              <span className="sr-only">Copy code</span>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => shareInvitation(userCode || "")}>
                              <Share2 className="h-4 w-4" />
                              <span className="sr-only">Share code</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                    {invitations.map((invitation) => (
                      <TableRow key={invitation._id}>
                        <TableCell className="font-mono">{invitation.code}</TableCell>
                        <TableCell>{new Date(invitation.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={invitation.isUsed ? "default" : "outline"}>
                            {invitation.isUsed ? "Used" : "Available"}
                          </Badge>
                        </TableCell>
                        <TableCell>{invitation.usedBy ? invitation.usedBy.name : "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyToClipboard(invitation.code)}
                              disabled={invitation.isUsed}
                            >
                              <Copy className="h-4 w-4" />
                              <span className="sr-only">Copy code</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => shareInvitation(invitation.code)}
                              disabled={invitation.isUsed}
                            >
                              <Share2 className="h-4 w-4" />
                              <span className="sr-only">Share code</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
