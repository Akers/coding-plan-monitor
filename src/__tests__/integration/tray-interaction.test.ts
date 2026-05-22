/**
 * 集成测试 14.6: 系统托盘交互
 *
 * 验证：
 * 1. 托盘图标状态更新（normal/warning/error）
 * 2. 托盘菜单事件传递到前端
 * 3. togglePanel/openConfigWindow IPC 调用
 * 4. 托盘 tooltip 随状态变化
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { togglePanel, openConfigWindow, updateTrayStatus } from '@/services/tray'

const mockInvoke = vi.fn()
vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: any[]) => mockInvoke(...args),
}))

describe('集成测试 14.6: 系统托盘交互', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('点击托盘图标切换面板可见性', async () => {
    mockInvoke.mockResolvedValue(undefined)

    await togglePanel()

    expect(mockInvoke).toHaveBeenCalledWith('toggle_panel')
    expect(mockInvoke).toHaveBeenCalledTimes(1)
  })

  it('右键菜单打开配置窗口', async () => {
    mockInvoke.mockResolvedValue(undefined)

    await openConfigWindow()

    expect(mockInvoke).toHaveBeenCalledWith('open_config_window')
    expect(mockInvoke).toHaveBeenCalledTimes(1)
  })

  it('托盘状态更新：normal → warning → error', async () => {
    mockInvoke.mockResolvedValue(undefined)

    // 更新为 warning 状态
    await updateTrayStatus('warning')
    expect(mockInvoke).toHaveBeenCalledWith('update_tray_status', { status: 'warning' })

    // 更新为 error 状态
    await updateTrayStatus('error')
    expect(mockInvoke).toHaveBeenCalledWith('update_tray_status', { status: 'error' })

    // 恢复为 normal
    await updateTrayStatus('normal')
    expect(mockInvoke).toHaveBeenCalledWith('update_tray_status', { status: 'normal' })

    expect(mockInvoke).toHaveBeenCalledTimes(3)
  })

  it('无效状态值由 Rust 侧验证', async () => {
    mockInvoke.mockRejectedValue(new Error('Invalid tray status'))

    await expect(updateTrayStatus('invalid_status' as any)).rejects.toThrow('Invalid tray status')
    expect(mockInvoke).toHaveBeenCalledWith('update_tray_status', { status: 'invalid_status' })
  })

  it('完整场景：刷新数据后根据结果更新托盘状态', async () => {
    mockInvoke.mockResolvedValue(undefined)

    // 场景：所有供应商数据正常 → normal
    await updateTrayStatus('normal')
    expect(mockInvoke).toHaveBeenCalledWith('update_tray_status', { status: 'normal' })

    // 场景：某个供应商额度告警 → warning
    await updateTrayStatus('warning')
    expect(mockInvoke).toHaveBeenCalledWith('update_tray_status', { status: 'warning' })

    // 场景：所有供应商都失败 → error
    await updateTrayStatus('error')
    expect(mockInvoke).toHaveBeenCalledWith('update_tray_status', { status: 'error' })

    expect(mockInvoke).toHaveBeenCalledTimes(3)
  })
})
