import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import DisplaySettings from '@/components/config/DisplaySettings.vue'
import { createDefaultConfig } from '@/types/data-model'

describe('DisplaySettings', () => {
  const defaultConfig = createDefaultConfig()

  it('renders all form fields', () => {
    const wrapper = mount(DisplaySettings, {
      props: { config: defaultConfig },
    })
    const inputs = wrapper.findAll('input')
    expect(inputs.length).toBe(7) // 2 number, 3 color, 1 checkbox, 1 checkbox for alert
    expect(wrapper.find('select').exists()).toBe(false)
  })

  it('threshold1 input has correct value', () => {
    const config = { ...defaultConfig, threshold1: 60 }
    const wrapper = mount(DisplaySettings, { props: { config } })
    const input = wrapper.find('input[type="number"]')
    expect((input.element as HTMLInputElement).value).toBe('60')
  })

  it('emits update:threshold1 when threshold1 changes', async () => {
    const wrapper = mount(DisplaySettings, {
      props: { config: defaultConfig },
    })
    const input = wrapper.find('input[type="number"]')
    await input.setValue(75)
    expect(wrapper.emitted()['update:threshold1']?.[0]).toEqual([75])
  })

  it('three color inputs exist with correct values', () => {
    const config = {
      ...defaultConfig,
      thresholdColor1: '#ff0000',
      thresholdColor2: '#00ff00',
      thresholdColor3: '#0000ff',
    }
    const wrapper = mount(DisplaySettings, { props: { config } })
    const colorInputs = wrapper.findAll('input[type="color"]')
    expect(colorInputs.length).toBe(3)
    expect((colorInputs[0].element as HTMLInputElement).value).toBe('#ff0000')
    expect((colorInputs[1].element as HTMLInputElement).value).toBe('#00ff00')
    expect((colorInputs[2].element as HTMLInputElement).value).toBe('#0000ff')
  })

  it('alert checkbox has correct state when disabled', () => {
    const config = { ...defaultConfig, alertEnabled: false }
    const wrapper = mount(DisplaySettings, { props: { config } })
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    expect((checkboxes[0].element as HTMLInputElement).checked).toBe(false)
  })

  it('alert threshold is hidden when alertEnabled is false', () => {
    const config = { ...defaultConfig, alertEnabled: false }
    const wrapper = mount(DisplaySettings, { props: { config } })
    const numberInputs = wrapper.findAll('input[type="number"]')
    expect(numberInputs.length).toBe(2) // threshold1 and threshold2 only
  })

  it('alert threshold is visible when alertEnabled is true', () => {
    const config = { ...defaultConfig, alertEnabled: true }
    const wrapper = mount(DisplaySettings, { props: { config } })
    const numberInputs = wrapper.findAll('input[type="number"]')
    expect(numberInputs.length).toBe(3) // threshold1, threshold2, and alertThreshold
  })

  it('emits update:alertEnabled when alert checkbox changes', async () => {
    const config = { ...defaultConfig, alertEnabled: true }
    const wrapper = mount(DisplaySettings, { props: { config } })
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    // alertEnabled checkbox is the first one
    await checkboxes[0].setValue(false)
    expect(wrapper.emitted()['update:alertEnabled']?.[0]).toEqual([false])
  })
})
