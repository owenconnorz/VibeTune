"use client"

/**
 * Cookie utility functions for OpenTune
 * Provides secure cookie management with proper defaults
 */

export interface CookieOptions {
  expires?: number | Date // Days from now or specific date
  path?: string
  domain?: string
  secure?: boolean
  sameSite?: "strict" | "lax" | "none"
}

/**
 * Set a cookie with secure defaults
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  const { expires, path = "/", domain, secure = true, sameSite = "lax" } = options

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`

  if (expires) {
    const expiresDate = typeof expires === "number" ? new Date(Date.now() + expires * 24 * 60 * 60 * 1000) : expires
    cookieString += `; expires=${expiresDate.toUTCString()}`
  }

  cookieString += `; path=${path}`

  if (domain) {
    cookieString += `; domain=${domain}`
  }

  if (secure) {
    cookieString += "; secure"
  }

  cookieString += `; samesite=${sameSite}`

  document.cookie = cookieString
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
  const nameEQ = encodeURIComponent(name) + "="
  const cookies = document.cookie.split(";")

  for (let cookie of cookies) {
    cookie = cookie.trim()
    if (cookie.startsWith(nameEQ)) {
      return decodeURIComponent(cookie.substring(nameEQ.length))
    }
  }

  return null
}

/**
 * Delete a cookie by name
 */
export function deleteCookie(name: string, options: Pick<CookieOptions, "path" | "domain"> = {}): void {
  setCookie(name, "", {
    ...options,
    expires: new Date(0),
  })
}

/**
 * Get all cookies as an object
 */
export function getAllCookies(): Record<string, string> {
  const cookies: Record<string, string> = {}
  const cookieStrings = document.cookie.split(";")

  for (let cookie of cookieStrings) {
    cookie = cookie.trim()
    const [name, value] = cookie.split("=")
    if (name && value) {
      cookies[decodeURIComponent(name)] = decodeURIComponent(value)
    }
  }

  return cookies
}

/**
 * Check if cookies are enabled in the browser
 */
export function areCookiesEnabled(): boolean {
  try {
    document.cookie = "cookietest=1"
    const enabled = document.cookie.indexOf("cookietest=") !== -1
    document.cookie = "cookietest=1; expires=Thu, 01-Jan-1970 00:00:01 GMT"
    return enabled
  } catch {
    return false
  }
}

/**
 * Cookie consent management
 */
export const COOKIE_CONSENT_KEY = "opentune_cookie_consent"

export function hasUserConsented(): boolean {
  if (typeof window === "undefined") return false
  const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
  return consent === "accepted"
}

export function setUserConsent(accepted: boolean): void {
  if (typeof window === "undefined") return
  localStorage.setItem(COOKIE_CONSENT_KEY, accepted ? "accepted" : "declined")
}

export function hasUserRespondedToConsent(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(COOKIE_CONSENT_KEY) !== null
}
