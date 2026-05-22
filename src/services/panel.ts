import { invoke } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'

/**
 * 面板吸附边
 */
export type PanelEdge = 'top' | 'bottom' | 'left' | 'right'

/**
 * 面板位置
 */
export interface Position {
  x: number
  y: number
}

/**
 * 面板尺寸
 */
export interface Size {
  width: number
  height: number
}

/**
 * 设置面板点击穿透
 */
export async function setClickThrough(enable: boolean): Promise<void> {
  await invoke('set_click_through', { enable })
}

/**
 * 设置面板置顶
 */
export async function setPanelAlwaysOnTop(alwaysOnTop: boolean): Promise<void> {
  await invoke('set_panel_always_on_top', { alwaysOnTop })
}

/**
 * 设置面板位置
 */
export async function setPanelPosition(x: number, y: number): Promise<void> {
  await invoke('set_panel_position', { x, y })
}

/**
 * 设置面板大小
 */
export async function setPanelSize(width: number, height: number): Promise<void> {
  await invoke('set_panel_size', { width, height })
}

/**
 * 获取面板位置
 */
export async function getPanelPosition(): Promise<Position> {
  const [x, y] = await invoke<[number, number]>('get_panel_position')
  return { x, y }
}

/**
 * 获取屏幕尺寸
 */
export async function getScreenSize(): Promise<Size> {
  const [width, height] = await invoke<[number, number]>('get_screen_size')
  return { width, height }
}

/**
 * 面板吸附到屏幕边缘
 * @returns 吸附后的位置
 */
export async function snapPanelToEdge(
  panelWidth: number,
  panelHeight: number,
  threshold?: number
): Promise<Position> {
  const [x, y] = await invoke<[number, number]>('snap_panel_to_edge', {
    panelWidth,
    panelHeight,
    threshold: threshold ?? null,
  })
  return { x, y }
}

/**
 * 计算面板最小化后的位置（贴到屏幕边缘）
 */
export function calcMinimizedPosition(
  edge: PanelEdge,
  panelWidth: number,
  panelHeight: number,
  collapsedSize: number = 30
): Position {
  switch (edge) {
    case 'top':
      return { x: 0, y: -panelHeight + collapsedSize }
    case 'bottom':
      return { x: 0, y: 99999 } // Rust 侧会自动修正到屏幕底部
    case 'left':
      return { x: -panelWidth + collapsedSize, y: 0 }
    case 'right':
      return { x: 99999, y: 0 } // Rust 侧会自动修正
  }
}

/**
 * 启动面板拖拽（使用 Tauri 内置的 startDragging）
 */
export async function startDrag(): Promise<void> {
  await getCurrentWindow().startDragging()
}

/**
 * 面板位置工具函数：检测是否靠近屏幕边缘
 */
export function isNearEdge(
  pos: Position,
  screenSize: Size,
  panelSize: Size,
  threshold: number = 20
): { nearLeft: boolean; nearRight: boolean; nearTop: boolean; nearBottom: boolean } {
  return {
    nearLeft: pos.x < threshold,
    nearRight: pos.x + panelSize.width > screenSize.width - threshold,
    nearTop: pos.y < threshold,
    nearBottom: pos.y + panelSize.height > screenSize.height - threshold,
  }
}
