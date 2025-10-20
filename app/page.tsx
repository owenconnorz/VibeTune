export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">Welcome to OpenTune</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">Your music streaming platform</p>
        </div>
      </main>
    </div>
  )
}
