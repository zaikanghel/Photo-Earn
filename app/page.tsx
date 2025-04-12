import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Camera, DollarSign, ShieldCheck, UserPlus } from "lucide-react"
import { HomeStats } from "@/components/home-stats"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Camera className="h-6 w-6" />
            <span>PhotoEarn</span>
          </div>
          <nav className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Sign Up</Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="py-12 md:py-24 lg:py-32 bg-gradient-to-b from-white to-slate-50 dark:from-gray-950 dark:to-gray-900">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                  Play, Upload, and Earn Real Money
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Upload photos from your device, get them approved, and earn real money. Share your unique code with
                  friends to earn 25% commission on their earnings!
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/register">
                  <Button size="lg" className="gap-1">
                    Start Playing <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/how-it-works">
                  <Button size="lg" variant="outline">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container px-4 md:px-6">
            <h2 className="text-2xl font-bold text-center mb-8">Join Thousands of Players</h2>
            <HomeStats />
          </div>
        </section>

        <section className="bg-muted py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
            <div className="grid gap-6 lg:grid-cols-4 lg:gap-12">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="rounded-full bg-primary p-3">
                  <Camera className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">1. Take Photos</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Take photos with your device and upload them to the game.
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="rounded-full bg-primary p-3">
                  <ShieldCheck className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">2. Get Approved</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Our team reviews your photos quickly to ensure they meet our standards.
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="rounded-full bg-primary p-3">
                  <DollarSign className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">3. Collect Earnings</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Earn $0.01 for each approved photo with a minimum withdrawal of just $1.
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="rounded-full bg-primary p-3">
                  <UserPlus className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">4. Invite Friends</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Share your unique code and earn 25% commission on your friends' earnings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-24 bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-950">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">Ready to Start Playing?</h2>
                <p className="mx-auto max-w-[600px] text-gray-500 dark:text-gray-400">
                  Join our game today, upload your photos, and start earning real money. Cash out from just $1!
                </p>
              </div>
              <Link href="/register">
                <Button size="lg">
                  Sign Up Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6">
        <div className="container flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            <span className="font-medium">PhotoEarn</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">© 2023 PhotoEarn. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="text-sm text-gray-500 hover:underline dark:text-gray-400">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-gray-500 hover:underline dark:text-gray-400">
              Terms of Service
            </Link>
            <Link href="/faq" className="text-sm text-gray-500 hover:underline dark:text-gray-400">
              FAQ
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
