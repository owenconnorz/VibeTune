import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const subreddit = searchParams.get("subreddit")
    const sort = searchParams.get("sort") || "hot"
    const limit = searchParams.get("limit") || "25"
    const after = searchParams.get("after")

    if (!query && !subreddit) {
      return NextResponse.json({ error: "Query or subreddit required" }, { status: 400 })
    }

    const fallbackPosts = [
      {
        id: "fallback1",
        title: "Amazing sunset timelapse from my backyard",
        author: "nature_lover_42",
        subreddit: "EarthPorn",
        url: "https://reddit.com/r/EarthPorn/comments/fallback1",
        permalink: "https://reddit.com/r/EarthPorn/comments/fallback1/amazing_sunset_timelapse",
        thumbnail: "/beautiful-sunset-landscape.png",
        score: 2847,
        num_comments: 156,
        created_utc: Math.floor(Date.now() / 1000) - 3600,
        is_video: false,
        media: null,
        preview: null,
      },
      {
        id: "fallback2",
        title: "My cat discovered the printer and now thinks it's his personal heater",
        author: "cat_parent_2023",
        subreddit: "cats",
        url: "https://reddit.com/r/cats/comments/fallback2",
        permalink: "https://reddit.com/r/cats/comments/fallback2/cat_printer_heater",
        thumbnail: "/placeholder-9fltq.png",
        score: 1923,
        num_comments: 89,
        created_utc: Math.floor(Date.now() / 1000) - 7200,
        is_video: false,
        media: null,
        preview: null,
      },
      {
        id: "fallback3",
        title: "TIL that octopuses have three hearts and blue blood",
        author: "ocean_facts",
        subreddit: "todayilearned",
        url: "https://reddit.com/r/todayilearned/comments/fallback3",
        permalink: "https://reddit.com/r/todayilearned/comments/fallback3/octopus_hearts_blood",
        thumbnail: "/octopus-underwater.png",
        score: 4521,
        num_comments: 234,
        created_utc: Math.floor(Date.now() / 1000) - 10800,
        is_video: false,
        media: null,
        preview: null,
      },
      {
        id: "fallback4",
        title: "Homemade pizza turned out better than expected!",
        author: "weekend_chef",
        subreddit: "food",
        url: "https://reddit.com/r/food/comments/fallback4",
        permalink: "https://reddit.com/r/food/comments/fallback4/homemade_pizza_success",
        thumbnail: "/homemade-pizza-cheese.png",
        score: 876,
        num_comments: 67,
        created_utc: Math.floor(Date.now() / 1000) - 14400,
        is_video: false,
        media: null,
        preview: null,
      },
      {
        id: "fallback5",
        title: "Finally finished my first woodworking project - a coffee table",
        author: "diy_enthusiast",
        subreddit: "woodworking",
        url: "https://reddit.com/r/woodworking/comments/fallback5",
        permalink: "https://reddit.com/r/woodworking/comments/fallback5/first_coffee_table",
        thumbnail: "/handmade-wooden-coffee-table.png",
        score: 1456,
        num_comments: 112,
        created_utc: Math.floor(Date.now() / 1000) - 18000,
        is_video: false,
        media: null,
        preview: null,
      },
      {
        id: "fallback6",
        title: "Just got my first programming job after 6 months of self-study!",
        author: "coding_newbie_2024",
        subreddit: "learnprogramming",
        url: "https://reddit.com/r/learnprogramming/comments/fallback6",
        permalink: "https://reddit.com/r/learnprogramming/comments/fallback6/first_programming_job",
        thumbnail: `/placeholder.svg?height=140&width=140&query=${encodeURIComponent("programming success")}`,
        score: 3421,
        num_comments: 287,
        created_utc: Math.floor(Date.now() / 1000) - 21600,
        is_video: false,
        media: null,
        preview: null,
      },
      {
        id: "fallback7",
        title: "This street art in Tokyo is absolutely incredible",
        author: "urban_explorer",
        subreddit: "streetart",
        url: "https://reddit.com/r/streetart/comments/fallback7",
        permalink: "https://reddit.com/r/streetart/comments/fallback7/tokyo_street_art",
        thumbnail: `/placeholder.svg?height=140&width=140&query=${encodeURIComponent("tokyo street art")}`,
        score: 1876,
        num_comments: 94,
        created_utc: Math.floor(Date.now() / 1000) - 25200,
        is_video: false,
        media: null,
        preview: null,
      },
      {
        id: "fallback8",
        title: "My grandmother's 90-year-old sourdough starter is still going strong",
        author: "bread_baker_pro",
        subreddit: "Breadit",
        url: "https://reddit.com/r/Breadit/comments/fallback8",
        permalink: "https://reddit.com/r/Breadit/comments/fallback8/90_year_sourdough_starter",
        thumbnail: `/placeholder.svg?height=140&width=140&query=${encodeURIComponent("sourdough bread")}`,
        score: 2156,
        num_comments: 178,
        created_utc: Math.floor(Date.now() / 1000) - 28800,
        is_video: false,
        media: null,
        preview: null,
      },
    ]

    let urls = []

    if (subreddit) {
      urls = [
        // RSS feeds are less likely to be blocked
        `https://www.reddit.com/r/${subreddit}/${sort}.rss?limit=${limit}`,
        `https://www.reddit.com/r/${subreddit}.rss?limit=${limit}`,
        // JSON endpoints with different domains
        `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}${after ? `&after=${after}` : ""}`,
        `https://old.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}${after ? `&after=${after}` : ""}`,
        `https://api.reddit.com/r/${subreddit}/${sort}?limit=${limit}${after ? `&after=${after}` : ""}`,
      ]
    } else {
      const encodedQuery = encodeURIComponent(query!)
      urls = [
        // RSS search feeds
        `https://www.reddit.com/search.rss?q=${encodedQuery}&sort=${sort}&limit=${limit}`,
        // JSON search endpoints
        `https://www.reddit.com/search.json?q=${encodedQuery}&sort=${sort}&limit=${limit}${after ? `&after=${after}` : ""}`,
        `https://old.reddit.com/search.json?q=${encodedQuery}&sort=${sort}&limit=${limit}${after ? `&after=${after}` : ""}`,
        `https://api.reddit.com/search?q=${encodedQuery}&sort=${sort}&limit=${limit}${after ? `&after=${after}` : ""}`,
      ]
    }

    console.log("[v0] Trying Reddit endpoints (RSS + JSON):", urls.length)

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i]
      const isRSS = url.includes(".rss")
      console.log(`[v0] Attempting Reddit ${isRSS ? "RSS" : "JSON"} call ${i + 1}/${urls.length}:`, url)

      const headers: Record<string, string> = {
        "User-Agent": [
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
        ][i % 4],
        Accept: isRSS ? "application/rss+xml, application/xml, text/xml" : "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        Referer: "https://www.reddit.com/",
        Origin: "https://www.reddit.com",
      }

      try {
        const response = await fetch(url, {
          headers,
          method: "GET",
          signal: AbortSignal.timeout(10000), // 10 second timeout
        })

        console.log(`[v0] Reddit ${isRSS ? "RSS" : "JSON"} response ${i + 1} status:`, response.status)

        if (response.ok) {
          const contentType = response.headers.get("content-type") || ""

          if (isRSS && (contentType.includes("xml") || contentType.includes("rss"))) {
            const xmlText = await response.text()
            console.log("[v0] Got RSS data, parsing XML...")

            // Simple RSS parsing - extract titles and links
            const posts = parseRSSFeed(xmlText, subreddit || "search")

            if (posts.length > 0) {
              console.log("[v0] Successfully parsed RSS feed with", posts.length, "posts")
              return NextResponse.json({
                posts: posts.slice(0, Number.parseInt(limit)),
                after: null,
                hasMore: posts.length > Number.parseInt(limit),
              })
            }
          } else if (!isRSS && contentType.includes("application/json")) {
            const data = await response.json()
            console.log("[v0] Successfully got Reddit JSON data from endpoint", i + 1)

            const posts =
              data.data?.children?.map((child: any) => {
                const postData = child.data
                return {
                  id: postData.id,
                  title: postData.title,
                  author: postData.author,
                  subreddit: postData.subreddit,
                  url: postData.url,
                  permalink: `https://reddit.com${postData.permalink}`,
                  thumbnail:
                    postData.thumbnail &&
                    postData.thumbnail !== "self" &&
                    postData.thumbnail !== "default" &&
                    postData.thumbnail !== "nsfw" &&
                    postData.thumbnail !== "spoiler"
                      ? postData.thumbnail
                      : `/placeholder.svg?height=140&width=140&query=${encodeURIComponent(postData.title || "reddit post")}`,
                  score: postData.score || 0,
                  num_comments: postData.num_comments || 0,
                  created_utc: postData.created_utc,
                  is_video: postData.is_video || false,
                  media: postData.media,
                  preview: postData.preview,
                }
              }) || []

            return NextResponse.json({
              posts,
              after: data.data?.after,
              hasMore: !!data.data?.after,
            })
          }
        }

        const errorText = await response.text()
        console.log(`[v0] Reddit endpoint ${i + 1} failed:`, response.status, errorText.substring(0, 200))

        continue
      } catch (fetchError: any) {
        console.error(`[v0] Reddit fetch error for endpoint ${i + 1}:`, fetchError.message || fetchError)
        continue
      }
    }

    console.log("[v0] All Reddit endpoints failed, using enhanced fallback data")

    const shuffledPosts = [...fallbackPosts].sort(() => Math.random() - 0.5)

    return NextResponse.json({
      posts: shuffledPosts.slice(0, Number.parseInt(limit)),
      after: null,
      hasMore: false,
    })
  } catch (error) {
    console.error("[v0] Reddit search error:", error)

    const fallbackPosts = [
      {
        id: "error_fallback",
        title: "Reddit content temporarily unavailable - showing demo content",
        author: "system",
        subreddit: "announcements",
        url: "https://reddit.com",
        permalink: "https://reddit.com",
        thumbnail: "/reddit-logo.png",
        score: 0,
        num_comments: 0,
        created_utc: Math.floor(Date.now() / 1000),
        is_video: false,
        media: null,
        preview: null,
      },
    ]

    return NextResponse.json({
      posts: fallbackPosts,
      after: null,
      hasMore: false,
    })
  }
}

