import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProviderTabs from '@/components/panel/ProviderTabs.vue'
import type { ProviderId } from '@/types/data-model'

describe('ProviderTabs', () => {
  const providers: ProviderId[] = ['minimax', 'zhipu', 'volcengine']
  const providerNames: Record<ProviderId, string> = {
    minimax: 'MiniMax',
    zhipu: '智谱',
    volcengine: '火山',
  }

  it('应该渲染所有供应商标签', () => {
    const wrapper = mount(ProviderTabs, {
      props: {
        providers,
        currentIndex: 0,
        providerNames,
      },
    })
    expect(wrapper.text()).toContain('MiniMax')
    expect(wrapper.text()).toContain('智谱')
    expect(wrapper.text()).toContain('火山')
  })

  it('当前供应商标签应该有 active 类', () => {
    const wrapper = mount(ProviderTabs, {
      props: {
        providers,
        currentIndex: 1,
        providerNames,
      },
    })
    const tabs = wrapper.findAll('.provider-tab')
    expect(tabs[0].classes()).not.toContain('active')
    expect(tabs[1].classes()).toContain('active')
    expect(tabs[2].classes()).not.toContain('active')
  })

  it('点击左箭头应该 emit prev', () => {
    const wrapper = mount(ProviderTabs, {
      props: {
        providers,
        currentIndex: 1,
        providerNames,
      },
    })
    const prevBtn = wrapper.find('.tab-arrow-prev')
    prevBtn.trigger('click')
    expect(wrapper.emitted('prev')).toBeTruthy()
  })

  it('点击右箭头应该 emit next', () => {
    const wrapper = mount(ProviderTabs, {
      props: {
        providers,
        currentIndex: 1,
        providerNames,
      },
    })
    const nextBtn = wrapper.find('.tab-arrow-next')
    nextBtn.trigger('click')
    expect(wrapper.emitted('next')).toBeTruthy()
  })

  it('只有一个供应商时不应该显示箭头', () => {
    const wrapper = mount(ProviderTabs, {
      props: {
        providers: ['minimax'],
        currentIndex: 0,
        providerNames,
      },
    })
    expect(wrapper.find('.tab-arrow-prev').exists()).toBe(false)
    expect(wrapper.find('.tab-arrow-next').exists()).toBe(false)
  })

  it('点击标签应该 emit select', () => {
    const wrapper = mount(ProviderTabs, {
      props: {
        providers,
        currentIndex: 0,
        providerNames,
      },
    })
    const tabs = wrapper.findAll('.provider-tab')
    tabs[2].trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual([2])
  })
})
