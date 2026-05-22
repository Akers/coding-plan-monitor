import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @tauri-apps/api/core
const mockInvoke = vi.fn()
vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}))

import { setAutoStart, getAutoStart } from '../../services/autostart'

describe('Autostart Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('setAutoStart', () => {
    it('should call invoke with set_auto_start command and enable=true', async () => {
      mockInvoke.mockResolvedValue(true)
      const result = await setAutoStart(true)
      expect(mockInvoke).toHaveBeenCalledWith('set_auto_start', { enable: true })
      expect(result).toBe(true)
    })

    it('should call invoke with set_auto_start command and enable=false', async () => {
      mockInvoke.mockResolvedValue(false)
      const result = await setAutoStart(false)
      expect(mockInvoke).toHaveBeenCalledWith('set_auto_start', { enable: false })
      expect(result).toBe(false)
    })

    it('should propagate errors from invoke', async () => {
      mockInvoke.mockRejectedValue(new Error('autostart failed'))
      await expect(setAutoStart(true)).rejects.toThrow('autostart failed')
    })
  })

  describe('getAutoStart', () => {
    it('should call invoke with get_auto_start command', async () => {
      mockInvoke.mockResolvedValue(true)
      const result = await getAutoStart()
      expect(mockInvoke).toHaveBeenCalledWith('get_auto_start')
      expect(result).toBe(true)
    })

    it('should return false when autostart is disabled', async () => {
      mockInvoke.mockResolvedValue(false)
      const result = await getAutoStart()
      expect(mockInvoke).toHaveBeenCalledWith('get_auto_start')
      expect(result).toBe(false)
    })

    it('should propagate errors from invoke', async () => {
      mockInvoke.mockRejectedValue(new Error('failed to get autostart status'))
      await expect(getAutoStart()).rejects.toThrow('failed to get autostart status')
    })
  })
})
