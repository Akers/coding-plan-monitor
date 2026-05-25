import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @tauri-apps/api/core
const mockInvoke = vi.fn()
vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}))

// Mock @tauri-apps/api/event
const mockListen = vi.fn()
vi.mock('@tauri-apps/api/event', () => ({
  listen: (...args: unknown[]) => mockListen(...args),
}))

import {
  startOAuth,
  stopOAuth,
  onOAuthCallback,
  openOAuthUrl,
} from '../../services/oauth'

describe('OAuth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('startOAuth', () => {
    it('should call invoke with start_oauth_server command and port', async () => {
      mockInvoke.mockResolvedValue(undefined)
      await startOAuth('zhipu', 3847)
      expect(mockInvoke).toHaveBeenCalledWith('start_oauth_server', { port: 3847 })
    })

    it('should propagate errors from invoke', async () => {
      mockInvoke.mockRejectedValue(new Error('server already running'))
      await expect(startOAuth('volcengine', 3847)).rejects.toThrow('server already running')
    })
  })

  describe('stopOAuth', () => {
    it('should call invoke with stop_oauth_server command', async () => {
      mockInvoke.mockResolvedValue(undefined)
      await stopOAuth()
      expect(mockInvoke).toHaveBeenCalledWith('stop_oauth_server')
    })
  })

  describe('onOAuthCallback', () => {
    it('should listen for oauth-callback event', async () => {
      const callback = vi.fn()
      mockListen.mockResolvedValue(() => {})
      await onOAuthCallback(callback)
      expect(mockListen).toHaveBeenCalledWith('oauth-callback', expect.any(Function))
    })

    it('should return an unlisten function', async () => {
      const unlistenFn = vi.fn()
      mockListen.mockResolvedValue(unlistenFn)
      const unlisten = await onOAuthCallback(vi.fn())
      expect(unlisten).toBe(unlistenFn)
    })

    it('should call callback with payload when event is received', async () => {
      const callback = vi.fn()
      mockListen.mockImplementation((eventName, handler) => {
        // Simulate event being received
        setTimeout(() => {
          handler({ payload: { token: 'test-token-123', provider_id: 'zhipu' } })
        }, 0)
        return Promise.resolve(() => {})
      })
      await onOAuthCallback(callback)
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10))
      expect(callback).toHaveBeenCalledWith({ token: 'test-token-123', provider_id: 'zhipu' })
    })
  })

  describe('openOAuthUrl', () => {
    it('should call invoke with open_url_in_browser command and URL', async () => {
      mockInvoke.mockResolvedValue(undefined)
      await openOAuthUrl('https://auth.zhipu.ai/oauth/authorize?client_id=xxx')
      expect(mockInvoke).toHaveBeenCalledWith('open_url_in_browser', {
        url: 'https://auth.zhipu.ai/oauth/authorize?client_id=xxx',
      })
    })

    it('should propagate errors from invoke', async () => {
      mockInvoke.mockRejectedValue(new Error('failed to open browser'))
      await expect(openOAuthUrl('https://auth.example.com')).rejects.toThrow('failed to open browser')
    })
  })
})
