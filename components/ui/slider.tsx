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
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = React.useMemo(
    () => (Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min, max]),
    [value, defaultValue, min, max],
  )

  const [sliderStyle, setSliderStyle] = React.useState<SliderStyle>("default")

  React.useEffect(() => {
    setSliderStyle(sliderStyleStorage.getStyle())

    // Listen for style changes
    const handleStyleChange = (e: Event) => {
      const customEvent = e as CustomEvent<SliderStyle>
      console.log("[v0] Slider style changed to:", customEvent.detail)
      setSliderStyle(customEvent.detail)
    }

    window.addEventListener("sliderStyleChanged", handleStyleChange)
    return () => window.removeEventListener("sliderStyleChanged", handleStyleChange)
  }, [])

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
          "rounded-none",
          "[clip-path:polygon(0%_50%,2.5%_40%,5%_35%,7.5%_40%,10%_50%,12.5%_60%,15%_65%,17.5%_60%,20%_50%,22.5%_40%,25%_35%,27.5%_40%,30%_50%,32.5%_60%,35%_65%,37.5%_60%,40%_50%,42.5%_40%,45%_35%,47.5%_40%,50%_50%,52.5%_60%,55%_65%,57.5%_60%,60%_50%,62.5%_40%,65%_35%,67.5%_40%,70%_50%,72.5%_60%,75%_65%,77.5%_60%,80%_50%,82.5%_40%,85%_35%,87.5%_40%,90%_50%,92.5%_60%,95%_65%,97.5%_60%,100%_50%,100%_100%,0%_100%)]",
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
          "[clip-path:polygon(0%_50%,2.5%_40%,5%_35%,7.5%_40%,10%_50%,12.5%_60%,15%_65%,17.5%_60%,20%_50%,22.5%_40%,25%_35%,27.5%_40%,30%_50%,32.5%_60%,35%_65%,37.5%_60%,40%_50%,42.5%_40%,45%_35%,47.5%_40%,50%_50%,52.5%_60%,55%_65%,57.5%_60%,60%_50%,62.5%_40%,65%_35%,67.5%_40%,70%_50%,72.5%_60%,75%_65%,77.5%_60%,80%_50%,82.5%_40%,85%_35%,87.5%_40%,90%_50%,92.5%_60%,95%_65%,97.5%_60%,100%_50%,100%_100%,0%_100%)]",
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
