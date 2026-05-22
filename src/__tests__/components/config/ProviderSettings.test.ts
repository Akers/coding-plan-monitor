import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ProviderSettings from '@/components/config/ProviderSettings.vue'
import type { ProviderConfig } from '@/types/data-model'

describe('ProviderSettings', () => {
  const mockProviders: ProviderConfig[] = [
    { providerId: 'zhipu', enabled: true, authType: 'oauth' },
    { providerId: 'minimax', enabled: true, authType: 'apikey', apiKey: 'test-key' },
    { providerId: 'volcengine', enabled: false, authType: 'oauth' },
  ]

  it('renders all providers', () => {
    const wrapper = mount(ProviderSettings, {
      props: { providers: mockProviders },
    })
    const items = wrapper.findAll('.provider-item')
    expect(items.length).toBe(3)
  })

  it('displays provider names', () => {
    const wrapper = mount(ProviderSettings, {
      props: { providers: mockProviders },
    })
    const names = wrapper.findAll('.provider-name')
    expect(names[0].text()).toBe('智谱')
    expect(names[1].text()).toBe('MiniMax')
    expect(names[2].text()).toBe('火山')
  })

  it('enabled checkbox state is correct', () => {
    const wrapper = mount(ProviderSettings, {
      props: { providers: mockProviders },
    })
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    expect((checkboxes[0].element as HTMLInputElement).checked).toBe(true)
    expect((checkboxes[1].element as HTMLInputElement).checked).toBe(true)
    expect((checkboxes[2].element as HTMLInputElement).checked).toBe(false)
  })

  it('emits toggleProvider when checkbox is clicked', async () => {
    const wrapper = mount(ProviderSettings, {
      props: { providers: mockProviders },
    })
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    await checkboxes[0].setValue(false)
    expect(wrapper.emitted()['toggleProvider']?.[0]).toEqual(['zhipu'])
  })

  it('apikey provider shows password input', () => {
    const wrapper = mount(ProviderSettings, {
      props: { providers: mockProviders },
    })
    const passwordInputs = wrapper.findAll('input[type="password"]')
    expect(passwordInputs.length).toBe(1)
  })

  it('oauth provider shows authorization button', () => {
    const wrapper = mount(ProviderSettings, {
      props: { providers: mockProviders },
    })
    const oauthBtns = wrapper.findAll('.oauth-btn')
    expect(oauthBtns.length).toBe(1) // Only zhipu is enabled oauth
  })

  it('disabled provider does not show config area', () => {
    const wrapper = mount(ProviderSettings, {
      props: { providers: mockProviders },
    })
    const items = wrapper.findAll('.provider-item')
    // Third provider (volcengine) is disabled, should not have config
    const thirdProviderConfig = items[2].find('.provider-config')
    expect(thirdProviderConfig.exists()).toBe(false)
  })

  it('validate button exists and emits validateProvider', async () => {
    const wrapper = mount(ProviderSettings, {
      props: { providers: mockProviders },
    })
    const validateBtns = wrapper.findAll('.validate-btn')
    expect(validateBtns.length).toBe(2) // Only for enabled providers
    await validateBtns[0].trigger('click')
    expect(wrapper.emitted()['validateProvider']?.[0]).toEqual(['zhipu'])
  })

  it('shows authorized status for oauth provider with token', () => {
    const providersWithToken: ProviderConfig[] = [
      { providerId: 'zhipu', enabled: true, authType: 'oauth', token: 'abc123' },
    ]
    const wrapper = mount(ProviderSettings, {
      props: { providers: providersWithToken },
    })
    const status = wrapper.find('.auth-status')
    expect(status.exists()).toBe(true)
    expect(status.text()).toBe('已授权')
  })

  it('shows login button for oauth provider without token', () => {
    const providersWithoutToken: ProviderConfig[] = [
      { providerId: 'zhipu', enabled: true, authType: 'oauth' },
    ]
    const wrapper = mount(ProviderSettings, {
      props: { providers: providersWithoutToken },
    })
    const oauthBtn = wrapper.find('.oauth-btn')
    expect(oauthBtn.text()).toBe('登录授权')
  })
})
