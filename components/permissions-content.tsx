"use client"

import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { StorageManager } from "@/components/storage-manager"
import { DevicePermissions } from "@/components/device-permissions"

export function PermissionsContent() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background z-30 border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-2xl font-bold">Permissions</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-4 max-w-2xl">
        <p className="text-sm text-muted-foreground px-2">
          Manage app permissions for the best experience on your device
        </p>

        <DevicePermissions />
        <StorageManager />
      </div>
    </div>
  )
}
