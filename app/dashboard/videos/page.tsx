import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Videos - OpenTune",
  description: "Watch videos on OpenTune",
}

export default function VideosPage() {
  return (
    <div className="flex flex-col h-screen pb-20">
      <header className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <h1 className="text-2xl font-bold">Videos</h1>
      </header>
      <main className="flex-1 overflow-auto">
        {/* You can add your old website content here */}
        <div className="p-4">
          <p className="text-muted-foreground">Videos content will be displayed here.</p>
        </div>
      </main>
    </div>
  )
}
