import { NetworkType } from "./youtube-api-advanced"

export interface NetworkStrategy {
  name: string
  userAgent: string
  headers: Record<string, string>
  retryDelay: number
  maxRetries: number
  timeout: number
}

export interface NetworkConditions {
  type: NetworkType
  effectiveType?: string
  downlink?: number
  rtt?: number
  saveData?: boolean
}

export class NetworkStrategyManager {
  private strategies: Map<string, NetworkStrategy> = new Map()
  private currentConditions: NetworkConditions

  constructor() {
    this.currentConditions = this.detectNetworkConditions()
    this.initializeStrategies()
    this.setupNetworkMonitoring()
  }

  private initializeStrategies(): void {
    // Mobile emulation strategy - best for restricted networks
    this.strategies.set("mobile_emulation", {
      name: "Mobile Emulation",
      userAgent:
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36",
      headers: {
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "sec-ch-ua": '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": '"Android"',
        "sec-ch-ua-arch": '""',
        "sec-ch-ua-bitness": '""',
        "sec-ch-ua-form-factors": '"Mobile"',
        "sec-ch-ua-model": "Pixel 8",
        "sec-ch-ua-platform-version": "14.0.0",
        Origin: "https://music.youtube.com",
        Referer: "https://music.youtube.com/",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "cross-site",
      },
      retryDelay: 1000,
      maxRetries: 5,
      timeout: 15000,
    })

    // Desktop fallback strategy
    this.strategies.set("desktop_fallback", {
      name: "Desktop Fallback",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
      headers: {
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "sec-ch-ua": '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-ch-ua-arch": '"x86"',
        "sec-ch-ua-bitness": '"64"',
        "sec-ch-ua-form-factors": '"Desktop"',
        "sec-ch-ua-platform-version": "19.0.0",
        Origin: "https://music.youtube.com",
        Referer: "https://music.youtube.com/",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "cross-site",
      },
      retryDelay: 800,
      maxRetries: 4,
      timeout: 12000,
    })

    // Aggressive mobile strategy for very restricted networks
    this.strategies.set("aggressive_mobile", {
      name: "Aggressive Mobile",
      userAgent:
        "Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36",
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        DNT: "1",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "sec-ch-ua": '"Not;A=Brand";v="99", "Google Chrome";v="139"',
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": '"Android"',
        Origin: "https://music.youtube.com",
        Referer: "https://music.youtube.com/",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      retryDelay: 1500,
      maxRetries: 6,
      timeout: 20000,
    })

    // Standard strategy for good connections
    this.strategies.set("standard", {
      name: "Standard",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
      headers: {
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        Origin: "https://music.youtube.com",
        Referer: "https://music.youtube.com/",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "cross-site",
      },
      retryDelay: 500,
      maxRetries: 3,
      timeout: 10000,
    })

    console.log(`[v0] Initialized ${this.strategies.size} network strategies`)
  }

