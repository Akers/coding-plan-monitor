import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @tauri-apps/api/core
const mockInvoke = vi.fn()
vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}))

// Mock @tauri-apps/api/event
const mockListen = vi.fn(() => Promise.resolve(() => {}))
vi.mock('@tauri-apps/api/event', () => ({
  listen: (...args: unknown[]) => mockListen(...args),
}))

import {
  togglePanel,
  openConfigWindow,
  updateTrayStatus,
  onTrayEvent,
} from '../../services/tray'

describe('Tray Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('togglePanel', () => {
    it('should call invoke with toggle_panel command', async () => {
      mockInvoke.mockResolvedValue(undefined)
      await togglePanel()
      expect(mockInvoke).toHaveBeenCalledWith('toggle_panel')
    })

    it('should propagate errors from invoke', async () => {
      mockInvoke.mockRejectedValue(new Error('window not found'))
      await expect(togglePanel()).rejects.toThrow('window not found')
    })
  })

  describe('openConfigWindow', () => {
    it('should call invoke with open_config_window command', async () => {
      mockInvoke.mockResolvedValue(undefined)
      await openConfigWindow()
      expect(mockInvoke).toHaveBeenCalledWith('open_config_window')
    })
  })

  describe('updateTrayStatus', () => {
    it('should call invoke with update_tray_status and normal status', async () => {
      mockInvoke.mockResolvedValue(undefined)
      await updateTrayStatus('normal')
      expect(mockInvoke).toHaveBeenCalledWith('update_tray_status', {
        status: 'normal',
      })
    })

    it('should call invoke with warning status', async () => {
      mockInvoke.mockResolvedValue(undefined)
      await updateTrayStatus('warning')
      expect(mockInvoke).toHaveBeenCalledWith('update_tray_status', {
        status: 'warning',
      })
    })

    it('should call invoke with error status', async () => {
      mockInvoke.mockResolvedValue(undefined)
      await updateTrayStatus('error')
      expect(mockInvoke).toHaveBeenCalledWith('update_tray_status', {
        status: 'error',
      })
    })
  })

  describe('onTrayEvent', () => {
    it('should listen for open-config event', async () => {
      const callback = vi.fn()
      await onTrayEvent(callback)
      expect(mockListen).toHaveBeenCalledWith('open-config', expect.any(Function))
    })

    it('should return an unlisten function', async () => {
      const unlisten = await onTrayEvent(vi.fn())
      expect(typeof unlisten).toBe('function')
    })
  })
})
