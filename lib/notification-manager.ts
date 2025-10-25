export class NotificationManager {
  private static instance: NotificationManager
  private permission: NotificationPermission = "default"
  private currentNotification: Notification | null = null

  private constructor() {
    if (typeof window !== "undefined" && "Notification" in window) {
      this.permission = Notification.permission
    }
  }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager()
    }
    return NotificationManager.instance
  }

  async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.log("[Notifications] Not supported in this browser")
      return false
    }

    if (this.permission === "granted") {
      return true
    }

    try {
      this.permission = await Notification.requestPermission()
      console.log("[Notifications] Permission:", this.permission)
      return this.permission === "granted"
    } catch (error) {
      console.error("[Notifications] Error requesting permission:", error)
      return false
    }
  }

  async showNowPlayingNotification(
    title: string,
    artist: string,
    thumbnail: string,
    isPlaying: boolean,
  ): Promise<void> {
    if (this.permission !== "granted") {
      console.log("[Notifications] Permission not granted")
      return
    }

    // Close existing notification
    if (this.currentNotification) {
      this.currentNotification.close()
    }

    try {
      // Use service worker notification if available
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready
        await registration.showNotification(title, {
          body: artist,
          icon: thumbnail,
          badge: "/icon-192.jpg",
          tag: "now-playing",
          requireInteraction: false,
          silent: true,
          actions: [
            {
              action: "previous",
              title: "Previous",
              icon: "/icon-192.jpg",
            },
            {
              action: isPlaying ? "pause" : "play",
              title: isPlaying ? "Pause" : "Play",
              icon: "/icon-192.jpg",
            },
            {
              action: "next",
              title: "Next",
              icon: "/icon-192.jpg",
            },
          ],
          data: {
            type: "now-playing",
            timestamp: Date.now(),
          },
        })
        console.log("[Notifications] Service worker notification shown")
      } else {
        // Fallback to regular notification
        this.currentNotification = new Notification(title, {
          body: artist,
          icon: thumbnail,
          badge: "/icon-192.jpg",
          tag: "now-playing",
          requireInteraction: false,
          silent: true,
        })

        this.currentNotification.onclick = () => {
          window.focus()
          this.currentNotification?.close()
        }

        console.log("[Notifications] Regular notification shown")
      }
    } catch (error) {
      console.error("[Notifications] Error showing notification:", error)
    }
  }

  async showDownloadCompleteNotification(songTitle: string): Promise<void> {
    if (this.permission !== "granted") {
      return
    }

    try {
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready
        await registration.showNotification("Download Complete", {
          body: `${songTitle} is now available offline`,
          icon: "/icon-192.jpg",
          badge: "/icon-192.jpg",
          tag: "download-complete",
          requireInteraction: false,
        })
      } else {
        new Notification("Download Complete", {
          body: `${songTitle} is now available offline`,
          icon: "/icon-192.jpg",
          badge: "/icon-192.jpg",
          tag: "download-complete",
        })
      }
    } catch (error) {
      console.error("[Notifications] Error showing download notification:", error)
    }
  }

  clearNotifications(): void {
    if (this.currentNotification) {
      this.currentNotification.close()
      this.currentNotification = null
    }
  }

  isSupported(): boolean {
    return typeof window !== "undefined" && "Notification" in window
  }

  hasPermission(): boolean {
    return this.permission === "granted"
  }
}

export const notificationManager = NotificationManager.getInstance()
