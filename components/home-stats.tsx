"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Users, ImageIcon, Coins } from "lucide-react"
import { cn } from "@/lib/utils"

interface Stats {
  totalUsers: number
  totalPhotos: number
  totalEarnings: number
}

export function HomeStats() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalPhotos: 0,
    totalEarnings: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/stats")
        const data = await response.json()

        // Animate the numbers counting up
        const duration = 2000 // 2 seconds
        const startTime = Date.now()

        const targetStats = {
          totalUsers: data.totalUsers || 1000000,
          totalPhotos: data.totalPhotos || 500000,
          totalEarnings: data.totalEarnings || 700000,
        }

        // Start with zeros
        setStats({
          totalUsers: 0,
          totalPhotos: 0,
          totalEarnings: 0,
        })

        // Animate the counting
        const interval = setInterval(() => {
          const elapsedTime = Date.now() - startTime
          const progress = Math.min(elapsedTime / duration, 1)

          setStats({
            totalUsers: Math.floor(progress * targetStats.totalUsers),
            totalPhotos: Math.floor(progress * targetStats.totalPhotos),
            totalEarnings: Math.floor(progress * targetStats.totalEarnings),
          })

          if (progress === 1) {
            clearInterval(interval)
          }
        }, 50)

        return () => clearInterval(interval)
      } catch (error) {
        console.error("Error fetching stats:", error)
        setStats({
          totalUsers: 1000000,
          totalPhotos: 500000,
          totalEarnings: 700000,
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statItems = [
    {
      icon: Users,
      value: stats.totalUsers.toLocaleString(),
      label: "Active Users",
      color: "text-blue-500",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      icon: ImageIcon,
      value: stats.totalPhotos.toLocaleString(),
      label: "Photos Uploaded",
      color: "text-green-500",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      icon: Coins,
      value: `$${stats.totalEarnings.toLocaleString()}`,
      label: "Earnings Paid",
      color: "text-amber-500",
      bgColor: "bg-amber-100 dark:bg-amber-900/20",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {statItems.map((item, index) => (
        <Card key={index}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className={cn("p-2 rounded-full", item.bgColor)}>
              {item.icon && <item.icon className={cn("h-6 w-6", item.color)} />}
            </div>
            <div>
              <div className="text-2xl font-bold">{item.value}</div>
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
