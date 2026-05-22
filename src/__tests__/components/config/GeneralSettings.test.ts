import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import GeneralSettings from '@/components/config/GeneralSettings.vue'
import { createDefaultConfig } from '@/types/data-model'

describe('GeneralSettings', () => {
  const defaultConfig = createDefaultConfig()

  it('renders all 7 form fields', () => {
    const wrapper = mount(GeneralSettings, {
      props: { config: defaultConfig },
    })
    const inputs = wrapper.findAll('input')
    const select = wrapper.find('select')
    expect(inputs.length).toBe(6) // 2 number, 1 color, 1 range, 2 checkbox
    expect(select.exists()).toBe(true)
  })

  it('refresh interval input has correct value', () => {
    const config = { ...defaultConfig, refreshInterval: 60 }
    const wrapper = mount(GeneralSettings, { props: { config } })
    const input = wrapper.find('input[type="number"]')
    expect((input.element as HTMLInputElement).value).toBe('60')
  })

  it('emits update:refreshInterval when refresh interval changes', async () => {
    const wrapper = mount(GeneralSettings, {
      props: { config: defaultConfig },
    })
    const input = wrapper.find('input[type="number"]')
    await input.setValue(120)
    expect(wrapper.emitted()['update:refreshInterval']?.[0]).toEqual([120])
  })

  it('panel bg color input has correct value', () => {
    const config = { ...defaultConfig, panelBgColor: '#ff0000' }
    const wrapper = mount(GeneralSettings, { props: { config } })
    const input = wrapper.find('input[type="color"]')
    expect((input.element as HTMLInputElement).value).toBe('#ff0000')
  })

  it('emits update:panelBgColor when color changes', async () => {
    const wrapper = mount(GeneralSettings, {
      props: { config: defaultConfig },
    })
    const input = wrapper.find('input[type="color"]')
    await input.setValue('#00ff00')
    expect(wrapper.emitted()['update:panelBgColor']?.[0]).toEqual(['#00ff00'])
  })

  it('opacity slider has correct value', () => {
    const config = { ...defaultConfig, panelOpacity: 0.5 }
    const wrapper = mount(GeneralSettings, { props: { config } })
    const slider = wrapper.find('input[type="range"]')
    expect((slider.element as HTMLInputElement).value).toBe('0.5')
  })

  it('panel edge select has 4 options', () => {
    const wrapper = mount(GeneralSettings, {
      props: { config: defaultConfig },
    })
    const options = wrapper.findAll('select option')
    expect(options.length).toBe(4)
  })

  it('locked checkbox has correct state', () => {
    const config = { ...defaultConfig, panelLocked: true }
    const wrapper = mount(GeneralSettings, { props: { config } })
    const checkbox = wrapper.find('input[type="checkbox"]')
    expect((checkbox.element as HTMLInputElement).checked).toBe(true)
  })

  it('auto start checkbox has correct state', () => {
    const config = { ...defaultConfig, autoStart: true }
    const wrapper = mount(GeneralSettings, { props: { config } })
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    const autoStartCheckbox = checkboxes[1]
    expect((autoStartCheckbox.element as HTMLInputElement).checked).toBe(true)
  })

  it('emits update:autoStart when auto start checkbox changes', async () => {
    const wrapper = mount(GeneralSettings, {
      props: { config: defaultConfig },
    })
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    const autoStartCheckbox = checkboxes[1]
    await autoStartCheckbox.setValue(true)
    expect(wrapper.emitted()['update:autoStart']?.[0]).toEqual([true])
  })
})
