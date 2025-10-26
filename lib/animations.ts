// Material Design 3 Animation System
// Based on Material Design 3 motion guidelines

export const m3Easing = {
  // Emphasized easing for entering elements
  emphasized: "cubic-bezier(0.2, 0, 0, 1)",
  // Emphasized decelerate for exiting elements
  emphasizedDecelerate: "cubic-bezier(0.05, 0.7, 0.1, 1)",
  // Emphasized accelerate for entering elements
  emphasizedAccelerate: "cubic-bezier(0.3, 0, 0.8, 0.15)",
  // Standard easing for most transitions
  standard: "cubic-bezier(0.4, 0, 0.2, 1)",
  // Standard decelerate
  standardDecelerate: "cubic-bezier(0, 0, 0.2, 1)",
  // Standard accelerate
  standardAccelerate: "cubic-bezier(0.3, 0, 1, 1)",
  // Legacy easing (for backwards compatibility)
  legacy: "cubic-bezier(0.4, 0, 0.6, 1)",
  // Legacy decelerate
  legacyDecelerate: "cubic-bezier(0, 0, 0.2, 1)",
  // Legacy accelerate
  legacyAccelerate: "cubic-bezier(0.4, 0, 1, 1)",
} as const

export const m3Duration = {
  // Short durations for simple transitions
  short1: 50,
  short2: 100,
  short3: 150,
  short4: 200,
  // Medium durations for standard transitions
  medium1: 250,
  medium2: 300,
  medium3: 350,
  medium4: 400,
  // Long durations for complex transitions
  long1: 450,
  long2: 500,
  long3: 550,
  long4: 600,
  // Extra long for special cases
  extraLong1: 700,
  extraLong2: 800,
  extraLong3: 900,
  extraLong4: 1000,
} as const

// Animation variants for common patterns
export const m3Variants = {
  // Fade animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: {
      duration: m3Duration.short4 / 1000,
      ease: [0.4, 0, 0.2, 1],
    },
  },

  // Scale animations
  scaleIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
    transition: {
      duration: m3Duration.medium2 / 1000,
      ease: [0.2, 0, 0, 1],
    },
  },

  // Slide animations
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: {
      duration: m3Duration.medium2 / 1000,
      ease: [0.2, 0, 0, 1],
    },
  },

  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: {
      duration: m3Duration.medium2 / 1000,
      ease: [0.2, 0, 0, 1],
    },
  },

  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: {
      duration: m3Duration.medium2 / 1000,
      ease: [0.2, 0, 0, 1],
    },
  },

  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: {
      duration: m3Duration.medium2 / 1000,
      ease: [0.2, 0, 0, 1],
    },
  },

  // List stagger animation
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  },

  staggerItem: {
    initial: { opacity: 0, y: 10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: m3Duration.medium1 / 1000,
        ease: [0.2, 0, 0, 1],
      },
    },
  },
}

// Helper function to create transition strings
export function createTransition(
  properties: string[],
  duration: number = m3Duration.medium2,
  easing: string = m3Easing.standard,
): string {
  return properties.map((prop) => `${prop} ${duration}ms ${easing}`).join(", ")
}

// Utility to check if user prefers reduced motion
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

// Get adjusted duration based on motion preference
export function getAdjustedDuration(duration: number): number {
  return prefersReducedMotion() ? 0 : duration
}
