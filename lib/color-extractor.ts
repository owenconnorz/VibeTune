export interface ExtractedColors {
  primary: string
  secondary: string
  accent: string
}

export async function extractColorsFromImage(imageUrl: string): Promise<ExtractedColors> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "Anonymous"

    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        resolve(getDefaultColors())
        return
      }

      // Resize for performance
      const size = 100
      canvas.width = size
      canvas.height = size

      ctx.drawImage(img, 0, 0, size, size)

      try {
        const imageData = ctx.getImageData(0, 0, size, size)
        const colors = extractDominantColors(imageData.data)
        resolve(colors)
      } catch (error) {
        console.error("[v0] Error extracting colors:", error)
        resolve(getDefaultColors())
      }
    }

    img.onerror = () => {
      resolve(getDefaultColors())
    }

    // Use YouTube thumbnail proxy to avoid CORS
    img.src = imageUrl
  })
}

function extractDominantColors(data: Uint8ClampedArray): ExtractedColors {
  const colorMap = new Map<string, number>()

  // Sample every 4th pixel for performance
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]

    // Skip transparent and very dark/light pixels
    if (a < 128 || (r < 20 && g < 20 && b < 20) || (r > 235 && g > 235 && b > 235)) {
      continue
    }

    // Quantize colors to reduce variations
    const qr = Math.round(r / 32) * 32
    const qg = Math.round(g / 32) * 32
    const qb = Math.round(b / 32) * 32
    const key = `${qr},${qg},${qb}`

    colorMap.set(key, (colorMap.get(key) || 0) + 1)
  }

  // Sort by frequency
  const sortedColors = Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([color]) => color.split(",").map(Number))

  if (sortedColors.length === 0) {
    return getDefaultColors()
  }

  // Get primary color (most frequent)
  const [r1, g1, b1] = sortedColors[0]

  // Get secondary color (different hue from primary)
  const secondary =
    sortedColors.find(([r, g, b]) => {
      const diff = Math.abs(r - r1) + Math.abs(g - g1) + Math.abs(b - b1)
      return diff > 100
    }) || sortedColors[Math.min(1, sortedColors.length - 1)]

  // Get accent color (vibrant)
  const accent =
    sortedColors.find(([r, g, b]) => {
      const saturation = Math.max(r, g, b) - Math.min(r, g, b)
      return saturation > 80
    }) || sortedColors[Math.min(2, sortedColors.length - 1)]

  return {
    primary: rgbToOklch(r1, g1, b1),
    secondary: rgbToOklch(secondary[0], secondary[1], secondary[2]),
    accent: rgbToOklch(accent[0], accent[1], accent[2]),
  }
}

function rgbToOklch(r: number, g: number, b: number): string {
  // Normalize RGB values
  r = r / 255
  g = g / 255
  b = b / 255

  // Calculate relative luminance (simplified)
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b

  // Calculate chroma (saturation)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const chroma = (max - min) * 0.15 // Scale down for subtlety

  // Calculate hue
  let hue = 0
  if (chroma !== 0) {
    if (max === r) {
      hue = ((g - b) / (max - min) + 6) % 6
    } else if (max === g) {
      hue = (b - r) / (max - min) + 2
    } else {
      hue = (r - g) / (max - min) + 4
    }
    hue = hue * 60
  }

  // Adjust lightness for better contrast
  const adjustedLightness = Math.max(0.15, Math.min(0.25, luminance * 0.8))

  return `oklch(${adjustedLightness.toFixed(3)} ${chroma.toFixed(3)} ${hue.toFixed(1)})`
}

function getDefaultColors(): ExtractedColors {
  return {
    primary: "oklch(0.18 0.02 150)",
    secondary: "oklch(0.22 0.02 150)",
    accent: "oklch(0.65 0.08 150)",
  }
}
