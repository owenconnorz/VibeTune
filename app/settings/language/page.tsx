"use client"
import { useCallback } from "react"
import { ArrowLeft, Globe, Music, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useSettings } from "@/contexts/settings-context"

const LANGUAGES = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "zh", name: "Chinese", nativeName: "中文" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
]

const REGIONS = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "IN", name: "India" },
  { code: "RU", name: "Russia" },
  { code: "CN", name: "China" },
]

export default function LanguageSettingsPage() {
  const router = useRouter()
  const { languageSettings, setLanguageSettings } = useSettings()

  const handleAppLanguageChange = useCallback(
    (language: string) => {
      setLanguageSettings({
        ...languageSettings,
        appLanguage: language,
      })
    },
    [languageSettings, setLanguageSettings],
  )

  const handleSearchLanguageChange = useCallback(
    (language: string) => {
      setLanguageSettings({
        ...languageSettings,
        searchLanguage: language,
      })
    },
    [languageSettings, setLanguageSettings],
  )

  const handleRegionChange = useCallback(
    (region: string) => {
      setLanguageSettings({
        ...languageSettings,
        region: region,
      })
    },
    [languageSettings, setLanguageSettings],
  )

  const getLanguageName = (code: string) => {
    const lang = LANGUAGES.find((l) => l.code === code)
    return lang ? `${lang.nativeName} (${lang.name})` : code
  }

  const getRegionName = (code: string) => {
    const region = REGIONS.find((r) => r.code === code)
    return region ? region.name : code
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <header className="flex items-center p-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-300 hover:text-white mr-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-2xl font-semibold text-white">Language & Region</h1>
      </header>

      <div className="px-4 pb-6 space-y-6">
        {/* App Language Section */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Globe className="w-5 h-5" />
              App Language
            </CardTitle>
            <CardDescription className="text-gray-400">Choose the language for the app interface</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={languageSettings.appLanguage} onValueChange={handleAppLanguageChange}>
              <SelectTrigger className="bg-zinc-700 border-zinc-600 text-white">
                <SelectValue placeholder="Select app language" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-700 border-zinc-600">
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code} className="text-white hover:bg-zinc-600">
                    {lang.nativeName} ({lang.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-400 mt-2">Currently: {getLanguageName(languageSettings.appLanguage)}</p>
          </CardContent>
        </Card>

        {/* Music Search Language Section */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Music className="w-5 h-5" />
              Music Search Language
            </CardTitle>
            <CardDescription className="text-gray-400">
              Preferred language for music search results and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={languageSettings.searchLanguage} onValueChange={handleSearchLanguageChange}>
              <SelectTrigger className="bg-zinc-700 border-zinc-600 text-white">
                <SelectValue placeholder="Select search language" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-700 border-zinc-600">
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code} className="text-white hover:bg-zinc-600">
                    {lang.nativeName} ({lang.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-400 mt-2">Currently: {getLanguageName(languageSettings.searchLanguage)}</p>
            <div className="mt-3 p-3 bg-zinc-700/50 rounded-lg">
              <p className="text-sm text-gray-300">
                This affects the home feed, trending music, and search results. English songs will still appear, but
                you'll see more content in your preferred language.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Region Section */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Region
            </CardTitle>
            <CardDescription className="text-gray-400">
              Your region affects trending music and regional content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={languageSettings.region} onValueChange={handleRegionChange}>
              <SelectTrigger className="bg-zinc-700 border-zinc-600 text-white">
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-700 border-zinc-600">
                {REGIONS.map((region) => (
                  <SelectItem key={region.code} value={region.code} className="text-white hover:bg-zinc-600">
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-400 mt-2">Currently: {getRegionName(languageSettings.region)}</p>
          </CardContent>
        </Card>

        {/* Preview Section */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white">Current Settings</CardTitle>
            <CardDescription className="text-gray-400">Your language and region preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">App Language:</span>
              <span className="text-white font-medium">{getLanguageName(languageSettings.appLanguage)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Music Search:</span>
              <span className="text-white font-medium">{getLanguageName(languageSettings.searchLanguage)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Region:</span>
              <span className="text-white font-medium">{getRegionName(languageSettings.region)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
