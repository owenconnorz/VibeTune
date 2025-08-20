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
  const colorCounts: { [key: string]: { count: number; r: number; g: number; b: number; saturation: number } } = {}
  const step = 4 * 8 // Sample every 8th pixel for better coverage

  for (let i = 0; i < data.length; i += step) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const alpha = data[i + 3]

    // Skip transparent pixels
    if (alpha < 128) continue

    // Calculate brightness and saturation
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const saturation = max === 0 ? 0 : (max - min) / max

    // Skip very dark colors (brightness < 50) and very unsaturated colors
    if (brightness < 50 || saturation < 0.2) continue

    // Group similar colors with less precision loss
    const key = `${Math.floor(r / 16) * 16},${Math.floor(g / 16) * 16},${Math.floor(b / 16) * 16}`

    if (!colorCounts[key]) {
      colorCounts[key] = { count: 0, r, g, b, saturation }
    }
    colorCounts[key].count += 1
  }

  // Sort by a combination of frequency and saturation (prioritize vibrant colors)
  const sortedColors = Object.entries(colorCounts)
    .sort(([, a], [, b]) => b.count * b.saturation - a.count * a.saturation)
    .slice(0, 8)
    .map(([, colorData]) => [colorData.r, colorData.g, colorData.b])

  if (sortedColors.length === 0) {
    console.log("[v0] No vibrant colors found, using default colors")
    return getDefaultColors()
  }

  // Find the most vibrant color as primary
  const primaryColor = sortedColors[0]
  const [r, g, b] = primaryColor

  console.log(`[v0] Extracted primary color: rgb(${r}, ${g}, ${b})`)

  // Create more distinct color variations
  const primary = `rgb(${r}, ${g}, ${b})`

  // Secondary: darker version
  const secondary = `rgb(${Math.max(20, r - 60)}, ${Math.max(20, g - 60)}, ${Math.max(20, b - 60)})`

  // Accent: brighter/more saturated version
  const accentR = Math.min(255, r + 80)
  const accentG = Math.min(255, g + 80)
  const accentB = Math.min(255, b + 80)
  const accent = `rgb(${accentR}, ${accentG}, ${accentB})`

  // Create complementary background
  const backgroundR = Math.max(15, Math.min(50, r * 0.2))
  const backgroundG = Math.max(15, Math.min(50, g * 0.2))
  const backgroundB = Math.max(15, Math.min(50, b * 0.2))
  const background = `rgb(${backgroundR}, ${backgroundG}, ${backgroundB})`

  // Ensure good contrast for text
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  const foreground = brightness > 140 ? "#000000" : "#ffffff"

  const colors = {
    primary,
    secondary,
    accent,
    background,
    foreground,
  }

  console.log("[v0] Final extracted colors:", colors)
  return colors
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
