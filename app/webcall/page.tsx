"use client"

export default function WebcallPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-6 py-4">
        <h1 className="text-xl font-semibold">Webcall</h1>
        <p className="text-sm text-muted-foreground">
          Test your HappyRobot agent via webcall
        </p>
      </div>
      <div className="flex-1">
        <iframe
          src="https://platform.happyrobot.ai/deployments/8z5zx8giplna/dod6307c03pn"
          className="h-full w-full border-0"
          allow="microphone"
        />
      </div>
    </div>
  )
}
