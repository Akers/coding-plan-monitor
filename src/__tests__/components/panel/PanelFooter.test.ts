import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PanelFooter from '@/components/panel/PanelFooter.vue'

describe('PanelFooter', () => {
  it('应该显示刷新时间文本', () => {
    const wrapper = mount(PanelFooter, {
      props: {
        refreshTimeText: '30秒前',
      },
    })
    expect(wrapper.text()).toContain('30秒前')
  })

  it('没有刷新时间时应该显示占位文本', () => {
    const wrapper = mount(PanelFooter, {
      props: {
        refreshTimeText: null,
      },
    })
    expect(wrapper.text()).toContain('尚未刷新')
  })

  it('应该有设置按钮', () => {
    const wrapper = mount(PanelFooter, {
      props: { refreshTimeText: '10秒前' },
    })
    const btn = wrapper.find('.btn-settings')
    expect(btn.exists()).toBe(true)
  })

  it('点击设置按钮应该 emit openConfig', () => {
    const wrapper = mount(PanelFooter, {
      props: { refreshTimeText: '10秒前' },
    })
    wrapper.find('.btn-settings').trigger('click')
    expect(wrapper.emitted('openConfig')).toBeTruthy()
  })

  it('锁定按钮应该反映锁定状态', () => {
    const wrapper = mount(PanelFooter, {
      props: { refreshTimeText: '10秒前', locked: true },
    })
    const btn = wrapper.find('.btn-lock')
    expect(btn.classes()).toContain('locked')
  })

  it('点击锁定按钮应该 emit toggleLock', () => {
    const wrapper = mount(PanelFooter, {
      props: { refreshTimeText: '10秒前', locked: false },
    })
    wrapper.find('.btn-lock').trigger('click')
    expect(wrapper.emitted('toggleLock')).toBeTruthy()
  })

  it('未贴边时最小化按钮应该禁用', () => {
    const wrapper = mount(PanelFooter, {
      props: { refreshTimeText: '10秒前', canMinimize: false },
    })
    const btn = wrapper.find('.btn-minimize')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('贴边时最小化按钮应该可用', () => {
    const wrapper = mount(PanelFooter, {
      props: { refreshTimeText: '10秒前', canMinimize: true },
    })
    const btn = wrapper.find('.btn-minimize')
    expect(btn.attributes('disabled')).toBeUndefined()
  })

  it('点击最小化按钮应该 emit minimize', () => {
    const wrapper = mount(PanelFooter, {
      props: { refreshTimeText: '10秒前', canMinimize: true },
    })
    wrapper.find('.btn-minimize').trigger('click')
    expect(wrapper.emitted('minimize')).toBeTruthy()
  })
})
