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
    // Load initial style
    setSliderStyle(sliderStyleStorage.getStyle())

    // Listen for style changes
    const handleStyleChange = (e: Event) => {
      const customEvent = e as CustomEvent<SliderStyle>
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
        return cn(baseClasses, "rounded-full data-[orientation=horizontal]:h-1.5 data-[orientation=vertical]:w-1.5")
      case "default":
      default:
        return cn(baseClasses, "rounded-full data-[orientation=horizontal]:h-1.5 data-[orientation=vertical]:w-1.5")
    }
  }

  const getThumbClasses = () => {
    const baseClasses =
      "border-primary ring-ring/50 block shrink-0 rounded-full border bg-white shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"

    switch (sliderStyle) {
      case "slim":
        return cn(baseClasses, "size-3.5")
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
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={"bg-primary absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"}
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb data-slot="slider-thumb" key={index} className={getThumbClasses()} />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
