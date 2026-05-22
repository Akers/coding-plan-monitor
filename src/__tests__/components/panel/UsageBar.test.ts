import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UsageBar from '@/components/panel/UsageBar.vue'
import type { UsageMetric } from '@/types/data-model'

const baseMetric: UsageMetric = {
  label: '5h 额度',
  usedQuota: 30,
  totalQuota: 100,
  percentage: 30,
  unit: '次',
}

describe('UsageBar', () => {
  it('应该渲染维度名称', () => {
    const wrapper = mount(UsageBar, {
      props: { metric: baseMetric, threshold1: 50, threshold2: 80 },
    })
    expect(wrapper.text()).toContain('5h 额度')
  })

  it('应该显示百分比', () => {
    const wrapper = mount(UsageBar, {
      props: { metric: baseMetric, threshold1: 50, threshold2: 80 },
    })
    expect(wrapper.text()).toContain('30%')
  })

  it('应该显示已用/总额', () => {
    const wrapper = mount(UsageBar, {
      props: { metric: baseMetric, threshold1: 50, threshold2: 80 },
    })
    expect(wrapper.text()).toContain('30/100')
    expect(wrapper.text()).toContain('次')
  })

  it('进度条宽度应该与百分比对应', () => {
    const wrapper = mount(UsageBar, {
      props: { metric: baseMetric, threshold1: 50, threshold2: 80 },
    })
    const bar = wrapper.find('.usage-bar-fill')
    expect(bar.attributes('style')).toContain('width: 30%')
  })

  it('低于阈值1应该使用绿色', () => {
    const wrapper = mount(UsageBar, {
      props: { metric: baseMetric, threshold1: 50, threshold2: 80 },
    })
    const bar = wrapper.find('.usage-bar-fill')
    expect(bar.attributes('style')).toContain('background-color: #4caf50')
  })

  it('达到阈值1应该使用黄色', () => {
    const metric: UsageMetric = { ...baseMetric, percentage: 60 }
    const wrapper = mount(UsageBar, {
      props: { metric, threshold1: 50, threshold2: 80 },
    })
    const bar = wrapper.find('.usage-bar-fill')
    expect(bar.attributes('style')).toContain('background-color: #ff9800')
  })

  it('达到阈值2应该使用红色', () => {
    const metric: UsageMetric = { ...baseMetric, percentage: 90 }
    const wrapper = mount(UsageBar, {
      props: { metric, threshold1: 50, threshold2: 80 },
    })
    const bar = wrapper.find('.usage-bar-fill')
    expect(bar.attributes('style')).toContain('background-color: #f44336')
  })

  it('支持自定义颜色', () => {
    const wrapper = mount(UsageBar, {
      props: {
        metric: baseMetric,
        threshold1: 50,
        threshold2: 80,
        color1: '#00ff00',
        color2: '#ffff00',
        color3: '#ff0000',
      },
    })
    const bar = wrapper.find('.usage-bar-fill')
    expect(bar.attributes('style')).toContain('background-color: #00ff00')
  })

  it('有 resetIn 时应该显示重置倒计时', () => {
    const metric: UsageMetric = { ...baseMetric, resetIn: 3600 }
    const wrapper = mount(UsageBar, {
      props: { metric, threshold1: 50, threshold2: 80 },
    })
    expect(wrapper.text()).toContain('重置')
  })

  it('没有 resetIn 时不应该显示重置倒计时', () => {
    const wrapper = mount(UsageBar, {
      props: { metric: baseMetric, threshold1: 50, threshold2: 80 },
    })
    expect(wrapper.text()).not.toContain('重置')
  })

  it('应该格式化 resetIn 秒数为 HH:MM:SS', () => {
    const metric: UsageMetric = { ...baseMetric, resetIn: 3661 } // 1h 1m 1s
    const wrapper = mount(UsageBar, {
      props: { metric, threshold1: 50, threshold2: 80 },
    })
    expect(wrapper.text()).toContain('01:01:01')
  })
})
