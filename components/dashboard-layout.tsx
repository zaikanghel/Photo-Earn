"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  Camera,
  Home,
  Upload,
  ImageIcon,
  DollarSign,
  LogOut,
  Menu,
  X,
  Users,
  CheckCircle,
  UserPlus,
  Settings,
  CreditCard,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { NotificationDropdown } from "@/components/notification-dropdown"
import { AdminNotificationDropdown } from "@/components/admin-notification-dropdown"
import { TutorialDialog } from "@/components/tutorial-dialog"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && sidebarOpen) {
        const sidebar = document.getElementById("sidebar")
        const toggleButton = document.getElementById("sidebar-toggle")

        if (
          sidebar &&
          !sidebar.contains(event.target as Node) &&
          toggleButton &&
          !toggleButton.contains(event.target as Node)
        ) {
          setSidebarOpen(false)
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isMobile, sidebarOpen])

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [pathname, isMobile])

  const isAdmin = session?.user?.role === "admin"

  const userNavItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      title: "Upload Photo",
      href: "/dashboard/upload",
      icon: Upload,
    },
    {
      title: "My Photos",
      href: "/dashboard/photos",
      icon: ImageIcon,
    },
    {
      title: "Withdrawals",
      href: "/dashboard/withdrawals",
      icon: DollarSign,
    },
    {
      title: "Invitations",
      href: "/dashboard/invitations",
      icon: UserPlus,
    },
  ]

  const adminNavItems = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: Home,
    },
    {
      title: "Users",
      href: "/admin/users",
      icon: Users,
    },
    {
      title: "Photo Approvals",
      href: "/admin/photos",
      icon: CheckCircle,
    },
    {
      title: "Withdrawal Requests",
      href: "/admin/withdrawals",
      icon: DollarSign,
    },
    {
      title: "Payment Platforms",
      href: "/admin/platforms",
      icon: CreditCard,
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: Settings,
    },
  ]

  const navItems = isAdmin ? adminNavItems : userNavItems

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b bg-background">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Button
              id="sidebar-toggle"
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              <span className="sr-only">Toggle menu</span>
            </Button>
            <Link href={isAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-2 font-bold">
              <Camera className="h-5 w-5" />
              <span className="truncate">PhotoEarn</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin ? <AdminNotificationDropdown /> : <NotificationDropdown />}
            <span className="hidden text-sm md:inline-block truncate max-w-[150px]">{session?.user?.name}</span>
            <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
              <LogOut className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Log out</span>
            </Button>
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        <aside
          id="sidebar"
          className={cn(
            "fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r bg-background transition-transform md:static md:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-16 items-center border-b px-4 md:h-[65px]">
            <Link href={isAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-2 font-bold">
              <Camera className="h-5 w-5" />
              <span>PhotoEarn</span>
            </Link>
          </div>
          <nav className="flex-1 overflow-auto p-4">
            <ul className="grid gap-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                      pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="border-t p-4">
            <Button variant="outline" className="w-full justify-start" onClick={() => signOut({ callbackUrl: "/" })}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && isMobile && (
          <div className="fixed inset-0 z-10 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <main className="flex-1 overflow-auto">
          <div className="container py-6 px-4 md:px-6">{children}</div>
        </main>
      </div>

      {/* Add the tutorial dialog */}
      <TutorialDialog />
    </div>
  )
}
