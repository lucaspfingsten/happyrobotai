"use client"

import { useEffect, useState } from "react"

const ALLOWED_HOSTS = ["platform.happyrobot.ai"]

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ALLOWED_HOSTS.includes(parsed.hostname)
  } catch {
    return false
  }
}

export default function WebcallPage() {
  const [webcallUrl, setWebcallUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/webcall-url")
      .then((res) => res.json())
      .then((data) => {
        if (data.url && isAllowedUrl(data.url)) {
          setWebcallUrl(data.url)
        } else if (data.url) {
          setError("Webcall URL points to an untrusted domain.")
        } else {
          setError("No webcall URL configured. Set WEBCALL_URL in your environment.")
        }
      })
      .catch(() => setError("Failed to load webcall configuration."))
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
            {error ?? "Loading..."}
          </div>
        )}
      </div>
    </div>
  )
}
