// Storage for player slider style preferences
export type SliderStyle = "default" | "squiggly" | "slim"

const SLIDER_STYLE_KEY = "player_slider_style"

export const sliderStyleStorage = {
  getStyle(): SliderStyle {
    if (typeof window === "undefined") return "default"
    const stored = localStorage.getItem(SLIDER_STYLE_KEY)
    return (stored as SliderStyle) || "default"
  },

  setStyle(style: SliderStyle): void {
    if (typeof window === "undefined") return
    localStorage.setItem(SLIDER_STYLE_KEY, style)
    // Trigger event for components to update
    window.dispatchEvent(new CustomEvent("sliderStyleChanged", { detail: style }))
  },
}
