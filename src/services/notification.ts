import { sendNotification as tauriSendNotification } from '@tauri-apps/plugin-notification'

/**
 * 发送系统通知
 * @param notification 包含 title 和 body 的通知对象
 */
export async function sendNotification(notification: { title: string; body: string }): Promise<void> {
  tauriSendNotification({
    title: notification.title,
    body: notification.body,
  })
}
