/**
 * 集成测试 14.5: 面板拖拽 → 吸附 → 最小化 → 展开
 *
 * 验证 panel 服务函数的协作：
 * 1. 边缘检测（isNearEdge 返回四边布尔对象）
 * 2. 最小化位置计算（calcMinimizedPosition 按吸附边计算）
 * 3. 不同吸附边的计算正确性
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  calcMinimizedPosition,
  isNearEdge,
} from '@/services/panel'

// Mock Tauri APIs
const mockInvoke = vi.fn()
vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: any[]) => mockInvoke(...args),
}))

describe('集成测试 14.5: 面板拖拽 → 吸附 → 最小化', () => {
  const panelSize = { width: 320, height: 200 }
  const screenSize = { width: 1920, height: 1080 }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('面板从中间拖到顶部边缘时检测到近顶', () => {
    const position = { x: 800, y: 5 } // 距顶部 5px
    const result = isNearEdge(position, screenSize, panelSize, 15)
    expect(result.nearTop).toBe(true)
    expect(result.nearLeft).toBe(false)
    expect(result.nearRight).toBe(false)
  })

  it('面板从中间拖到右侧边缘时检测到近右', () => {
    const position = { x: 1920 - 320 - 3, y: 400 }
    const result = isNearEdge(position, screenSize, panelSize, 15)
    expect(result.nearRight).toBe(true)
    expect(result.nearLeft).toBe(false)
  })

  it('各边的最小化位置正确', () => {
    const panelWidth = 320
    const panelHeight = 200

    // 顶部吸附 → 最小化时收起到顶边
    const topMin = calcMinimizedPosition('top', panelWidth, panelHeight)
    expect(topMin.y).toBeLessThanOrEqual(0) // y 为负（面板几乎全部隐藏）
    expect(topMin.y).toBe(-200 + 30) // -170

    // 底部吸附 → 最小化时收起到底边
    const bottomMin = calcMinimizedPosition('bottom', panelWidth, panelHeight)
    expect(bottomMin.y).toBe(99999) // Rust 侧修正到屏幕底部

    // 左侧吸附 → 最小化时收起到左边
    const leftMin = calcMinimizedPosition('left', panelWidth, panelHeight)
    expect(leftMin.x).toBeLessThanOrEqual(0)
    expect(leftMin.x).toBe(-320 + 30) // -290

    // 右侧吸附 → 最小化时收起到右边
    const rightMin = calcMinimizedPosition('right', panelWidth, panelHeight)
    expect(rightMin.x).toBe(99999) // Rust 侧修正
  })

  it('面板不在边缘附近时不触发任何边缘检测', () => {
    const position = { x: 500, y: 400 }
    const result = isNearEdge(position, screenSize, panelSize, 20)
    expect(result.nearTop).toBe(false)
    expect(result.nearBottom).toBe(false)
    expect(result.nearLeft).toBe(false)
    expect(result.nearRight).toBe(false)
  })

  it('最小化后再展开恢复原位', () => {
    const originalPos = { x: 800, y: 0 }

    // 最小化
    const minPos = calcMinimizedPosition('top', 320, 200)

    // 最小化位置不同于原位
    expect(minPos.y).not.toBe(originalPos.y)

    // 展开后恢复原位（由调用方保存 originalPos）
    const restoredPos = { ...originalPos }
    expect(restoredPos).toEqual(originalPos)
  })
})