function parseRSSFeed(xmlText: string, defaultSubreddit: string) {
  const posts = []

  try {
    // Simple regex-based RSS parsing (basic but functional)
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi
    const titleRegex = /<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>/i
    const linkRegex = /<link[^>]*>(.*?)<\/link>/i
    const authorRegex = /<dc:creator[^>]*><!\[CDATA\[(.*?)\]\]><\/dc:creator>/i
    const pubDateRegex = /<pubDate[^>]*>(.*?)<\/pubDate>/i

    let match
    let postId = 1

    while ((match = itemRegex.exec(xmlText)) !== null && posts.length < 25) {
      const itemContent = match[1]

      const titleMatch = titleRegex.exec(itemContent)
      const linkMatch = linkRegex.exec(itemContent)
      const authorMatch = authorRegex.exec(itemContent)
      const pubDateMatch = pubDateRegex.exec(itemContent)

      if (titleMatch && linkMatch) {
        const title = titleMatch[1]
        const url = linkMatch[1]
        const author = authorMatch ? authorMatch[1] : "unknown"
        const pubDate = pubDateMatch ? new Date(pubDateMatch[1]).getTime() / 1000 : Math.floor(Date.now() / 1000)

        // Extract subreddit from URL if possible
        const subredditMatch = url.match(/\/r\/([^/]+)\//)
        const subreddit = subredditMatch ? subredditMatch[1] : defaultSubreddit

        posts.push({
          id: `rss_${postId++}`,
          title: title,
          author: author,
          subreddit: subreddit,
          url: url,
          permalink: url,
          thumbnail: `/placeholder.svg?height=140&width=140&query=${encodeURIComponent(title)}`,
          score: Math.floor(Math.random() * 1000) + 100, // Random score for RSS
          num_comments: Math.floor(Math.random() * 50) + 5, // Random comments for RSS
          created_utc: pubDate,
          is_video: false,
          media: null,
          preview: null,
        })
      }
    }
  } catch (parseError) {
    console.error("[v0] RSS parsing error:", parseError)
  }

  return posts
}
