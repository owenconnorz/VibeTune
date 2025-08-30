"use client"
import { useEffect, useState, useRef, useCallback } from "react"
import { ArrowLeft, Terminal, Trash2, Download, Search, Pause, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"

interface LogEntry {
  id: string
  timestamp: string
  level: "CLIENT" | "SERVER" | "ERROR" | "WARN" | "INFO"
  message: string
  source?: string
}

export default function LogCatPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [levelFilter, setLevelFilter] = useState<string>("ALL")
  const [isPaused, setIsPaused] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const originalConsole = useRef<any>({})

  useEffect(() => {
    // Store original console methods
    originalConsole.current = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
    }

    const addLog = (level: LogEntry["level"], message: string, source?: string) => {
      if (isPaused) return

      const logEntry: LogEntry = {
        id: Date.now() + Math.random().toString(36),
        timestamp: new Date().toLocaleTimeString(),
        level,
        message: typeof message === "object" ? JSON.stringify(message, null, 2) : String(message),
        source,
      }

      setLogs((prev) => [...prev.slice(-999), logEntry]) // Keep last 1000 logs
    }

    // Override console methods
    console.log = (...args) => {
      originalConsole.current.log(...args)
      const message = args.map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : String(arg))).join(" ")
      if (message.includes("[v0]")) {
        addLog("CLIENT", message, "v0")
      } else {
        addLog("INFO", message)
      }
    }

    console.error = (...args) => {
      originalConsole.current.error(...args)
      const message = args.map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : String(arg))).join(" ")
      addLog("ERROR", message)
    }

    console.warn = (...args) => {
      originalConsole.current.warn(...args)
      const message = args.map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : String(arg))).join(" ")
      addLog("WARN", message)
    }

    console.info = (...args) => {
      originalConsole.current.info(...args)
      const message = args.map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : String(arg))).join(" ")
      addLog("INFO", message)
    }

    // Add initial log
    addLog("INFO", "Log Cat initialized - monitoring system logs", "LogCat")

    return () => {
      // Restore original console methods
      console.log = originalConsole.current.log
      console.error = originalConsole.current.error
      console.warn = originalConsole.current.warn
      console.info = originalConsole.current.info
    }
  }, [isPaused])

  useEffect(() => {
    let filtered = logs

    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.source?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (levelFilter !== "ALL") {
      filtered = filtered.filter((log) => log.level === levelFilter)
    }

    setFilteredLogs(filtered)
  }, [logs, searchTerm, levelFilter])

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [filteredLogs, autoScroll])

  const handleBack = useCallback(() => {
    router.back()
  }, [router])

  const clearLogs = useCallback(() => {
    setLogs([])
    console.log("[v0] Log Cat cleared")
  }, [])

  const exportLogs = useCallback(() => {
    const logText = logs
      .map((log) => `[${log.timestamp}] [${log.level}] ${log.source ? `[${log.source}] ` : ""}${log.message}`)
      .join("\n")

    const blob = new Blob([logText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `vibetune-logs-${new Date().toISOString().split("T")[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [logs])

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev)
    console.log(`[v0] Log Cat ${isPaused ? "resumed" : "paused"}`)
  }, [isPaused])

  const getLevelColor = (level: LogEntry["level"]) => {
    switch (level) {
      case "ERROR":
        return "text-red-400"
      case "WARN":
        return "text-yellow-400"
      case "CLIENT":
        return "text-blue-400"
      case "SERVER":
        return "text-green-400"
      default:
        return "text-gray-300"
    }
  }

  const getLevelBg = (level: LogEntry["level"]) => {
    switch (level) {
      case "ERROR":
        return "bg-red-900/20"
      case "WARN":
        return "bg-yellow-900/20"
      case "CLIENT":
        return "bg-blue-900/20"
      case "SERVER":
        return "bg-green-900/20"
      default:
        return "bg-gray-900/20"
    }
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white mr-4" onClick={handleBack}>
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <Terminal className="w-6 h-6 mr-2 text-green-400" />
          <h1 className="text-2xl font-semibold text-white">Log Cat</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={togglePause}>
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {isPaused ? "Resume" : "Pause"}
          </Button>
          <Button variant="ghost" size="sm" onClick={exportLogs}>
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={clearLogs}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="p-4 border-b border-zinc-800">
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-zinc-800 border-zinc-700 text-white"
            />
          </div>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white"
          >
            <option value="ALL">All Levels</option>
            <option value="CLIENT">Client</option>
            <option value="SERVER">Server</option>
            <option value="ERROR">Error</option>
            <option value="WARN">Warning</option>
            <option value="INFO">Info</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded"
            />
            Auto-scroll
          </label>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 font-mono text-sm">
        {filteredLogs.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Terminal className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No logs to display</p>
            <p className="text-xs mt-2">Logs will appear here as the app runs</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`p-2 rounded border-l-4 ${getLevelBg(log.level)} border-l-current ${getLevelColor(log.level)}`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xs text-gray-500 min-w-[80px]">{log.timestamp}</span>
                  <span className={`text-xs font-bold min-w-[60px] ${getLevelColor(log.level)}`}>[{log.level}]</span>
                  {log.source && <span className="text-xs text-purple-400 min-w-[40px]">[{log.source}]</span>}
                  <span className="flex-1 break-all">{log.message}</span>
                </div>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>

      <div className="p-4 border-t border-zinc-800 bg-zinc-800/50">
        <div className="flex justify-between items-center text-xs text-gray-400">
          <span>
            {filteredLogs.length} logs displayed ({logs.length} total)
          </span>
          <span className={`flex items-center gap-1 ${isPaused ? "text-yellow-400" : "text-green-400"}`}>
            <div className={`w-2 h-2 rounded-full ${isPaused ? "bg-yellow-400" : "bg-green-400 animate-pulse"}`} />
            {isPaused ? "Paused" : "Live"}
          </span>
        </div>
      </div>
    </div>
  )
}
