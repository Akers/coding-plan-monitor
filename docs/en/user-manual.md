# User Manual

This document explains common usage flows for Coding Plan Monitor, including the floating panel, tray menu, configuration window, and OAuth authorization.

## 1. Start the App

In development mode:

```bash
npm run tauri dev
```

After startup, the app shows a borderless always-on-top floating panel and a system tray icon.

## 2. Floating Panel

The floating panel displays usage data for the current provider.

### Main Areas

- Top: provider tabs for manual switching.
- Middle: usage metrics with progress bars, percentages, used/total values, and units.
- Bottom: last refresh time, lock, minimize, and settings buttons.

### Interactions

- **Drag**: drag the panel when it is not locked and click-through is disabled.
- **Snap to edge**: drag the panel near a screen edge to snap it.
- **Minimize**: collapse the panel after it is snapped to an edge.
- **Expand**: click the collapsed arrow button to restore the panel.
- **Manual refresh**: open the panel context menu and choose “Refresh”.
- **Open settings**: click the settings button or use the tray menu.

## 3. System Tray

The tray icon provides quick actions and status indication.

### Tray States

- Normal: all enabled providers are below the alert threshold.
- Warning: at least one provider metric reaches the alert threshold.
- Error: all enabled providers fail to refresh.

### Tray Menu

- Show/hide panel
- Open configuration window
- Quit application

## 4. Configuration Window

The configuration window has three tabs:

1. **General Settings**: refresh interval, carousel interval, background color, opacity, snap edge, lock, and autostart.
2. **Quota Display**: thresholds, progress bar colors, quota alerts, and alert threshold.
3. **Providers**: enable or disable providers, enter API keys, start OAuth authorization, and validate provider settings.

Click “Save” to persist changes and notify the floating panel to reload configuration. Click “Cancel” to discard unsaved changes.

## 5. Provider Authorization

### API Key Providers

Enter the API key in provider settings, then click “Validate”. Save the configuration after validation.

### OAuth Providers

Click “Authorize”. The app starts a temporary local callback server and opens the browser. After authorization succeeds, the provider redirects back to the local callback URL and the app stores the token.

The default OAuth callback port is `9527` and can be changed in configuration.

## 6. Quota Alerts

When alerts are enabled, the app checks usage percentage after each refresh. If a metric reaches the alert threshold, the app sends a system notification and updates the tray state.

## 7. Logs and Configuration Files

- Configuration file: `~/.config/coding-plan-monitor/config.json`
- Logs: written by the Tauri log plugin to the system application log directory

Do not share the configuration file publicly because it may contain API keys or OAuth tokens.
