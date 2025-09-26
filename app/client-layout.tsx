"use client"

import type React from "react"
import { AudioPlayerProvider } from "@/contexts/audio-player-context"
import { VideoPlayerProvider } from "@/contexts/video-player-context"
import { AuthProvider } from "@/contexts/auth-context"
import { SyncProvider } from "@/contexts/sync-context"
import { ThemeProvider } from "@/contexts/theme-context"
import { PlaylistProvider } from "@/contexts/playlist-context"
import { ListeningHistoryProvider } from "@/contexts/listening-history-context"
import { UpdateProvider } from "@/contexts/update-context"
import { LikedSongsProvider } from "@/contexts/liked-songs-context"
import { RefreshProvider } from "@/contexts/refresh-context"
import { SettingsProvider } from "@/contexts/settings-context"
import { DownloadProvider } from "@/contexts/download-context"
import { NotificationsProvider } from "@/contexts/notifications-context"
import { ServiceWorkerRegistration } from "@/components/service-worker-registration"
import { DiscordRPCIntegration } from "@/components/discord-rpc-integration"
import { AgeVerificationModal } from "@/components/age-verification-modal"
import { PageRouter } from "@/components/page-router"
import { NavigationRouter } from "@/components/navigation-router"
import { RenderOptimizationProvider } from "@/contexts/render-optimization-context"
import { VideoPlayer } from "@/components/video-player"
import { AudioPlayer } from "@/components/audio-player"

const CombinedProviders = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <SyncProvider>
      <ListeningHistoryProvider>
        <RenderOptimizationProvider>
          <AudioPlayerProvider>
            <VideoPlayerProvider>
              <PlaylistProvider>
                <LikedSongsProvider>
                  <DownloadProvider>
                    <ThemeProvider>
                      <RefreshProvider>
                        <UpdateProvider>
                          <SettingsProvider>
                            <NotificationsProvider>
                              <DiscordRPCIntegration />
                              <AgeVerificationModal />
                              {children}
                            </NotificationsProvider>
                          </SettingsProvider>
                        </UpdateProvider>
                      </RefreshProvider>
                    </ThemeProvider>
                  </DownloadProvider>
                </LikedSongsProvider>
              </PlaylistProvider>
            </VideoPlayerProvider>
          </AudioPlayerProvider>
        </RenderOptimizationProvider>
      </ListeningHistoryProvider>
    </SyncProvider>
  </AuthProvider>
)

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ServiceWorkerRegistration />
      <CombinedProviders>
        <PageRouter>
          {children}
          <NavigationRouter />
          <VideoPlayer />
          <AudioPlayer />
        </PageRouter>
      </CombinedProviders>
    </>
  )
}
