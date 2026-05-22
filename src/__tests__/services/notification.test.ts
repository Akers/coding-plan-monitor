import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendNotification } from '@/services/notification'

// Mock @tauri-apps/plugin-notification
vi.mock('@tauri-apps/plugin-notification', () => ({
  sendNotification: vi.fn(),
}))

describe('Notification Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('sendNotification', () => {
    it('should call tauri plugin notification with correct parameters', async () => {
      const notification = {
        title: '额度提醒',
        body: 'Zhipu 额度 已达 90%，请留意用量',
      }

      await sendNotification(notification)

      // Import the mock after it's been set up
      const { sendNotification: tauriSendNotification } = await import('@tauri-apps/plugin-notification')

      expect(tauriSendNotification).toHaveBeenCalledTimes(1)
      expect(tauriSendNotification).toHaveBeenCalledWith({
        title: '额度提醒',
        body: 'Zhipu 额度 已达 90%，请留意用量',
      })
    })

    it('should pass through title and body correctly', async () => {
      const notification = {
        title: 'Test Title',
        body: 'Test Body Content',
      }

      await sendNotification(notification)

      const { sendNotification: tauriSendNotification } = await import('@tauri-apps/plugin-notification')

      expect(tauriSendNotification).toHaveBeenCalledWith({
        title: 'Test Title',
        body: 'Test Body Content',
      })
    })
  })
})
