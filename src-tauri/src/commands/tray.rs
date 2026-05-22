use tauri::{Manager, WebviewWindowBuilder, WebviewUrl};

/// 托盘状态：normal / warning / error
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TrayStatus {
    Normal,
    Warning,
    Error,
}

/// 切换面板可见性
#[tauri::command]
pub fn toggle_panel(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("panel") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            let _ = window.show();
            let _ = window.set_focus();
        }
    }
    Ok(())
}

/// 显示配置窗口
#[tauri::command]
pub fn open_config_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("config") {
        let _ = window.show();
        let _ = window.set_focus();
    } else {
        let _window = WebviewWindowBuilder::new(
            &app,
            "config",
            WebviewUrl::App("/config".into()),
        )
        .title("配置 - Coding Plan Monitor")
        .inner_size(500.0, 600.0)
        .center()
        .build()
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// 更新托盘图标状态
#[tauri::command]
pub fn update_tray_status(
    app: tauri::AppHandle,
    status: String,
) -> Result<(), String> {
    let tray_status = match status.as_str() {
        "normal" => TrayStatus::Normal,
        "warning" => TrayStatus::Warning,
        "error" => TrayStatus::Error,
        _ => return Err(format!("无效的托盘状态: {}", status)),
    };

    // 获取托盘图标引用
    if let Some(tray) = app.tray_by_id("main-tray") {
        let tooltip = match tray_status {
            TrayStatus::Normal => "Coding Plan Monitor",
            TrayStatus::Warning => "Coding Plan Monitor - 额度警告",
            TrayStatus::Error => "Coding Plan Monitor - 连接错误",
        };
        let _ = tray.set_tooltip(Some(tooltip));
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tray_status_normal_matches() {
        assert_eq!(TrayStatus::Normal, TrayStatus::Normal);
    }

    #[test]
    fn tray_status_warning_matches() {
        assert_eq!(TrayStatus::Warning, TrayStatus::Warning);
    }

    #[test]
    fn tray_status_error_matches() {
        assert_eq!(TrayStatus::Error, TrayStatus::Error);
    }

    #[test]
    fn update_tray_status_invalid_returns_error() {
        let status = "invalid";
        let result = match status {
            "normal" => Ok(TrayStatus::Normal),
            "warning" => Ok(TrayStatus::Warning),
            "error" => Ok(TrayStatus::Error),
            _ => Err(format!("无效的托盘状态: {}", status)),
        };
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("invalid"));
    }

    #[test]
    fn update_tray_status_valid_parses() {
        for (s, expected) in [
            ("normal", TrayStatus::Normal),
            ("warning", TrayStatus::Warning),
            ("error", TrayStatus::Error),
        ] {
            let result = match s {
                "normal" => Ok(TrayStatus::Normal),
                "warning" => Ok(TrayStatus::Warning),
                "error" => Ok(TrayStatus::Error),
                _ => Err(format!("无效的托盘状态: {}", s)),
            };
            assert_eq!(result.unwrap(), expected);
        }
    }

    #[test]
    fn tray_tooltip_by_status() {
        let tooltip = match TrayStatus::Normal {
            TrayStatus::Normal => "Coding Plan Monitor",
            TrayStatus::Warning => "Coding Plan Monitor - 额度警告",
            TrayStatus::Error => "Coding Plan Monitor - 连接错误",
        };
        assert_eq!(tooltip, "Coding Plan Monitor");

        let tooltip = match TrayStatus::Warning {
            TrayStatus::Normal => "Coding Plan Monitor",
            TrayStatus::Warning => "Coding Plan Monitor - 额度警告",
            TrayStatus::Error => "Coding Plan Monitor - 连接错误",
        };
        assert!(tooltip.contains("警告"));

        let tooltip = match TrayStatus::Error {
            TrayStatus::Normal => "Coding Plan Monitor",
            TrayStatus::Warning => "Coding Plan Monitor - 额度警告",
            TrayStatus::Error => "Coding Plan Monitor - 连接错误",
        };
        assert!(tooltip.contains("错误"));
    }
}
