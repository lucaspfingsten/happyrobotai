import { useEffect, useState } from "react"

let cachedKey: string | null = null

export function useApiKey() {
  const [apiKey, setApiKey] = useState<string>(cachedKey ?? "")

  useEffect(() => {
    if (cachedKey) return
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        cachedKey = data.apiKey ?? ""
        setApiKey(cachedKey)
      })
      .catch(() => {})
  }, [])

  return apiKey
}
