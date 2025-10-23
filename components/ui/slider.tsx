"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"
import { sliderStyleStorage, type SliderStyle } from "@/lib/slider-style-storage"

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  forceDefaultStyle = false,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & { forceDefaultStyle?: boolean }) {
  const _values = React.useMemo(
    () => (Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min, max]),
    [value, defaultValue, min, max],
  )

  const [sliderStyle, setSliderStyle] = React.useState<SliderStyle>("default")

  React.useEffect(() => {
    if (forceDefaultStyle) {
      setSliderStyle("default")
      return
    }

    setSliderStyle(sliderStyleStorage.getStyle())

    const handleStyleChange = (e: Event) => {
      const customEvent = e as CustomEvent<SliderStyle>
      console.log("[v0] Slider style changed to:", customEvent.detail)
      setSliderStyle(customEvent.detail)
    }

    window.addEventListener("sliderStyleChanged", handleStyleChange)
    return () => window.removeEventListener("sliderStyleChanged", handleStyleChange)
  }, [forceDefaultStyle])

  const getTrackClasses = () => {
    const baseClasses =
      "bg-muted relative grow overflow-hidden data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full"

    switch (sliderStyle) {
      case "slim":
        return cn(baseClasses, "rounded-full data-[orientation=horizontal]:h-0.5 data-[orientation=vertical]:w-0.5")
      case "squiggly":
        return cn(
          baseClasses,
          "data-[orientation=horizontal]:h-2 data-[orientation=vertical]:w-2",
          "rounded-sm",
          "[background:linear-gradient(90deg,var(--muted)_0%,var(--muted)_50%,transparent_50%,transparent_100%)]",
          "[background-size:20px_100%]",
          "animate-[wave-slide_1s_linear_infinite]",
        )
      case "default":
      default:
        return cn(baseClasses, "rounded-full data-[orientation=horizontal]:h-1.5 data-[orientation=vertical]:w-1.5")
    }
  }

  const getRangeClasses = () => {
    const baseClasses = "bg-primary absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"

    switch (sliderStyle) {
      case "squiggly":
        return cn(
          baseClasses,
          "rounded-sm",
          "[background:linear-gradient(90deg,var(--primary)_0%,var(--primary)_50%,transparent_50%,transparent_100%)]",
          "[background-size:20px_100%]",
          "animate-[wave-slide_1s_linear_infinite]",
        )
      default:
        return baseClasses
    }
  }

  const getThumbClasses = () => {
    const baseClasses =
      "border-primary ring-ring/50 block shrink-0 rounded-full border bg-white shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"

    switch (sliderStyle) {
      case "slim":
        return cn(baseClasses, "size-3")
      case "squiggly":
        return cn(baseClasses, "size-4")
      case "default":
      default:
        return cn(baseClasses, "size-4")
    }
  }

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track data-slot="slider-track" className={getTrackClasses()}>
        <SliderPrimitive.Range data-slot="slider-range" className={getRangeClasses()} />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb data-slot="slider-thumb" key={index} className={getThumbClasses()} />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
