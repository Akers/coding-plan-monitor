/**
 * 轮播定时器 ID
 */
let carouselTimer: ReturnType<typeof setInterval> | null = null

/**
 * 存储的 stores 引用（用于 resetCarousel）
 */
let storedUsageStore: { nextProvider(): void; enabledProviders?: any[] } | null = null
let storedConfigStore: { config: { carouselInterval: number; providers: any[] } } | null = null

/**
 * 启动供应商轮播
 * @param usageStore 额度数据存储
 * @param configStore 配置存储
 */
export function startCarousel(
  usageStore: { nextProvider(): void; enabledProviders?: any[] },
  configStore: { config: { carouselInterval: number; providers: any[] } }
): void {
  // 如果只有一个或没有启用供应商，不启动轮播
  const enabledProviders = usageStore.enabledProviders || configStore.config.providers.filter((p: any) => p.enabled)
  if (enabledProviders.length <= 1) {
    return
  }

  // 保存 stores 引用以便 resetCarousel 使用
  storedUsageStore = usageStore
  storedConfigStore = configStore

  // 如果已有定时器，先清除
  if (carouselTimer !== null) {
    clearInterval(carouselTimer)
  }

  // 启动新的定时器
  const intervalMs = configStore.config.carouselInterval * 1000
  carouselTimer = setInterval(() => {
    usageStore.nextProvider()
  }, intervalMs)
}

/**
 * 停止轮播
 */
export function stopCarousel(): void {
  if (carouselTimer !== null) {
    clearInterval(carouselTimer)
    carouselTimer = null
  }
  // 注意：不清除 storedUsageStore 和 storedConfigStore
  // 这样 restartCarousel 可以使用相同的配置
}

/**
 * 重置轮播计时器（手动切换后调用）
 * 重新启动定时器，计时从头开始
 */
export function resetCarousel(): void {
  if (storedUsageStore === null || storedConfigStore === null) {
    return // 尚未启动，不做操作
  }

  // 重启定时器
  if (carouselTimer !== null) {
    clearInterval(carouselTimer)
    carouselTimer = null
  }

  const intervalMs = storedConfigStore.config.carouselInterval * 1000
  carouselTimer = setInterval(() => {
    storedUsageStore!.nextProvider()
  }, intervalMs)
}

/**
 * 重启轮播（配置变更时调用）
 * @param usageStore 额度数据存储
 * @param configStore 配置存储
 */
export function restartCarousel(
  usageStore: { nextProvider(): void; enabledProviders?: any[] },
  configStore: { config: { carouselInterval: number; providers: any[] } }
): void {
  stopCarousel()
  startCarousel(usageStore, configStore)
}
