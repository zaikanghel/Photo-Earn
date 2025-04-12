"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

interface AdminNotification {
  _id: string
  title: string
  message: string
  type: "new_user" | "photo_pending" | "withdrawal_pending" | "system"
  isRead: boolean
  createdAt: string
  relatedId?: string
  relatedModel?: string
}

export function AdminNotificationDropdown() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  const unreadCount = notifications.filter((n) => !n.isRead).length

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/notifications")
      if (!response.ok) {
        throw new Error("Failed to fetch notifications")
      }
      const data = await response.json()
      setNotifications(data.notifications)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationClick = async (notification: AdminNotification) => {
    try {
      // Mark as read
      if (!notification.isRead) {
        const response = await fetch(`/api/admin/notifications/${notification._id}/read`, {
          method: "POST",
        })

        if (!response.ok) {
          throw new Error("Failed to mark notification as read")
        }

        // Update local state
        setNotifications(notifications.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n)))
      }

      // Navigate based on notification type
      if (notification.type === "photo_pending") {
        router.push("/admin/photos")
      } else if (notification.type === "withdrawal_pending") {
        router.push("/admin/withdrawals")
      } else if (notification.type === "new_user") {
        router.push("/admin/users")
      }

      setOpen(false)
    } catch (error) {
      console.error("Error handling notification:", error)
      toast({
        title: "Error",
        description: "Failed to process notification",
        variant: "destructive",
      })
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/admin/notifications/read-all", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read")
      }

      // Update local state
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })))

      toast({
        title: "Success",
        description: "All notifications marked as read",
      })
    } catch (error) {
      console.error("Error marking all as read:", error)
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      })
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_user":
        return "👤"
      case "photo_pending":
        return "🖼️"
      case "withdrawal_pending":
        return "💰"
      default:
        return "🔔"
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0"
              variant="destructive"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2 border-b">
          <h3 className="font-medium">Admin Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification._id}
                className={`flex flex-col items-start p-3 cursor-pointer ${!notification.isRead ? "bg-muted/50" : ""}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex w-full items-center gap-2">
                  <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                  <div className="font-medium flex-1">{notification.title}</div>
                  {!notification.isRead && <Badge variant="default" className="h-2 w-2 rounded-full p-0" />}
                </div>
                <div className="text-sm text-muted-foreground">{notification.message}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(notification.createdAt).toLocaleString()}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
