"use client"

import { ArrowLeft, Package, Bug, Sparkles, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import changelogData from "@/data/changelog.json"

export default function ChangelogPage() {
  const router = useRouter()

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "release":
        return <Package className="w-5 h-5" />
      case "update":
        return <Sparkles className="w-5 h-5" />
      case "bugfix":
        return <Bug className="w-5 h-5" />
      default:
        return <Info className="w-5 h-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "release":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "update":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "bugfix":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "features":
        return "✨"
      case "bug fixes":
        return "🐛"
      case "improvements":
        return "⚡"
      case "player":
        return "🎵"
      case "interface":
        return "🎨"
      default:
        return "📝"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background z-30 border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">What's New</h1>
              <p className="text-sm text-muted-foreground">Version {changelogData.version}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6 max-w-2xl pb-32">
        {changelogData.updates.map((update, index) => (
          <div key={index} className="bg-card rounded-2xl p-6 space-y-4">
            {/* Update Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${getTypeColor(update.type)} flex items-center justify-center`}>
                  {getTypeIcon(update.type)}
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{update.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {new Date(update.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="shrink-0">
                v{update.version}
              </Badge>
            </div>

            {/* Changes */}
            <div className="space-y-4 pt-2">
              {update.changes.map((change, changeIndex) => (
                <div key={changeIndex} className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <span>{getCategoryIcon(change.category)}</span>
                    {change.category}
                  </h3>
                  <ul className="space-y-2 pl-6">
                    {change.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="text-sm text-foreground/90 list-disc">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Footer Info */}
        <div className="bg-muted/50 rounded-2xl p-6 text-center space-y-2">
          <p className="text-sm text-muted-foreground">Updates are tracked automatically from GitHub commits</p>
          <p className="text-xs text-muted-foreground">
            Last updated: {new Date(changelogData.updates[0].date).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  )
}
