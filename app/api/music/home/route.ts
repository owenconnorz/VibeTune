import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const revalidate = 1800

function getMockHomeFeed() {
  return {
    sections: [
      {
        title: "Quick picks",
        items: [
          {
            id: "dQw4w9WgXcQ",
            title: "Never Gonna Give You Up",
            artist: "Rick Astley",
            thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
            duration: "3:33",
            channelTitle: "Rick Astley",
          },
          {
            id: "9bZkp7q19f0",
            title: "Gangnam Style",
            artist: "PSY",
            thumbnail: "https://i.ytimg.com/vi/9bZkp7q19f0/maxresdefault.jpg",
            duration: "4:13",
            channelTitle: "PSY",
          },
          {
            id: "kJQP7kiw5Fk",
            title: "Despacito",
            artist: "Luis Fonsi ft. Daddy Yankee",
            thumbnail: "https://i.ytimg.com/vi/kJQP7kiw5Fk/maxresdefault.jpg",
            duration: "4:42",
            channelTitle: "Luis Fonsi",
          },
        ],
      },
      {
        title: "Trending Now",
        items: [
          {
            id: "60ItHLz5WEA",
            title: "Faded",
            artist: "Alan Walker",
            thumbnail: "https://i.ytimg.com/vi/60ItHLz5WEA/maxresdefault.jpg",
            duration: "3:32",
            channelTitle: "Alan Walker",
          },
          {
            id: "RgKAFK5djSk",
            title: "Waka Waka",
            artist: "Shakira",
            thumbnail: "https://i.ytimg.com/vi/RgKAFK5djSk/maxresdefault.jpg",
            duration: "3:27",
            channelTitle: "Shakira",
          },
        ],
      },
      {
        title: "Top Hits",
        items: [
          {
            id: "OPf0YbXqDm0",
            title: "Uptown Funk",
            artist: "Mark Ronson ft. Bruno Mars",
            thumbnail: "https://i.ytimg.com/vi/OPf0YbXqDm0/maxresdefault.jpg",
            duration: "4:30",
            channelTitle: "Mark Ronson",
          },
          {
            id: "hT_nvWreIhg",
            title: "Counting Stars",
            artist: "OneRepublic",
            thumbnail: "https://i.ytimg.com/vi/hT_nvWreIhg/maxresdefault.jpg",
            duration: "4:17",
            channelTitle: "OneRepublic",
          },
        ],
      },
    ],
  }
}

export async function GET() {
  return NextResponse.json(getMockHomeFeed(), {
    headers: {
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
    },
  })
}
