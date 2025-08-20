import { Bell, Search, MoreVertical, Play, SkipForward, Home, Compass, Library } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function OpenTunePage() {
  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">♪</span>
          </div>
          <h1 className="text-xl font-semibold text-white">OpenTune</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white">
            <Bell className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white">
            <Search className="w-5 h-5" />
          </Button>
          <Avatar className="w-8 h-8">
            <AvatarImage src="/diverse-profile-avatars.png" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="flex gap-8 px-4 py-4 bg-zinc-800">
        <button className="text-gray-300 hover:text-white font-medium">History</button>
        <button className="text-gray-300 hover:text-white font-medium">Stats</button>
        <button className="text-gray-300 hover:text-white font-medium">Liked</button>
        <button className="text-gray-300 hover:text-white font-medium">Downloaded</button>
      </nav>

      <div className="px-4 pb-24">
        {/* Quick picks */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-yellow-400 mb-6">Quick picks</h2>
          <div className="space-y-4">
            {/* Beautiful - Eminem */}
            <div className="flex items-center gap-4">
              <img src="/abstract-music-album-cover.png" alt="Beautiful album cover" className="w-15 h-15 rounded-lg" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">Beautiful</h3>
                <p className="text-gray-400">Eminem</p>
              </div>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>

            {/* The Look - Roxette */}
            <div className="flex items-center gap-4">
              <img src="/roxette-the-look-album-cover.png" alt="The Look album cover" className="w-15 h-15 rounded-lg" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">The Look</h3>
                <p className="text-gray-400">Roxette</p>
              </div>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>

            {/* Sucker for Pain */}
            <div className="flex items-center gap-4">
              <img
                src="/suicide-squad-soundtrack-album-cover.png"
                alt="Sucker for Pain album cover"
                className="w-15 h-15 rounded-lg"
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">
                  Sucker for Pain (feat. Logic, Ty Dolla $ign & X Ambassadors)
                </h3>
                <p className="text-gray-400">Imagine Dragons, Wiz Khalifa,...</p>
              </div>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>

            {/* Be Yourself (Instrumental) */}
            <div className="flex items-center gap-4">
              <img src="/sparsh-shah-album-cover.png" alt="Be Yourself album cover" className="w-15 h-15 rounded-lg" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">Be Yourself (Instrumental)</h3>
                <p className="text-gray-400">Sparsh Shah</p>
              </div>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Morning Mood Boost */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-yellow-400 mb-6">Morning Mood Boost</h2>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {/* 80s Sing-Alongs */}
            <div className="flex-shrink-0 w-48">
              <div className="relative rounded-lg overflow-hidden mb-3">
                <img src="/80s-cassette-tape.png" alt="80s Sing-Alongs" className="w-full h-48 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <h3 className="text-white font-bold text-lg">80s</h3>
                  <h4 className="text-white font-bold text-lg">Sing-Alongs</h4>
                </div>
              </div>
              <h3 className="text-white font-semibold truncate">80s Sing-Alongs</h3>
              <p className="text-gray-400 text-sm truncate">Madonna, UB40...</p>
            </div>

            {/* Feel-Good Pop & Rock */}
            <div className="flex-shrink-0 w-48">
              <div className="relative rounded-lg overflow-hidden mb-3">
                <img src="/ed-sheeran-portrait.png" alt="Feel-Good Pop & Rock" className="w-full h-48 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <h3 className="text-white font-bold text-lg">Feel-Good</h3>
                  <h4 className="text-yellow-400 font-bold text-lg">Pop & Rock</h4>
                </div>
              </div>
              <h3 className="text-white font-semibold truncate">Feel-Good Pop & Rock</h3>
              <p className="text-gray-400 text-sm truncate">Ed Sheeran, T...</p>
            </div>

            {/* Happy Pop Hits */}
            <div className="flex-shrink-0 w-48">
              <div className="relative rounded-lg overflow-hidden mb-3">
                <img src="/happy-pop-music-colorful.png" alt="Happy Pop Hits" className="w-full h-48 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <h3 className="text-white font-bold text-lg">Happy Pop</h3>
                  <h4 className="text-white font-bold text-lg">Hits</h4>
                </div>
              </div>
              <h3 className="text-white font-semibold truncate">Happy Pop Hits</h3>
              <p className="text-gray-400 text-sm truncate">Ed Sheeran...</p>
            </div>
          </div>
        </section>
      </div>

      {/* Currently Playing */}
      <div className="fixed bottom-16 left-0 right-0 bg-zinc-800 p-4">
        <div className="flex items-center gap-4">
          <img src="/chappell-roan-hot-to-go-album-cover.png" alt="HOT TO GO! album cover" className="w-12 h-12 rounded-lg" />
          <div className="flex-1">
            <h3 className="text-white font-semibold">HOT TO GO!</h3>
            <p className="text-gray-400 text-sm">Chappell Roan</p>
          </div>
          <Button variant="ghost" size="icon" className="text-white">
            <Play className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white">
            <SkipForward className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-800 border-t border-zinc-700">
        <div className="flex items-center justify-around py-2">
          <div className="flex flex-col items-center py-2 px-4">
            <div className="bg-yellow-600 rounded-full p-2 mb-1">
              <Home className="w-5 h-5 text-black" />
            </div>
            <span className="text-xs text-white font-medium">Home</span>
          </div>
          <div className="flex flex-col items-center py-2 px-4">
            <Compass className="w-6 h-6 text-gray-400 mb-1" />
            <span className="text-xs text-gray-400">Explore</span>
          </div>
          <div className="flex flex-col items-center py-2 px-4">
            <Library className="w-6 h-6 text-gray-400 mb-1" />
            <span className="text-xs text-gray-400">Library</span>
          </div>
        </div>
      </nav>
    </div>
  )
}