  private detectNetworkConditions(): NetworkConditions {
    const connection =
      (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

    if (connection) {
      const effectiveType = connection.effectiveType
      const downlink = connection.downlink
      const rtt = connection.rtt
      const saveData = connection.saveData

      console.log(`[v0] Network conditions:`, { effectiveType, downlink, rtt, saveData })

      let networkType: NetworkType
      if (saveData || effectiveType === "slow-2g" || effectiveType === "2g") {
        networkType = NetworkType.RESTRICTED_WIFI
      } else if (effectiveType === "3g" || (downlink && downlink < 1.5)) {
        networkType = NetworkType.MOBILE_DATA
      } else {
        networkType = NetworkType.WIFI
      }

      return {
        type: networkType,
        effectiveType,
        downlink,
        rtt,
        saveData,
      }
    }

    // Fallback detection
    console.log(`[v0] No connection API available, using fallback detection`)
    return { type: NetworkType.WIFI }
  }

  private setupNetworkMonitoring(): void {
    const connection =
      (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

    if (connection) {
      connection.addEventListener("change", () => {
        const oldConditions = this.currentConditions
        this.currentConditions = this.detectNetworkConditions()

        if (oldConditions.type !== this.currentConditions.type) {
          console.log(`[v0] Network type changed: ${oldConditions.type} -> ${this.currentConditions.type}`)
        }
      })
    }
  }

  getOptimalStrategy(attempt = 1): NetworkStrategy {
    const networkType = this.currentConditions.type
    const saveData = this.currentConditions.saveData

    console.log(`[v0] Selecting strategy for ${networkType}, attempt ${attempt}, saveData: ${saveData}`)

    // Strategy selection based on network type and attempt number
    let strategyName: string

    switch (networkType) {
      case NetworkType.RESTRICTED_WIFI:
        strategyName = this.getRestrictedWifiStrategy(attempt)
        break
      case NetworkType.MOBILE_DATA:
        strategyName = this.getMobileDataStrategy(attempt)
        break
      case NetworkType.WIFI:
        strategyName = this.getWifiStrategy(attempt)
        break
      default:
        strategyName = "standard"
    }

    // Override for save data mode
    if (saveData && attempt <= 2) {
      strategyName = "aggressive_mobile"
    }

    const strategy = this.strategies.get(strategyName) || this.strategies.get("standard")!
    console.log(`[v0] Selected strategy: ${strategy.name}`)

    return strategy
  }

  private getRestrictedWifiStrategy(attempt: number): string {
    switch (attempt) {
      case 1:
        return "mobile_emulation"
      case 2:
        return "aggressive_mobile"
      case 3:
        return "desktop_fallback"
      default:
        return "mobile_emulation"
    }
  }

  private getMobileDataStrategy(attempt: number): string {
    switch (attempt) {
      case 1:
        return "mobile_emulation"
      case 2:
        return "standard"
      case 3:
        return "aggressive_mobile"
      default:
        return "mobile_emulation"
    }
  }

  private getWifiStrategy(attempt: number): string {
    switch (attempt) {
      case 1:
        return "standard"
      case 2:
        return "mobile_emulation"
      case 3:
        return "desktop_fallback"
      default:
        return "standard"
    }
  }

  async makeRequestWithStrategy(url: string, strategyName?: string, options: RequestInit = {}): Promise<Response> {
    const strategy = strategyName
      ? this.strategies.get(strategyName) || this.getOptimalStrategy()
      : this.getOptimalStrategy()

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        "User-Agent": strategy.userAgent,
        ...strategy.headers,
        ...options.headers,
      },
      signal: AbortSignal.timeout(strategy.timeout),
    }

    console.log(`[v0] Making request with ${strategy.name} strategy`)

    try {
      const response = await fetch(url, requestOptions)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return response
    } catch (error) {
      console.error(`[v0] Request failed with ${strategy.name}:`, error)
      throw error
    }
  }

  async makeRequestWithRetry(url: string, options: RequestInit = {}): Promise<Response> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        const strategy = this.getOptimalStrategy(attempt)

        if (attempt > 1) {
          const delay = strategy.retryDelay * attempt + Math.random() * 1000
          console.log(`[v0] Waiting ${Math.round(delay)}ms before attempt ${attempt}`)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }

        const response = await this.makeRequestWithStrategy(url, strategy.name, options)
        console.log(`[v0] Request succeeded on attempt ${attempt} with ${strategy.name}`)
        return response
      } catch (error) {
        lastError = error as Error
        console.error(`[v0] Attempt ${attempt} failed:`, error)

        if (attempt === 5) {
          break
        }
      }
    }

    console.error(`[v0] All retry attempts failed for ${url}`)
    throw lastError || new Error("All retry attempts failed")
  }

  getCurrentNetworkConditions(): NetworkConditions {
    return { ...this.currentConditions }
  }

  getAvailableStrategies(): string[] {
    return Array.from(this.strategies.keys())
  }

  getStrategyDetails(name: string): NetworkStrategy | null {
    return this.strategies.get(name) || null
  }
}

export const networkStrategyManager = new NetworkStrategyManager()
