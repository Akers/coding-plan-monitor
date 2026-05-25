import { describe, it, expect, vi, beforeEach } from 'vitest'
import { logInfo, logWarn, logError, logDebug } from '@/services/logger'

// Mock @tauri-apps/plugin-log
vi.mock('@tauri-apps/plugin-log', () => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  attachLogger: vi.fn(),
}))

// Mock console methods to verify dev mode output
vi.mock('console', () => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}))

describe('Logger Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset DEV to original value
    vi.stubEnv('DEV', 'false' as any)
  })

  describe('logInfo', () => {
    it('should call info function from @tauri-apps/plugin-log', async () => {
      const { info } = await import('@tauri-apps/plugin-log')
      const testMessage = 'Test info message'

      await logInfo(testMessage)

      expect(info).toHaveBeenCalledTimes(1)
      expect(info).toHaveBeenCalledWith(testMessage)
    })

    it('should output to console in dev mode', async () => {
      vi.stubEnv('DEV', 'true' as any)
      const consoleSpy = vi.spyOn(console, 'info')

      await logInfo('Dev info message')

      expect(consoleSpy).toHaveBeenCalledWith('[INFO]', 'Dev info message')
    })
  })

  describe('logWarn', () => {
    it('should call warn function from @tauri-apps/plugin-log', async () => {
      const { warn } = await import('@tauri-apps/plugin-log')
      const testMessage = 'Test warning message'

      await logWarn(testMessage)

      expect(warn).toHaveBeenCalledTimes(1)
      expect(warn).toHaveBeenCalledWith(testMessage)
    })

    it('should output to console in dev mode', async () => {
      vi.stubEnv('DEV', 'true' as any)
      const consoleSpy = vi.spyOn(console, 'warn')

      await logWarn('Dev warn message')

      expect(consoleSpy).toHaveBeenCalledWith('[WARN]', 'Dev warn message')
    })
  })

  describe('logError', () => {
    it('should call error function from @tauri-apps/plugin-log', async () => {
      const { error } = await import('@tauri-apps/plugin-log')
      const testMessage = 'Test error message'

      await logError(testMessage)

      expect(error).toHaveBeenCalledTimes(1)
      expect(error).toHaveBeenCalledWith(testMessage)
    })

    it('should output to console in dev mode', async () => {
      vi.stubEnv('DEV', 'true' as any)
      const consoleSpy = vi.spyOn(console, 'error')

      await logError('Dev error message')

      expect(consoleSpy).toHaveBeenCalledWith('[ERROR]', 'Dev error message')
    })
  })

  describe('logDebug', () => {
    it('should call debug function from @tauri-apps/plugin-log', async () => {
      const { debug } = await import('@tauri-apps/plugin-log')
      const testMessage = 'Test debug message'

      await logDebug(testMessage)

      expect(debug).toHaveBeenCalledTimes(1)
      expect(debug).toHaveBeenCalledWith(testMessage)
    })

    it('should output to console in dev mode', async () => {
      vi.stubEnv('DEV', 'true' as any)
      const consoleSpy = vi.spyOn(console, 'debug')

      await logDebug('Dev debug message')

      expect(consoleSpy).toHaveBeenCalledWith('[DEBUG]', 'Dev debug message')
    })
  })
})