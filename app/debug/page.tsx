"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugPage() {
  const [diagnostics, setDiagnostics] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    runDiagnostics()
  }, [])

  const runDiagnostics = async () => {
    setLoading(true)
    const results: any = {}

    // Check if pages exist
    try {
      const videosResponse = await fetch("/videos")
      results.videosPageExists = videosResponse.status !== 404
      results.videosPageStatus = videosResponse.status
    } catch (error) {
      results.videosPageExists = false
      results.videosPageError = error
    }

    // Check API routes
    try {
      const epornerResponse = await fetch("/api/eporner/search?searchType=5&page=1&per_page=5")
      results.epornerAPIExists = epornerResponse.status !== 404
      results.epornerAPIStatus = epornerResponse.status
      if (epornerResponse.ok) {
        const data = await epornerResponse.json()
        results.epornerAPIData = data
      }
    } catch (error) {
      results.epornerAPIExists = false
      results.epornerAPIError = error
    }

    // Check library videos page
    try {
      const libraryVideosResponse = await fetch("/library/videos")
      results.libraryVideosExists = libraryVideosResponse.status !== 404
      results.libraryVideosStatus = libraryVideosResponse.status
    } catch (error) {
      results.libraryVideosExists = false
      results.libraryVideosError = error
    }

    // Check environment
    results.userAgent = navigator.userAgent
    results.currentURL = window.location.href
    results.timestamp = new Date().toISOString()

    // Check localStorage
    try {
      results.localStorageWorks = true
      localStorage.setItem("test", "test")
      localStorage.removeItem("test")
    } catch (error) {
      results.localStorageWorks = false
    }

    setDiagnostics(results)
    setLoading(false)
  }

  const testEpornerAPI = async () => {
    try {
      const response = await fetch("/api/eporner/search?searchType=2&query=test&page=1&per_page=3")
      const data = await response.json()
      console.log("Eporner API Test Result:", data)
      alert(
        `API Test: ${response.ok ? "SUCCESS" : "FAILED"}\nStatus: ${response.status}\nVideos: ${data.videos?.length || 0}`,
      )
    } catch (error) {
      console.error("Eporner API Test Error:", error)
      alert(`API Test FAILED: ${error}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Running diagnostics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">VibeTune Diagnostics</h1>

        <div className="grid gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Page Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Videos Page:</span>
                  <span className={diagnostics.videosPageExists ? "text-green-500" : "text-red-500"}>
                    {diagnostics.videosPageExists ? "✓ EXISTS" : "✗ MISSING"} ({diagnostics.videosPageStatus})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Library Videos Page:</span>
                  <span className={diagnostics.libraryVideosExists ? "text-green-500" : "text-red-500"}>
                    {diagnostics.libraryVideosExists ? "✓ EXISTS" : "✗ MISSING"} ({diagnostics.libraryVideosStatus})
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Eporner API:</span>
                  <span className={diagnostics.epornerAPIExists ? "text-green-500" : "text-red-500"}>
                    {diagnostics.epornerAPIExists ? "✓ WORKING" : "✗ FAILED"} ({diagnostics.epornerAPIStatus})
                  </span>
                </div>
                {diagnostics.epornerAPIData && (
                  <div className="text-sm text-muted-foreground">
                    Videos found: {diagnostics.epornerAPIData.videos?.length || 0}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Environment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>URL:</strong> {diagnostics.currentURL}
                </div>
                <div>
                  <strong>Timestamp:</strong> {diagnostics.timestamp}
                </div>
                <div>
                  <strong>LocalStorage:</strong> {diagnostics.localStorageWorks ? "✓ Working" : "✗ Failed"}
                </div>
                <div>
                  <strong>User Agent:</strong> {diagnostics.userAgent}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4 mb-6">
          <Button onClick={runDiagnostics}>Re-run Diagnostics</Button>
          <Button onClick={testEpornerAPI} variant="outline">
            Test Eporner API
          </Button>
          <Button onClick={() => (window.location.href = "/videos")} variant="outline">
            Go to Videos Page
          </Button>
          <Button onClick={() => (window.location.href = "/library/videos")} variant="outline">
            Go to Library Videos
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Full Diagnostic Data</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(diagnostics, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
