"use client"

import { useState } from "react"
import { useSettings } from "@/contexts/settings-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Calendar, Shield } from "lucide-react"

export function AgeVerificationModal() {
  const { showAgeVerification, setAgeVerified, setShowAgeVerification } = useSettings()
  const [birthDate, setBirthDate] = useState("")
  const [error, setError] = useState("")

  if (!showAgeVerification) return null

  const handleVerification = () => {
    if (!birthDate) {
      setError("Please enter your birth date")
      return
    }

    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }

    if (age >= 18) {
      setAgeVerified(true)
      setError("")
    } else {
      setError("You must be 18 or older to access adult content")
    }
  }

  const handleDecline = () => {
    setShowAgeVerification(false)
    setError("")
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-700">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-orange-500" />
          </div>
          <CardTitle className="text-white text-xl">Age Verification Required</CardTitle>
          <CardDescription className="text-gray-400">
            You must be 18 or older to access adult content on this platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-200">
              <p className="font-medium mb-1">Privacy Notice</p>
              <p>Your birth date is only used for age verification and is stored locally on your device.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthdate" className="text-white flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Birth Date
            </Label>
            <Input
              id="birthdate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
              max={new Date().toISOString().split("T")[0]}
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleDecline}
              variant="outline"
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent"
            >
              Cancel
            </Button>
            <Button onClick={handleVerification} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
              Verify Age
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            By proceeding, you confirm that you are 18 years of age or older and agree to view adult content.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
