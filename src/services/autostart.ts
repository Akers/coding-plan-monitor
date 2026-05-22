import { invoke } from '@tauri-apps/api/core'

export async function setAutoStart(enable: boolean): Promise<boolean> {
  return await invoke<boolean>('set_auto_start', { enable })
}

export async function getAutoStart(): Promise<boolean> {
  return await invoke<boolean>('get_auto_start')
}
