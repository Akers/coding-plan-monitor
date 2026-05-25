import { createPinia, setActivePinia } from 'pinia'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Config from '@/views/Config.vue'

// Mock before imports
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue({
    refreshInterval: 30,
    carouselInterval: 10,
    panelBgColor: '#333333',
    panelOpacity: 0.8,
    panelEdge: 'top',
    panelLocked: false,
    clickThrough: false,
    threshold1: 50,
    threshold2: 80,
    thresholdColor1: '#4caf50',
    thresholdColor2: '#ff9800',
    thresholdColor3: '#f44336',
    alertEnabled: true,
    alertThreshold: 80,
    autoStart: false,
    providers: [],
  }),
}))

vi.mock('@tauri-apps/api/event', () => ({
  emit: vi.fn(),
}))

const mockClose = vi.fn()
vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => ({ close: mockClose }),
}))

describe('Config', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders three tab buttons', () => {
    const wrapper = mount(Config, {
      global: {
        stubs: {
          GeneralSettings: true,
          DisplaySettings: true,
          ProviderSettings: true,
        },
      },
    })
    const buttons = wrapper.findAll('.tab-btn')
    expect(buttons.length).toBe(3)
    expect(buttons[0].text()).toBe('通用设置')
    expect(buttons[1].text()).toBe('显示设置')
    expect(buttons[2].text()).toBe('供应商')
  })

  it('shows general settings tab by default', () => {
    const wrapper = mount(Config, {
      global: {
        stubs: {
          GeneralSettings: true,
          DisplaySettings: true,
          ProviderSettings: true,
        },
      },
    })
    expect(wrapper.findComponent({ name: 'GeneralSettings' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'DisplaySettings' }).exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'ProviderSettings' }).exists()).toBe(false)
  })

  it('switches tab content when clicking tab button', async () => {
    const wrapper = mount(Config, {
      global: {
        stubs: {
          GeneralSettings: true,
          DisplaySettings: true,
          ProviderSettings: true,
        },
      },
    })
    const buttons = wrapper.findAll('.tab-btn')
    await buttons[1].trigger('click')
    expect(wrapper.findComponent({ name: 'DisplaySettings' }).exists()).toBe(true)
    await buttons[2].trigger('click')
    expect(wrapper.findComponent({ name: 'ProviderSettings' }).exists()).toBe(true)
  })

  it('save button is disabled when dirty is false', () => {
    const wrapper = mount(Config, {
      global: {
        stubs: {
          GeneralSettings: true,
          DisplaySettings: true,
          ProviderSettings: true,
        },
      },
    })
    const saveBtn = wrapper.find('.btn-save')
    expect((saveBtn.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('cancel button calls cancelChanges', async () => {
    const wrapper = mount(Config, {
      global: {
        stubs: {
          GeneralSettings: true,
          DisplaySettings: true,
          ProviderSettings: true,
        },
      },
    })
    const cancelBtn = wrapper.find('.btn-cancel')
    await cancelBtn.trigger('click')
    // cancelChanges should reset dirty to false
    const saveBtn = wrapper.find('.btn-save')
    expect((saveBtn.element as HTMLButtonElement).disabled).toBe(true)
    expect(mockClose).toHaveBeenCalledTimes(1)
  })

  it('onMounted calls loadConfig', async () => {
    const { invoke } = await import('@tauri-apps/api/core')
    mount(Config, {
      global: {
        stubs: {
          GeneralSettings: true,
          DisplaySettings: true,
          ProviderSettings: true,
        },
      },
    })
    expect(invoke).toHaveBeenCalledWith('load_config')
  })
})
