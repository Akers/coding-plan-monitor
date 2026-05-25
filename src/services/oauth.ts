import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

export async function startOAuth(_providerId: string, port: number): Promise<void> {
  await invoke('start_oauth_server', { port })
}

export async function stopOAuth(): Promise<void> {
  await invoke('stop_oauth_server')
}

export async function onOAuthCallback(
  callback: (data: { token: string; provider_id: string }) => void
): Promise<() => void> {
  const unlisten = await listen<{ token: string; provider_id: string }>('oauth-callback', (event) => {
    callback(event.payload)
  })
  return unlisten
}

export async function openOAuthUrl(url: string): Promise<void> {
  await invoke('open_url_in_browser', { url })
}