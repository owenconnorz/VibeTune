"use client"

import { useDiscordRPC } from "@/hooks/use-discord-rpc"

export function DiscordRPCIntegration() {
  useDiscordRPC()

  // This component doesn't render anything, it just handles Discord RPC logic
  return null
}
