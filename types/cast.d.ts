declare global {
  interface Window {
    chrome?: {
      cast?: {
        isAvailable?: boolean
        ReceiverAvailability: {
          AVAILABLE: string
          UNAVAILABLE: string
        }
        SessionRequest: new (appId: string) => any
        ApiConfig: new (
          sessionRequest: any,
          sessionListener: (session: any) => void,
          receiverListener: (availability: string) => void,
        ) => any
        initialize: (apiConfig: any, successCallback: () => void, errorCallback: (error: any) => void) => void
        requestSession: (successCallback: (session: any) => void, errorCallback: (error: any) => void) => void
        media: {
          DEFAULT_MEDIA_RECEIVER_APP_ID: string
        }
      }
    }
  }
}

export {}
