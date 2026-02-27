"use client"

import Image from "next/image"

export function DashboardHeader() {
  return (
    <header className="border-b">
      <div className="container flex h-16 items-center">
        <div className="flex items-center gap-2">
          <Image src="/HappyRobot.png" alt="HappyRobot" width={96} height={96} />
        </div>
      </div>
    </header>
  )
}
