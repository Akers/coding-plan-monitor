import { debug, info, warn, error } from '@tauri-apps/plugin-log'

const isDev = import.meta.env.DEV

export async function logDebug(msg: string): Promise<void> {
  if (isDev) console.debug('[DEBUG]', msg)
  await debug(msg)
}

export async function logInfo(msg: string): Promise<void> {
  if (isDev) console.info('[INFO]', msg)
  await info(msg)
}

export async function logWarn(msg: string): Promise<void> {
  if (isDev) console.warn('[WARN]', msg)
  await warn(msg)
}

export async function logError(msg: string): Promise<void> {
  if (isDev) console.error('[ERROR]', msg)
  await error(msg)
}