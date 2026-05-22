# 配置指南

本文档说明 Coding Plan Monitor 的配置项、默认值、供应商鉴权方式和配置文件位置。

## 1. 配置文件位置

默认配置文件路径：

```text
~/.config/coding-plan-monitor/config.json
```

应用首次启动时，如果配置文件不存在，会自动创建默认配置；如果配置文件损坏，会回退到默认配置并记录警告日志。

> 注意：配置文件可能包含 API Key 或 OAuth Token，请勿提交到代码仓库或发送给他人。

## 2. 默认配置

| 配置项 | 默认值 | 说明 |
|---|---:|---|
| `refreshInterval` | `30` | 数据刷新间隔，单位秒 |
| `carouselInterval` | `10` | 供应商轮播间隔，单位秒 |
| `panelBgColor` | `#333333` | 面板背景色 |
| `panelOpacity` | `0.8` | 面板透明度，范围 0-1 |
| `panelEdge` | `top` | 默认吸附边 |
| `panelLocked` | `false` | 是否锁定面板位置 |
| `clickThrough` | `false` | 是否启用点击穿透 |
| `threshold1` | `50` | 一级阈值，低于该值使用一级颜色 |
| `threshold2` | `80` | 二级阈值，达到后使用三级颜色 |
| `thresholdColor1` | `#4caf50` | 低使用率颜色 |
| `thresholdColor2` | `#ff9800` | 中等使用率颜色 |
| `thresholdColor3` | `#f44336` | 高使用率颜色 |
| `alertEnabled` | `true` | 是否启用限额提醒 |
| `alertThreshold` | `80` | 限额提醒阈值 |
| `autoStart` | `false` | 是否开机自启动 |
| `oauthPort` | `9527` | OAuth 本地回调端口 |
| `providers` | `[]` | 供应商配置列表 |

## 3. 供应商配置

供应商配置使用统一结构：

```json
{
  "providerId": "minimax",
  "enabled": true,
  "authType": "apikey",
  "apiKey": "your-api-key"
}
```

### 字段说明

| 字段 | 说明 |
|---|---|
| `providerId` | 供应商 ID，可选 `zhipu`、`minimax`、`volcengine` |
| `enabled` | 是否启用该供应商 |
| `authType` | 鉴权类型：`apikey` 或 `oauth` |
| `apiKey` | API Key 供应商使用 |
| `token` | OAuth 供应商使用 |
| `tokenExpireAt` | OAuth token 过期时间，Unix 毫秒时间戳 |

## 4. 支持的供应商

| 供应商 | providerId | 鉴权方式 | 说明 |
|---|---|---|---|
| 智谱 CodingPlan | `zhipu` | API Key / Token | 展示 5 小时额度、周额度、MCP 月额度、今日 Token 消耗 |
| MiniMax TokenPlan | `minimax` | API Key | 展示文本和图像生成额度 |
| 火山 CodingPlan | `volcengine` | OAuth Token | 展示 5 小时额度、周额度、MCP 月额度、今日 Token 消耗 |

## 5. 阈值与颜色

进度条颜色由 `threshold1`、`threshold2` 和三级颜色共同决定：

- `< threshold1`：使用 `thresholdColor1`
- `>= threshold1 && < threshold2`：使用 `thresholdColor2`
- `>= threshold2`：使用 `thresholdColor3`

限额提醒由 `alertEnabled` 与 `alertThreshold` 控制。达到提醒阈值时发送系统通知。

## 6. OAuth 端口

默认 OAuth 回调端口为 `9527`。如果该端口被占用，可在配置中调整 `oauthPort`，或通过配置窗口修改。

OAuth 回调地址格式通常为：

```text
http://localhost:<oauthPort>/callback
```

## 7. 安全建议

- 不要将 `config.json` 提交到版本控制。
- 不要在截图、日志或 Issue 中暴露 API Key / Token。
- 当前版本在 Unix 环境下会尽量将配置文件权限设置为 `0600`，但长期建议迁移到 OS Keychain 或 Stronghold。
