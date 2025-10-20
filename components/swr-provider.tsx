"use client"

import { SWRConfig } from "swr"
import type { ReactNode } from "react"

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 10000,
        errorRetryCount: 3,
        errorRetryInterval: 5000,
        shouldRetryOnError: true,
        focusThrottleInterval: 60000,
      }}
    >
      {children}
    </SWRConfig>
  )
}
