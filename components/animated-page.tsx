"use client"

import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"
import { m3Variants, prefersReducedMotion } from "@/lib/animations"
import type { ReactNode } from "react"

interface AnimatedPageProps {
  children: ReactNode
  className?: string
}

export function AnimatedPage({ children, className }: AnimatedPageProps) {
  const pathname = usePathname()
  const shouldAnimate = !prefersReducedMotion()

  if (!shouldAnimate) {
    return <div className={className}>{children}</div>
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={m3Variants.fadeIn.initial}
        animate={m3Variants.fadeIn.animate}
        exit={m3Variants.fadeIn.exit}
        transition={m3Variants.fadeIn.transition}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
