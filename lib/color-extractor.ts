export interface ExtractedColors {
  primary: string
  secondary: string
  accent: string
  background: string
  foreground: string
}

export async function extractColorsFromImage(imageUrl: string): Promise<ExtractedColors> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        resolve(getDefaultColors())
        return
      }

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const colors = analyzeImageColors(imageData.data)
        resolve(colors)
      } catch (error) {
        console.error("Error extracting colors:", error)
        resolve(getDefaultColors())
      }
    }

    img.onerror = () => {
      resolve(getDefaultColors())
    }

    img.src = imageUrl
  })
}

function analyzeImageColors(data: Uint8ClampedArray): ExtractedColors {
  const colorCounts: { [key: string]: number } = {}
  const step = 4 * 10 // Sample every 10th pixel for performance

  // Count color frequencies
  for (let i = 0; i < data.length; i += step) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const alpha = data[i + 3]

    // Skip transparent pixels
    if (alpha < 128) continue

    // Group similar colors
    const key = `${Math.floor(r / 32) * 32},${Math.floor(g / 32) * 32},${Math.floor(b / 32) * 32}`
    colorCounts[key] = (colorCounts[key] || 0) + 1
  }

  // Get most frequent colors
  const sortedColors = Object.entries(colorCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([color]) => color.split(",").map(Number))

  if (sortedColors.length === 0) {
    return getDefaultColors()
  }

  // Find dominant color
  const dominantColor = sortedColors[0]
  const [r, g, b] = dominantColor

  // Create color variations
  const primary = `rgb(${r}, ${g}, ${b})`
  const secondary = `rgb(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)})`
  const accent = `rgb(${Math.min(255, r + 60)}, ${Math.min(255, g + 60)}, ${Math.min(255, b + 60)})`

  // Create dark background based on dominant color
  const backgroundR = Math.max(10, Math.min(40, r * 0.15))
  const backgroundG = Math.max(10, Math.min(40, g * 0.15))
  const backgroundB = Math.max(10, Math.min(40, b * 0.15))
  const background = `rgb(${backgroundR}, ${backgroundG}, ${backgroundB})`

  // Ensure good contrast for text
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  const foreground = brightness > 128 ? "#000000" : "#ffffff"

  return {
    primary,
    secondary,
    accent,
    background,
    foreground,
  }
}

function getDefaultColors(): ExtractedColors {
  return {
    primary: "#fbbf24", // yellow-400
    secondary: "#f59e0b", // yellow-500
    accent: "#d97706", // yellow-600
    background: "#18181b", // zinc-900
    foreground: "#ffffff",
  }
}
