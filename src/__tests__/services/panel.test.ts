import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @tauri-apps/api/core
const mockInvoke = vi.fn()
vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}))

// Mock @tauri-apps/api/window
const mockStartDragging = vi.fn()
vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => ({
    startDragging: (...args: unknown[]) => mockStartDragging(...args),
  }),
}))

import {
  setClickThrough,
  setPanelAlwaysOnTop,
  setPanelPosition,
  setPanelSize,
  getPanelPosition,
  getScreenSize,
  snapPanelToEdge,
  calcMinimizedPosition,
  startDrag,
  isNearEdge,
} from '../../services/panel'

describe('Panel Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('setClickThrough', () => {
    it('should call invoke with enable=true', async () => {
      mockInvoke.mockResolvedValue(undefined)
      await setClickThrough(true)
      expect(mockInvoke).toHaveBeenCalledWith('set_click_through', { enable: true })
    })

    it('should call invoke with enable=false', async () => {
      mockInvoke.mockResolvedValue(undefined)
      await setClickThrough(false)
      expect(mockInvoke).toHaveBeenCalledWith('set_click_through', { enable: false })
    })
  })

  describe('setPanelAlwaysOnTop', () => {
    it('should call invoke with alwaysOnTop flag', async () => {
      mockInvoke.mockResolvedValue(undefined)
      await setPanelAlwaysOnTop(true)
      expect(mockInvoke).toHaveBeenCalledWith('set_panel_always_on_top', { alwaysOnTop: true })
    })
  })

  describe('setPanelPosition', () => {
    it('should call invoke with x and y', async () => {
      mockInvoke.mockResolvedValue(undefined)
      await setPanelPosition(100, 200)
      expect(mockInvoke).toHaveBeenCalledWith('set_panel_position', { x: 100, y: 200 })
    })
  })

  describe('setPanelSize', () => {
    it('should call invoke with width and height', async () => {
      mockInvoke.mockResolvedValue(undefined)
      await setPanelSize(320, 200)
      expect(mockInvoke).toHaveBeenCalledWith('set_panel_size', { width: 320, height: 200 })
    })
  })

  describe('getPanelPosition', () => {
    it('should return position object from tuple', async () => {
      mockInvoke.mockResolvedValue([100, 200])
      const pos = await getPanelPosition()
      expect(pos).toEqual({ x: 100, y: 200 })
    })
  })

  describe('getScreenSize', () => {
    it('should return size object from tuple', async () => {
      mockInvoke.mockResolvedValue([1920, 1080])
      const size = await getScreenSize()
      expect(size).toEqual({ width: 1920, height: 1080 })
    })
  })

  describe('snapPanelToEdge', () => {
    it('should call invoke and return snapped position', async () => {
      mockInvoke.mockResolvedValue([0, 0])
      const pos = await snapPanelToEdge(320, 200)
      expect(mockInvoke).toHaveBeenCalledWith('snap_panel_to_edge', {
        panelWidth: 320,
        panelHeight: 200,
        threshold: null,
      })
      expect(pos).toEqual({ x: 0, y: 0 })
    })

    it('should pass custom threshold', async () => {
      mockInvoke.mockResolvedValue([0, 0])
      await snapPanelToEdge(320, 200, 30)
      expect(mockInvoke).toHaveBeenCalledWith('snap_panel_to_edge', {
        panelWidth: 320,
        panelHeight: 200,
        threshold: 30,
      })
    })
  })

  describe('calcMinimizedPosition', () => {
    it('should calculate top minimized position', () => {
      const pos = calcMinimizedPosition('top', 320, 200, 30)
      expect(pos).toEqual({ x: 0, y: -170 }) // -200 + 30
    })

    it('should calculate bottom minimized position', () => {
      const pos = calcMinimizedPosition('bottom', 320, 200, 30)
      expect(pos).toEqual({ x: 0, y: 99999 })
    })

    it('should calculate left minimized position', () => {
      const pos = calcMinimizedPosition('left', 320, 200, 30)
      expect(pos).toEqual({ x: -290, y: 0 }) // -320 + 30
    })

    it('should calculate right minimized position', () => {
      const pos = calcMinimizedPosition('right', 320, 200, 30)
      expect(pos).toEqual({ x: 99999, y: 0 })
    })

    it('should use default collapsed size', () => {
      const pos = calcMinimizedPosition('top', 320, 200)
      expect(pos).toEqual({ x: 0, y: -170 }) // -200 + 30
    })
  })

  describe('startDrag', () => {
    it('should call window startDragging', async () => {
      mockStartDragging.mockResolvedValue(undefined)
      await startDrag()
      expect(mockStartDragging).toHaveBeenCalled()
    })
  })

  describe('isNearEdge', () => {
    const screenSize = { width: 1920, height: 1080 }
    const panelSize = { width: 320, height: 200 }

    it('should detect near left edge', () => {
      const result = isNearEdge({ x: 10, y: 500 }, screenSize, panelSize)
      expect(result.nearLeft).toBe(true)
      expect(result.nearRight).toBe(false)
    })

    it('should detect near right edge', () => {
      const result = isNearEdge({ x: 1850, y: 500 }, screenSize, panelSize)
      expect(result.nearLeft).toBe(false)
      expect(result.nearRight).toBe(true) // 1850 + 320 = 2170 > 1900
    })

    it('should detect near top edge', () => {
      const result = isNearEdge({ x: 500, y: 10 }, screenSize, panelSize)
      expect(result.nearTop).toBe(true)
    })

    it('should detect near bottom edge', () => {
      const result = isNearEdge({ x: 500, y: 1020 }, screenSize, panelSize)
      expect(result.nearBottom).toBe(true) // 1020 + 200 = 1220 > 1060
    })

    it('should detect not near any edge', () => {
      const result = isNearEdge({ x: 500, y: 500 }, screenSize, panelSize)
      expect(result.nearLeft).toBe(false)
      expect(result.nearRight).toBe(false)
      expect(result.nearTop).toBe(false)
      expect(result.nearBottom).toBe(false)
    })

    it('should use custom threshold', () => {
      const result = isNearEdge({ x: 25, y: 500 }, screenSize, panelSize, 20)
      expect(result.nearLeft).toBe(false) // 25 > 20
    })
  })
})
