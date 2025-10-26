"use client"

import { motion } from "framer-motion"
import { m3Variants, prefersReducedMotion } from "@/lib/animations"
import type { ReactNode } from "react"

interface AnimatedListProps {
  children: ReactNode
  className?: string
}

export function AnimatedList({ children, className }: AnimatedListProps) {
  const shouldAnimate = !prefersReducedMotion()

  if (!shouldAnimate) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div variants={m3Variants.staggerContainer} initial="initial" animate="animate" className={className}>
      {children}
    </motion.div>
  )
}

interface AnimatedListItemProps {
  children: ReactNode
  className?: string
}

export function AnimatedListItem({ children, className }: AnimatedListItemProps) {
  const shouldAnimate = !prefersReducedMotion()

  if (!shouldAnimate) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div variants={m3Variants.staggerItem} className={className}>
      {children}
    </motion.div>
  )
}
