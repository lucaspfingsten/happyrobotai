"use client"

import { useEffect, useState } from "react"

export default function WebcallPage() {
  const [webcallUrl, setWebcallUrl] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/webcall-url")
      .then((res) => res.json())
      .then((data) => setWebcallUrl(data.url || null))
      .catch(() => setWebcallUrl(null))
  }, [])

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-6 py-4">
        <h1 className="text-xl font-semibold">Webcall</h1>
        <p className="text-sm text-muted-foreground">
          Test your HappyRobot agent via webcall
        </p>
      </div>
      <div className="flex-1">
        {webcallUrl ? (
          <iframe
            src={webcallUrl}
            className="h-full w-full border-0"
            allow="microphone"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            {webcallUrl === null ? "Loading..." : "No webcall URL configured. Set WEBCALL_URL in your environment."}
          </div>
        )}
      </div>
    </div>
  )
}
