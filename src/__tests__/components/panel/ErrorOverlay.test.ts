import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ErrorOverlay from '@/components/panel/ErrorOverlay.vue'

describe('ErrorOverlay', () => {
  it('有错误时应该显示错误标记', () => {
    const wrapper = mount(ErrorOverlay, {
      props: { error: '连接失败' },
    })
    expect(wrapper.text()).toContain('连接失败')
    expect(wrapper.find('.error-overlay').exists()).toBe(true)
  })

  it('无错误时不应该渲染', () => {
    const wrapper = mount(ErrorOverlay, {
      props: { error: null },
    })
    expect(wrapper.find('.error-overlay').exists()).toBe(false)
  })

  it('403 错误应该显示重新授权按钮', () => {
    const wrapper = mount(ErrorOverlay, {
      props: { error: '403 Forbidden' },
    })
    expect(wrapper.text()).toContain('重新授权')
    expect(wrapper.find('.btn-reauth').exists()).toBe(true)
  })

  it('非 403 错误不应该显示重新授权按钮', () => {
    const wrapper = mount(ErrorOverlay, {
      props: { error: '网络超时' },
    })
    expect(wrapper.find('.btn-reauth').exists()).toBe(false)
  })

  it('点击重新授权按钮应该 emit reauth', () => {
    const wrapper = mount(ErrorOverlay, {
      props: { error: '403 授权已过期' },
    })
    wrapper.find('.btn-reauth').trigger('click')
    expect(wrapper.emitted('reauth')).toBeTruthy()
  })
})
