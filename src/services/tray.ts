import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

/**
 * 托盘状态
 */
export type TrayStatus = 'normal' | 'warning' | 'error'

/**
 * 切换面板可见性
 */
export async function togglePanel(): Promise<void> {
  await invoke('toggle_panel')
}

/**
 * 打开配置窗口
 */
export async function openConfigWindow(): Promise<void> {
  await invoke('open_config_window')
}

/**
 * 更新托盘状态（图标提示）
 */
export async function updateTrayStatus(status: TrayStatus): Promise<void> {
  await invoke('update_tray_status', { status })
}

/**
 * 监听托盘相关事件
 */
export async function onTrayEvent(
  callback: (event: { event: string; payload: unknown }) => void
): Promise<() => void> {
  const unlisten = await listen('open-config', (event) => {
    callback({ event: 'open-config', payload: event.payload })
  })
  return unlisten
}
