import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useConfigStore } from '@/stores/config'

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

import { invoke } from '@tauri-apps/api/core'
const mockInvoke = invoke as unknown as ReturnType<typeof vi.fn>

describe('useConfigStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('loadConfig', () => {
    it('should load config from Rust backend', async () => {
      const mockConfig = {
        refreshInterval: 30,
        carouselInterval: 10,
        panelBgColor: '#333333',
        panelOpacity: 0.8,
        panelEdge: 'top',
        panelLocked: false,
        clickThrough: false,
        threshold1: 50,
        threshold2: 80,
        thresholdColor1: '#4caf50',
        thresholdColor2: '#ff9800',
        thresholdColor3: '#f44336',
        alertEnabled: true,
        alertThreshold: 80,
        autoStart: false,
        providers: [],
      }

      mockInvoke.mockResolvedValueOnce(mockConfig)

      const store = useConfigStore()
      await store.loadConfig()

      expect(mockInvoke).toHaveBeenCalledWith('load_config')
      expect(store.config).toEqual(mockConfig)
      expect(store.loaded).toBe(true)
    })

    it('should use default config when load fails', async () => {
      mockInvoke.mockRejectedValueOnce(new Error('Failed to load'))

      const store = useConfigStore()
      await store.loadConfig()

      expect(store.config.refreshInterval).toBe(30)
      expect(store.config.providers).toEqual([])
      expect(store.loaded).toBe(true)
    })
  })

  describe('saveConfig', () => {
    it('should save config via Rust backend', async () => {
      mockInvoke.mockResolvedValueOnce(undefined) // load_config
      mockInvoke.mockResolvedValueOnce(undefined) // save_config

      const store = useConfigStore()
      await store.loadConfig()

      store.config.refreshInterval = 60
      await store.saveConfig()

      expect(mockInvoke).toHaveBeenCalledWith('save_config', {
        config: expect.objectContaining({ refreshInterval: 60 }),
      })
      expect(store.dirty).toBe(false)
    })

    it('should handle save failure', async () => {
      mockInvoke.mockResolvedValueOnce(undefined) // load_config
      mockInvoke.mockRejectedValueOnce(new Error('Save failed')) // save_config

      const store = useConfigStore()
      await store.loadConfig()

      store.config.refreshInterval = 60
      await expect(store.saveConfig()).rejects.toThrow('Save failed')
    })
  })

  describe('updateConfig', () => {
    it('should partially update config and mark as dirty', async () => {
      mockInvoke.mockResolvedValueOnce(undefined)

      const store = useConfigStore()
      await store.loadConfig()

      store.updateConfig({ refreshInterval: 120, autoStart: true })

      expect(store.config.refreshInterval).toBe(120)
      expect(store.config.autoStart).toBe(true)
      expect(store.config.carouselInterval).toBe(10) // unchanged
      expect(store.dirty).toBe(true)
    })
  })

  describe('resetConfig', () => {
    it('should reset to default values', async () => {
      mockInvoke.mockResolvedValueOnce(undefined)

      const store = useConfigStore()
      await store.loadConfig()

      store.updateConfig({ refreshInterval: 999 })
      store.resetConfig()

      expect(store.config.refreshInterval).toBe(30)
      expect(store.dirty).toBe(false)
    })
  })
})
