"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { ChevronLeft, ChevronRight, LayoutDashboard, MessageSquare, Phone } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Conversations",
    href: "/conversations",
    icon: MessageSquare,
  },
  {
    label: "Webcall",
    href: "/webcall",
    icon: Phone,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r bg-background transition-all duration-200",
        isCollapsed ? "w-16" : "w-56"
      )}
    >
      <div className={cn("flex h-16 items-center border-b", isCollapsed ? "justify-center px-2" : "gap-2 px-2")}>
        <Image
          src="/HappyRobot.png"
          alt="HappyRobot"
          width={isCollapsed ? 28 : 192}
          height={isCollapsed ? 28 : 64}
          className={cn(isCollapsed ? "h-7 w-7 object-contain" : "h-12 w-full scale-90 object-cover")}
        />
        {!isCollapsed && (
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {isCollapsed && (
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="mb-2 flex w-full items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "flex rounded-md text-sm font-medium transition-colors",
                isCollapsed ? "items-center justify-center px-2 py-2" : "items-center gap-3 px-3 py-2",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {!isCollapsed && item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
