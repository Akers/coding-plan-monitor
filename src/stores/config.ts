import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { createDefaultConfig, type AppConfig } from '@/types/data-model'

export const useConfigStore = defineStore('config', () => {
  /** 当前配置（响应式） */
  const config = reactive<AppConfig>(createDefaultConfig())

  /** 是否已从后端加载 */
  const loaded = ref(false)

  /** 是否有未保存的修改 */
  const dirty = ref(false)

  /** 保存前的配置快照（用于取消恢复） */
  let savedSnapshot: AppConfig | null = null

  /**
   * 从 Rust 后端加载配置
   */
  async function loadConfig(): Promise<void> {
    try {
      const data = await invoke<AppConfig>('load_config')
      Object.assign(config, data)
      savedSnapshot = JSON.parse(JSON.stringify(data))
    } catch {
      // 加载失败时使用默认配置
      const defaults = createDefaultConfig()
      Object.assign(config, defaults)
      savedSnapshot = JSON.parse(JSON.stringify(defaults))
    }
    loaded.value = true
    dirty.value = false
  }

  /**
   * 保存当前配置到 Rust 后端
   */
  async function saveConfig(): Promise<void> {
    await invoke('save_config', { config })
    savedSnapshot = JSON.parse(JSON.stringify(config))
    dirty.value = false
  }

  /**
   * 部分更新配置字段
   */
  function updateConfig(partial: Partial<AppConfig>): void {
    Object.assign(config, partial)
    dirty.value = true
  }

  /**
   * 恢复到上次保存的状态
   */
  function cancelChanges(): void {
    if (savedSnapshot) {
      Object.assign(config, savedSnapshot)
      dirty.value = false
    }
  }

  /**
   * 重置为默认配置
   */
  function resetConfig(): void {
    const defaults = createDefaultConfig()
    Object.assign(config, defaults)
    dirty.value = false
  }

  return {
    config,
    loaded,
    dirty,
    loadConfig,
    saveConfig,
    updateConfig,
    cancelChanges,
    resetConfig,
  }
})
