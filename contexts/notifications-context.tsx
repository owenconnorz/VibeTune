"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"

export interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error" | "plugin-update"
  timestamp: Date
  read: boolean
  actionUrl?: string
  pluginId?: string
  version?: string
}

interface NotificationsContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
  requestPermission: () => Promise<boolean>
  showDeviceNotification: (title: string, message: string, options?: NotificationOptions) => void
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationsContext)
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationsProvider")
  }
  return context
}

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [permissionGranted, setPermissionGranted] = useState(false)

  // Load notifications from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("app-notifications")
    if (stored) {
      try {
        const parsed = JSON.parse(stored).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }))
        setNotifications(parsed)
      } catch (error) {
        console.error("[v0] Failed to load notifications:", error)
      }
    }

    // Check notification permission
    if ("Notification" in window) {
      setPermissionGranted(Notification.permission === "granted")
    }
  }, [])

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("app-notifications", JSON.stringify(notifications))
  }, [notifications])

  const unreadCount = notifications.filter((n) => !n.read).length

  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
      const newNotification: Notification = {
        ...notification,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        read: false,
      }

      setNotifications((prev) => [newNotification, ...prev].slice(0, 100)) // Keep only last 100 notifications

      // Show device notification if permission granted
      if (permissionGranted && "Notification" in window) {
        showDeviceNotification(notification.title, notification.message, {
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          tag: notification.type === "plugin-update" ? `plugin-${notification.pluginId}` : undefined,
        })
      }
    },
    [permissionGranted],
  )

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!("Notification" in window)) {
      console.warn("[v0] Notifications not supported")
      return false
    }

    if (Notification.permission === "granted") {
      setPermissionGranted(true)
      return true
    }

    if (Notification.permission === "denied") {
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      const granted = permission === "granted"
      setPermissionGranted(granted)
      return granted
    } catch (error) {
      console.error("[v0] Failed to request notification permission:", error)
      return false
    }
  }, [])

  const showDeviceNotification = useCallback(
    (title: string, message: string, options?: NotificationOptions) => {
      if (!permissionGranted || !("Notification" in window)) return

      try {
        const notification = new Notification(title, {
          body: message,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          ...options,
        })

        // Auto-close after 5 seconds
        setTimeout(() => {
          notification.close()
        }, 5000)
      } catch (error) {
        console.error("[v0] Failed to show device notification:", error)
      }
    },
    [permissionGranted],
  )

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
        requestPermission,
        showDeviceNotification,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}
