"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Activity, Bell, Settings, History, HelpCircle } from "lucide-react"

const navItems = [
  { name: "대시보드", href: "/", icon: LayoutDashboard },
  { name: "심전도 모니터링", href: "/monitoring", icon: Activity },
  { name: "알림", href: "/alerts", icon: Bell },
  { name: "설정", href: "/settings", icon: Settings },
  { name: "기록", href: "/history", icon: History },
  { name: "도움말", href: "/help", icon: HelpCircle },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Activity className="h-6 w-6 text-red-500 mr-2" />
              <span className="text-lg font-semibold">ECG 모니터링 시스템</span>
            </Link>
          </div>
          <div className="hidden md:flex md:items-center md:space-x-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                    isActive ? "text-red-600 bg-red-50" : "text-gray-600 hover:text-red-600 hover:bg-red-50",
                  )}
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}

