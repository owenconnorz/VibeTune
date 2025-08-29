"use client"

import type React from "react"
import { useState } from "react"
import { useNotifications } from "@/contexts/notifications-context"
import { Bell, X, Check, CheckCheck, Trash2, Settings, Download } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export const NotificationsManager: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll, requestPermission } =
    useNotifications()

  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState<"all" | "unread" | "plugin-updates">("all")

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "unread") return !notification.read
    if (filter === "plugin-updates") return notification.type === "plugin-update"
    return true
  })

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }

    if (notification.actionUrl) {
      window.open(notification.actionUrl, "_blank")
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "plugin-update":
        return <Download className="w-4 h-4 text-blue-500" />
      case "success":
        return <Check className="w-4 h-4 text-green-500" />
      case "warning":
        return <Settings className="w-4 h-4 text-yellow-500" />
      case "error":
        return <X className="w-4 h-4 text-red-500" />
      default:
        return <Bell className="w-4 h-4 text-blue-500" />
    }
  }

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Notifications</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-2 text-sm">
              <button
                onClick={() => setFilter("all")}
                className={`px-2 py-1 rounded ${filter === "all" ? "bg-blue-500 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`px-2 py-1 rounded ${filter === "unread" ? "bg-blue-500 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
              >
                Unread ({unreadCount})
              </button>
              <button
                onClick={() => setFilter("plugin-updates")}
                className={`px-2 py-1 rounded ${filter === "plugin-updates" ? "bg-blue-500 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
              >
                Plugins
              </button>
            </div>
          </div>

          {/* Actions */}
          {notifications.length > 0 && (
            <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex space-x-2">
              <button
                onClick={markAllAsRead}
                className="flex items-center space-x-1 px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              >
                <CheckCheck className="w-3 h-3" />
                <span>Mark all read</span>
              </button>
              <button
                onClick={clearAll}
                className="flex items-center space-x-1 px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-red-600"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear all</span>
              </button>
              <button
                onClick={requestPermission}
                className="flex items-center space-x-1 px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              >
                <Bell className="w-3 h-3" />
                <span>Enable notifications</span>
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {filter === "unread"
                  ? "No unread notifications"
                  : filter === "plugin-updates"
                    ? "No plugin updates"
                    : "No notifications"}
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    !notification.read ? "bg-blue-50 dark:bg-blue-900/20" : ""
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">{notification.title}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeNotification(notification.id)
                          }}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                      </p>
                      {notification.version && (
                        <span className="inline-block bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs px-2 py-1 rounded mt-1">
                          v{notification.version}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
