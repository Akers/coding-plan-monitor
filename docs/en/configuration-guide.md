# Configuration Guide

This document describes configuration fields, defaults, provider credentials, thresholds, and the configuration file location.

## 1. Configuration File Location

Default configuration file:

```text
~/.config/coding-plan-monitor/config.json
```

If the file does not exist, the app creates it with default values. If it is corrupted, the app falls back to default configuration and logs a warning.

> Note: the configuration file may contain API keys or OAuth tokens. Do not commit it or share it.

## 2. Default Configuration

| Field | Default | Description |
|---|---:|---|
| `refreshInterval` | `30` | Usage refresh interval in seconds |
| `carouselInterval` | `10` | Provider carousel interval in seconds |
| `panelBgColor` | `#333333` | Panel background color |
| `panelOpacity` | `0.8` | Panel opacity, range 0-1 |
| `panelEdge` | `top` | Default snap edge |
| `panelLocked` | `false` | Whether panel position is locked |
| `clickThrough` | `false` | Whether click-through mode is enabled |
| `threshold1` | `50` | First threshold |
| `threshold2` | `80` | Second threshold |
| `thresholdColor1` | `#4caf50` | Low usage color |
| `thresholdColor2` | `#ff9800` | Medium usage color |
| `thresholdColor3` | `#f44336` | High usage color |
| `alertEnabled` | `true` | Whether quota alerts are enabled |
| `alertThreshold` | `80` | Alert threshold percentage |
| `autoStart` | `false` | Whether autostart is enabled |
| `oauthPort` | `9527` | Local OAuth callback port |
| `providers` | `[]` | Provider configuration list |

## 3. Provider Configuration

Provider settings use a unified shape:

```json
{
  "providerId": "minimax",
  "enabled": true,
  "authType": "apikey",
  "apiKey": "your-api-key"
}
```

### Fields

| Field | Description |
|---|---|
| `providerId` | Provider ID: `zhipu`, `minimax`, or `volcengine` |
| `enabled` | Whether this provider is enabled |
| `authType` | Credential type: `apikey` or `oauth` |
| `apiKey` | Used by API key providers |
| `token` | Used by OAuth providers |
| `tokenExpireAt` | OAuth token expiration timestamp in Unix milliseconds |

## 4. Supported Providers

| Provider | providerId | Auth | Description |
|---|---|---|---|
| Zhipu CodingPlan | `zhipu` | API Key / Token | 5-hour quota, weekly quota, MCP monthly quota, daily token usage |
| MiniMax TokenPlan | `minimax` | API Key | Text and image generation quota |
| Volcengine CodingPlan | `volcengine` | OAuth Token | 5-hour quota, weekly quota, MCP monthly quota, daily token usage |

## 5. Thresholds and Colors

Progress bar colors are decided by `threshold1`, `threshold2`, and the three color fields:

- `< threshold1`: `thresholdColor1`
- `>= threshold1 && < threshold2`: `thresholdColor2`
- `>= threshold2`: `thresholdColor3`

Quota notifications are controlled by `alertEnabled` and `alertThreshold`.

## 6. OAuth Port

The default OAuth callback port is `9527`. If the port is occupied, change `oauthPort` in the configuration or through the configuration window.

OAuth callback URL format:

```text
http://localhost:<oauthPort>/callback
```

## 7. Security Notes

- Do not commit `config.json` to version control.
- Do not expose API keys or tokens in screenshots, logs, or issues.
- The current version attempts to set Unix config file permissions to `0600`, but long-term storage should move to OS Keychain or Stronghold.
